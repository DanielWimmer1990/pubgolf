-- Pubgolf — Supabase schema
-- Run once in the Supabase SQL editor (project: Settings -> Database -> SQL Editor).
-- No CLI/migrations folder is used, matching the Match Mate project's approach.

create extension if not exists "uuid-ossp";

-- ── GAMES ──────────────────────────────────────────────────────────────────
create table games (
  id                                uuid default uuid_generate_v4() primary key,
  created_at                        timestamptz default now(),
  code                              text not null unique,
  name                              text,
  status                            text not null default 'lobby'
                                      check (status in ('lobby', 'in_progress', 'finished')),
  scoring_table                     jsonb not null,
  current_round_number              integer not null default 0,
  started_at                        timestamptz,
  finished_at                       timestamptz,
  header_image_url                  text,
  default_drink                     text,
  -- Sign convention, kept consistent with sip scoring (over PAR = plus,
  -- under PAR = minus) and penalty_types below: bad things (breaking a
  -- rule, losing a minigame) give plus points, good things (winning) give
  -- minus points.
  default_rule_points               integer not null default 2,
  default_minigame_points_winner    integer not null default -1,
  default_minigame_points_loser     integer not null default 1,
  show_final_presentation           boolean not null default true,
  show_live_leaderboard             boolean not null default true,
  hide_leaderboard_final_round      boolean not null default false,
  penalty_types                     jsonb not null default '[
                                       {"id": "water_hazard", "name": "Water Hazard (Klogang)", "points": 10, "icon": "🚽"},
                                       {"id": "spill", "name": "Getränk umschütten", "points": 5, "icon": "💧"},
                                       {"id": "vomit", "name": "Kotzen", "points": 20, "icon": "🤮"}
                                     ]'::jsonb
);

-- ── PLAYERS ────────────────────────────────────────────────────────────────
create table players (
  id            uuid default uuid_generate_v4() primary key,
  created_at    timestamptz default now(),
  game_id       uuid not null references games(id) on delete cascade,
  device_token  uuid not null,
  name          text not null,
  color         text not null,
  avatar_emoji  text,
  turn_order    integer not null,
  is_host       boolean not null default false,
  unique (game_id, device_token)
);

-- ── ROUNDS ─────────────────────────────────────────────────────────────────
create table rounds (
  id                      uuid default uuid_generate_v4() primary key,
  created_at              timestamptz default now(),
  game_id                 uuid not null references games(id) on delete cascade,
  round_number            integer not null,
  active_player_id        uuid not null references players(id),
  bar_name                text,
  drink_description       text,
  par                     integer check (par between 1 and 6),
  status                  text not null default 'setup'
                            check (status in ('setup', 'active', 'done')),
  minigame_name           text,
  minigame_points_winner  integer,
  minigame_points_loser   integer,
  is_final_round          boolean not null default false,
  -- Live draft of the rule the host is currently typing during round setup,
  -- synced so spectators can see it forming before "Runde starten" commits
  -- the real row into `rules`. Superseded/ignored once the round is active.
  draft_rule_text         text,
  draft_rule_points       integer,
  unique (game_id, round_number)
);

-- ── ROUND_DRINKS (sip report + server-computed points) ──────────────────────
-- game_id is denormalized (derivable via round_id -> rounds.game_id) purely so
-- Realtime subscriptions can filter directly on it, like every other table.
create table round_drinks (
  id            uuid default uuid_generate_v4() primary key,
  round_id      uuid not null references rounds(id) on delete cascade,
  game_id       uuid not null references games(id) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,
  sips          integer check (sips >= 1),
  points        integer,
  reported_at   timestamptz,
  unique (round_id, player_id)
);

-- ── RULES (persistent for the rest of the game once declared) ───────────────
create table rules (
  id                    uuid default uuid_generate_v4() primary key,
  created_at            timestamptz default now(),
  game_id               uuid not null references games(id) on delete cascade,
  round_id              uuid not null references rounds(id),
  created_by_player_id  uuid not null references players(id),
  text                  text not null,
  violation_points      integer not null
);

