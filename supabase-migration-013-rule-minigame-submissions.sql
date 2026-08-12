-- Freely-typed custom rules/minigames should NOT silently join the curated
-- dropdown pool anymore (that let junk creep into the shared suggestion
-- list). Instead they land here — an admin-only staging table, not read by
-- the app's dropdown query — so the host can review them later (Supabase's
-- Table Editor doubles as a spreadsheet view, with a CSV export button) and
-- decide by hand whether to promote one into rule_templates/minigame_templates.
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
