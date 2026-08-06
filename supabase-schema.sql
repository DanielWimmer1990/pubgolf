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
  default_rule_points               integer not null default -2,
  default_minigame_points_winner    integer not null default 1,
  default_minigame_points_loser     integer not null default -1,
  show_final_presentation           boolean not null default true,
  show_live_leaderboard             boolean not null default true,
  hide_leaderboard_final_round      boolean not null default false,
  penalty_types                     jsonb not null default '[
                                       {"id": "water_hazard", "name": "Water Hazard (Klogang)", "points": 10},
                                       {"id": "spill", "name": "Getränk umschütten", "points": 5},
                                       {"id": "vomit", "name": "Kotzen", "points": 20}
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
  sips          integer check (sips >= 0),
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
create table rule_violations (
  id                      uuid default uuid_generate_v4() primary key,
  created_at              timestamptz default now(),
  game_id                 uuid not null references games(id) on delete cascade,
  rule_id                 uuid not null references rules(id) on delete cascade,
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

-- ── SCORING TRIGGER ────────────────────────────────────────────────────────
-- Computes round_drinks.points server-side from rounds.par and games.scoring_table,
-- so points can't be tampered with client-side despite the permissive RLS below.
-- scoring_table shape: { "rows": [ { "diff": -3, "points": 4 }, ..., { "diff": 3, "points": -2 } ] }
-- diff = sips - par, clamped to the table's min/max row before lookup.
create or replace function fn_calc_round_drink_points()
returns trigger as $$
declare
  v_par     integer;
  v_table   jsonb;
  v_diff    integer;
  v_clamped integer;
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
  v_clamped := greatest(-3, least(3, v_diff));

  select (row_data->>'points')::integer into v_points
  from jsonb_array_elements(v_table->'rows') as row_data
  where (row_data->>'diff')::integer = v_clamped;

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

create policy "games_all" on games for all to anon, authenticated using (true) with check (true);
create policy "players_all" on players for all to anon, authenticated using (true) with check (true);
create policy "rounds_all" on rounds for all to anon, authenticated using (true) with check (true);
create policy "round_drinks_all" on round_drinks for all to anon, authenticated using (true) with check (true);
create policy "rules_all" on rules for all to anon, authenticated using (true) with check (true);
create policy "rule_violations_all" on rule_violations for all to anon, authenticated using (true) with check (true);
create policy "minigame_results_all" on minigame_results for all to anon, authenticated using (true) with check (true);
create policy "point_adjustments_all" on point_adjustments for all to anon, authenticated using (true) with check (true);

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