-- ── RULE_VIOLATIONS (reportable at any time by anyone) ───────────────────────
-- round_id is nullable: violations can in principle be reported outside any
-- round, but is populated whenever reported during a round so the per-round
-- UI can show only that round's freshly-logged violations (older ones still
-- count toward the overall leaderboard regardless of round_id).
create table rule_violations (
  id                      uuid default uuid_generate_v4() primary key,
  created_at              timestamptz default now(),
  game_id                 uuid not null references games(id) on delete cascade,
  rule_id                 uuid not null references rules(id) on delete cascade,
  round_id                uuid references rounds(id) on delete set null,
  violator_player_id      uuid not null references players(id) on delete cascade,
  reported_by_player_id   uuid not null references players(id),
  points_applied          integer not null
);

-- ── MINIGAME_RESULTS ──────────────────────────────────────────────────────────
create table minigame_results (
  id                      uuid default uuid_generate_v4() primary key,
  created_at              timestamptz default now(),
  game_id                 uuid not null references games(id) on delete cascade,
  round_id                uuid not null references rounds(id) on delete cascade,
  player_id               uuid not null references players(id) on delete cascade,
  outcome                 text not null check (outcome in ('winner', 'loser', 'neutral')),
  points_applied          integer not null,
  recorded_by_player_id   uuid not null references players(id),
  unique (round_id, player_id)
);

-- ── POINT_ADJUSTMENTS (flexible, repeatable host-logged penalties) ──────────
-- Free-form point deltas the host logs during a round (e.g. from a
-- configured penalty_types preset like "Water Hazard", or any ad-hoc
-- amount). Not tied to a specific declared rule, and repeatable per player
-- within a round (multiple bathroom trips are allowed in golf, apparently).
create table point_adjustments (
  id                      uuid default uuid_generate_v4() primary key,
  created_at              timestamptz default now(),
  game_id                 uuid not null references games(id) on delete cascade,
  round_id                uuid not null references rounds(id) on delete cascade,
  player_id               uuid not null references players(id) on delete cascade,
  label                   text not null,
  points                  integer not null,
  created_by_player_id    uuid not null references players(id)
);

-- ── RULE_TEMPLATES / MINIGAME_TEMPLATES ─────────────────────────────────────
-- A shared, growing library of house-rule and minigame presets, offered as
-- dropdown suggestions in the round setup (in addition to typing your own).
-- Not tied to any single game — every custom rule/minigame a host types in
-- gets added here too (see RoundSetup.tsx), so the pool grows over time.
-- `description` holds the full explanatory sentence (from Regeln.docx /
-- Minispiele.docx), shown in an info box next to the short suggestion text.
create table rule_templates (
  id          uuid default uuid_generate_v4() primary key,
  created_at  timestamptz default now(),
  text        text not null unique,
  description text
);

create table minigame_templates (
  id          uuid default uuid_generate_v4() primary key,
  created_at  timestamptz default now(),
  name        text not null unique,
  description text
);

