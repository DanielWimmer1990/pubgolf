-- A shared, growing library of house-rule and minigame presets, offered as
-- dropdown suggestions in the round setup (in addition to typing your own).
-- Not tied to any single game — every custom rule/minigame a host types in
-- gets added here too (see RoundSetup.tsx), so the pool grows over time.
create table if not exists rule_templates (
  id          uuid default uuid_generate_v4() primary key,
  created_at  timestamptz default now(),
  text        text not null unique
);

create table if not exists minigame_templates (
  id          uuid default uuid_generate_v4() primary key,
  created_at  timestamptz default now(),
  name        text not null unique
);

insert into rule_templates (text) values
  ('Keine Namen nennen'),
  ('Königliches Wir (immer "wir" statt "ich" sagen)'),
  ('Nicht fluchen'),
  ('Fluchen nur mit netter Begründung erlaubt'),
  ('Nicht mit dem Finger zeigen'),
  ('Niemandem ins Gesicht fassen'),
  ('Bei jedem Foto reinplatzen (Fotobombe)'),
  ('Nur mit der linken Hand trinken'),
  ('Auf Zuruf "Hund, sitz!" sofort hinsetzen'),
  ('Kleinen Finger beim Trinken abspreizen ("Fee auf dem Glas")'),
  ('Vor jedem Schluck ein Zauberwort ins Glas flüstern'),
  ('Süßigkeit treffsicher ins Glas werfen'),
  ('Vor jedem Satz kurz aufstehen'),
  ('Nur mit einer königlichen Handwelle winken'),
  ('Bei "Freeze!" sofort erstarren'),
  ('Ein bestimmtes Wort ist für den Rest des Spiels tabu'),
  ('Nur wie im Bewerbungsgespräch sprechen'),
  ('Kein Augenkontakt erlaubt'),
  ('Sich nirgends mehr kratzen'),
  ('Jeder bekommt eine neue Fantasie-Identität'),
  ('Nichts mehr berühren oder anlehnen'),
  ('Sagt jemand zufällig dasselbe wie ein anderer, gibt es Gutpunkte')
on conflict (text) do nothing;

insert into minigame_templates (name) values
  ('Schere, Stein, Papier'),
  ('Armdrücken'),
  ('Wort-Duell (gleichzeitig ein Wort aufschreiben, bei Übereinstimmung raus)'),
  ('Songtext-Timing (erraten, wann der Text einsetzt)'),
  ('Donner-Wetter-Blitz'),
  ('Sternzerreißen'),
  ('Knobeln'),
  ('Tip Top'),
  ('Synchronlauf (zwei Läufe exakt gleich schnell)'),
  ('60-Sekunden-Schätzen (ohne Uhr)'),
  ('Wort-Sync (über mehrere Runden dasselbe Wort treffen)'),
  ('Zahlenpoker (1–100, niedrigste einzigartige Zahl gewinnt)'),
  ('Kartenrennen')
on conflict (name) do nothing;

alter table rule_templates enable row level security;
alter table minigame_templates enable row level security;

drop policy if exists "rule_templates_all" on rule_templates;
create policy "rule_templates_all" on rule_templates for all to anon, authenticated using (true) with check (true);

drop policy if exists "minigame_templates_all" on minigame_templates;
create policy "minigame_templates_all" on minigame_templates for all to anon, authenticated using (true) with check (true);