insert into rule_templates (text, description) values
  ('Keine Namen', 'Es dürfen keine Namen genannt werden.'),
  ('Königliches WIR', 'Statt „ich“ darf nur noch „wir“ gesagt werden.'),
  ('Kein Fluchen', 'Es darf nicht geflucht werden.'),
  ('Fluchen nur mit Kompliment', 'Fluchen ist nur erlaubt, wenn direkt danach ein Kompliment folgt.'),
  ('Kein Zeigen', 'Es darf auf nichts und niemanden gezeigt werden.'),
  ('Nicht ins Gesicht fassen', 'Man darf sich nicht oberhalb des Halses berühren.'),
  ('Fotobomb', 'Der Spieler darf jederzeit „FOTO!“ rufen und ein Selfie machen. Wer nicht auf dem Foto ist, bekommt Strafpunkte.'),
  ('Schwache Hand', 'Es darf nur mit der schwachen Hand getrunken werden.'),
  ('Hund Sitz', 'Wer einen Hund sieht und zuerst „Hund Sitz!“ ruft, bekommt Gutpunkte.'),
  ('Magische Fee', 'Vor jedem Schluck muss die imaginäre Fee vom Glas genommen und danach wieder daraufgesetzt werden.'),
  ('Pfeifen', 'Vor jedem Schluck muss ins Getränk gepfiffen werden.'),
  ('Candy', 'Wer ein Candy ins Getränk trifft, bekommt Gutpunkte.'),
  ('Aufstehen', 'Vor jedem Sprechen muss man aufstehen.'),
  ('Königliche Welle', 'Vor jedem Schluck muss eine königliche Welle gemacht werden.'),
  ('Wortverbot', 'Bestimmte Wörter dürfen nicht gesagt werden (z. B. „Ja“, „Nein“, „Hallo“).'),
  ('Kein Augenkontakt', 'Bei Augenkontakt bekommen beide Spieler Strafpunkte.'),
  ('Kein Kratzen', 'Man darf sich nicht kratzen.'),
  ('Neuer Name', 'Jeder Spieler erhält einen neuen Namen, der für das gesamte Spiel gilt.'),
  ('Nichts berühren', 'Man darf nichts berühren und sich nirgends anlehnen.'),
  ('Gleich gesagt', 'Wer gleichzeitig dasselbe wie ein anderer Spieler sagt, bekommt Gutpunkte.'),
  ('Letzter ausgetrunken', 'Wer als Letzter austrinkt, bekommt Strafpunkte.'),
  ('Vorletzter ausgetrunken', 'Wer als Vorletzter austrinkt, bekommt Strafpunkte.'),
  ('Kein Lachen', 'Es darf nicht gelacht werden.'),
  ('Finger hoch', 'Beim Trinken muss der kleine Finger abgespreizt werden.'),
  ('Questionmaster', 'Es darf nicht mehr auf Fragen geantwortet werden.'),
  ('Andere Sprache', 'Es darf nur mehr z. B. auf Englisch gesprochen werden.'),
  ('Daumenregel', 'Legt ein Spieler unauffällig den Daumen auf den Tisch, müssen alle nachziehen. Der Letzte bekommt Strafpunkte.'),
  ('Verbeugen', 'Vor dem Hinsetzen muss man sich vor der Gruppe verbeugen.')
on conflict (text) do update set description = excluded.description;

insert into minigame_templates (name, description) values
  ('Gleich geschrieben', 'Es werden 3 Runden mit unterschiedlichen Kategorien (z. B. Monate, Planeten) gespielt. Jeder schreibt verdeckt einen passenden Begriff auf. Haben zwei oder mehr Spieler denselben Begriff, erhalten diese Strafpunkte.'),
  ('Liedtext erraten', 'Der Spieler sucht ein Lied aus, das kurz angespielt wird. Danach müssen die Spieler verdeckt aufschreiben, nach wie vielen Sekunden der erste Liedtext beginnt.'),
  ('Sternzerreißen', 'Alle stellen sich eng im Kreis auf. Dann wird gerufen: „3, 2, 1 – Sternzerreißen!“ Jeder springt gleichzeitig vom Kreis weg bzw. in eine beliebige Richtung. Danach ist reihum jeweils eine Bewegung bzw. ein Sprung erlaubt. Ziel ist es, mit dem eigenen Fuß auf den Fuß eines anderen Spielers zu steigen. Der angegriffene Spieler darf mit einer Ausweichbewegung reagieren. Wessen Fuß getroffen wird, scheidet aus bzw. erhält Strafpunkte.'),
  ('Knofeln', 'Jeder Spieler hält verdeckt 0–3 Münzen in der Hand. Reihum wird geschätzt, wie viele Münzen insgesamt im Spiel sind. Danach öffnen alle gleichzeitig ihre Hände. Wer die richtige Gesamtzahl errät, scheidet aus, bis nur noch ein Spieler übrig ist. In der ersten Runde darf niemand 0 Münzen in der Hand halten.'),
  ('Tip Top', 'Zwei Spieler stehen sich mit etwas Abstand gegenüber und nähern sich abwechselnd mit kleinen Fuß-an-Fuß-Schritten. Dabei wird ein Fuß immer direkt vor den anderen gesetzt. Wer zuerst auf den Schuh bzw. Fuß des anderen steigen kann, gewinnt.'),
  ('Weitsprung', 'Der Spieler, der am weitesten springt, gewinnt.'),
  ('Schere-Stein-Papier', 'Der Klassiker unter den Minispielen.'),
  ('Gleiche Zeit', 'Ein Spieler absolviert zweimal dieselbe kurze Strecke und versucht, beide Läufe möglichst exakt gleich schnell zu laufen. Je kleiner die Zeitdifferenz zwischen den beiden Läufen, desto besser.'),
  ('Stoppuhr', 'Jeder Spieler startet eine verdeckte Stoppuhr und versucht, diese nach exakt 60 Sekunden zu stoppen. Wer am nächsten an 60 Sekunden liegt, gewinnt.'),
  ('Gleiches Wort', 'Zwei Spieler sagen gleichzeitig jeweils ein beliebiges Wort. In jeder weiteren Runde versuchen sie, anhand der zuvor genannten Wörter auf dasselbe Wort zu kommen. Innerhalb von 5 Runden müssen beide gleichzeitig dasselbe Wort sagen.'),
  ('Zahlen-Duell', 'Zwei Spieler nennen gleichzeitig eine Zahl zwischen 1 und 100. Anschließend wird eine Zufallszahl gezogen. Wer näher an der gezogenen Zahl liegt, gewinnt die Runde.'),
  ('Karten Race', 'Jeder Spieler erhält ein Kartensymbol (Herz, Karo, Pik oder Kreuz). Die Karten werden nacheinander aufgedeckt. Das aufgedeckte Symbol darf jeweils eine weitere Karte ziehen. Das Symbol, das zuerst eine festgelegte Anzahl an Karten erreicht, gewinnt.'),
  ('21', 'Reihum darf jeder 1–3 aufeinanderfolgende Zahlen nennen. Wer die 21 sagen muss, verliert.'),
  ('Kategorie-Pingpong', 'Ein Spieler nennt eine Kategorie (z. B. Automarken). Reihum wird ein passender Begriff genannt. Wer einen Begriff wiederholt oder länger als 3 Sekunden überlegt, verliert.'),
  ('Daumen-Wrestling', 'Klassisches Daumen-Catchen – Best of 3.'),
  ('Reaktions-Duell', 'Zwei Spieler stehen sich gegenüber, ein Gegenstand liegt zwischen ihnen. Auf ein bestimmtes Kommando muss dieser geschnappt werden. Wer zuerst zugreift, gewinnt.'),
  ('Lippenlesen', 'Ein Spieler bekommt ein Wort und spricht es lautlos aus. Der andere hat drei Versuche, es zu erraten.'),
  ('Finger-Falle', 'Zwei Spieler zeigen gleichzeitig 1–5 Finger und nennen gleichzeitig die erwartete Gesamtsumme. Wer die Summe exakt trifft, gewinnt.')
on conflict (name) do update set description = excluded.description;

-- ── RULE_SUBMISSIONS / MINIGAME_SUBMISSIONS ─────────────────────────────────
-- Freely-typed custom rules/minigames don't join the curated dropdown pool
-- automatically (that let junk creep into the shared suggestion list).
-- Instead they land here for the host to review by hand (Supabase's Table
-- Editor doubles as a spreadsheet, with a CSV export button) and decide
-- whether to promote one into rule_templates/minigame_templates.
create table rule_submissions (
  id          uuid default uuid_generate_v4() primary key,
  created_at  timestamptz default now(),
  text        text not null,
  points      integer,
  game_name   text
);

create table minigame_submissions (
  id          uuid default uuid_generate_v4() primary key,
  created_at  timestamptz default now(),
  name        text not null,
  game_name   text
);

alter table rule_submissions enable row level security;
alter table minigame_submissions enable row level security;

-- Insert-only for players — no select/update/delete policy means RLS
-- blocks those for the anon key, so only the project owner (via the
-- Supabase dashboard, which bypasses RLS) can actually read this list.
create policy "rule_submissions_insert" on rule_submissions
  for insert to anon, authenticated with check (true);

create policy "minigame_submissions_insert" on minigame_submissions
  for insert to anon, authenticated with check (true);

-- ── SCORING TRIGGER ────────────────────────────────────────────────────────
-- Computes round_drinks.points server-side from rounds.par and games.scoring_table,
-- so points can't be tampered with client-side despite the permissive RLS below.
-- scoring_table shape: { "rows": [ { "diff": -1, "points": -2 }, { "diff": 0, "points": 0 },
-- { "diff": 1, "points": 2 } ] } — only the diff -1/0/+1 rows are stored (diff 0 is
-- always 0); every other diff is a straight multiple of the ±1 step, e.g. PAR 6
-- with 1 sip (diff -5) is 5x the diff -1 row.
create or replace function fn_calc_round_drink_points()
returns trigger as $$
declare
  v_par     integer;
  v_table   jsonb;
  v_diff    integer;
  v_over    integer;
  v_under   integer;
  v_points  integer;
begin
  select r.game_id, r.par, g.scoring_table into new.game_id, v_par, v_table
  from rounds r join games g on g.id = r.game_id
  where r.id = new.round_id;

  if new.sips is null then
    new.points := null;
    return new;
  end if;

  v_diff := new.sips - v_par;

  if v_diff = 0 then
    v_points := 0;
  else
    select (row_data->>'points')::integer into v_over
    from jsonb_array_elements(v_table->'rows') as row_data
    where (row_data->>'diff')::integer = 1;
    select (row_data->>'points')::integer into v_under
    from jsonb_array_elements(v_table->'rows') as row_data
    where (row_data->>'diff')::integer = -1;

    if v_diff > 0 then
      v_points := v_diff * coalesce(v_over, 0);
    else
      v_points := -v_diff * coalesce(v_under, 0);
    end if;
  end if;

  new.points := coalesce(v_points, 0);
  new.reported_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_round_drinks_points
before insert or update of sips on round_drinks
for each row execute function fn_calc_round_drink_points();

-- Note: rounds used to auto-complete once every player had sips recorded.
-- Now the host explicitly ends a round (minigame + penalty entries can be
-- added after sips too), so that trigger was removed — see migration 004.

-- ── REALTIME ──────────────────────────────────────────────────────────────
alter publication supabase_realtime add table
  games, players, rounds, round_drinks, rules, rule_violations, minigame_results, point_adjustments;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────
-- Deliberately permissive: there is no auth session to scope policies by
-- (players join via a game code, not Supabase Auth), and adding a server-side
-- gatekeeper (RPC + set_config, or an API route) is real added complexity for
-- a casual party game with no sensitive data. The 6-character game code
-- (see src/lib/gameCode.ts) is the only practical access gate. This is an
-- intentional tradeoff, not an oversight.
alter table games enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table round_drinks enable row level security;
alter table rules enable row level security;
alter table rule_violations enable row level security;
alter table minigame_results enable row level security;
alter table point_adjustments enable row level security;
alter table rule_templates enable row level security;
alter table minigame_templates enable row level security;

create policy "games_all" on games for all to anon, authenticated using (true) with check (true);
create policy "players_all" on players for all to anon, authenticated using (true) with check (true);
create policy "rounds_all" on rounds for all to anon, authenticated using (true) with check (true);
create policy "round_drinks_all" on round_drinks for all to anon, authenticated using (true) with check (true);
create policy "rules_all" on rules for all to anon, authenticated using (true) with check (true);
create policy "rule_violations_all" on rule_violations for all to anon, authenticated using (true) with check (true);
create policy "minigame_results_all" on minigame_results for all to anon, authenticated using (true) with check (true);
create policy "point_adjustments_all" on point_adjustments for all to anon, authenticated using (true) with check (true);
create policy "rule_templates_all" on rule_templates for all to anon, authenticated using (true) with check (true);
create policy "minigame_templates_all" on minigame_templates for all to anon, authenticated using (true) with check (true);

-- ── STORAGE (header images) ──────────────────────────────────────────────
-- Public bucket for optional per-game header/logo images. Same permissive
-- posture as the tables above — anyone with the anon key can upload, which
-- is acceptable for a casual party game with no sensitive data.
insert into storage.buckets (id, name, public)
values ('game-headers', 'game-headers', true)
on conflict (id) do nothing;

drop policy if exists "game_headers_public_read" on storage.objects;
create policy "game_headers_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'game-headers');

drop policy if exists "game_headers_public_insert" on storage.objects;
create policy "game_headers_public_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'game-headers');
