-- Pubgolf — migration 002: game settings (scoring defaults, header image,
-- presentation/leaderboard toggles).
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

alter table games add column if not exists header_image_url text;
alter table games add column if not exists default_drink text;
alter table games add column if not exists default_rule_points integer not null default -2;
alter table games add column if not exists default_minigame_points_winner integer not null default 1;
alter table games add column if not exists default_minigame_points_loser integer not null default -1;
alter table games add column if not exists show_final_presentation boolean not null default true;
alter table games add column if not exists show_live_leaderboard boolean not null default true;
alter table games add column if not exists hide_leaderboard_final_round boolean not null default false;

alter table rounds add column if not exists is_final_round boolean not null default false;

insert into storage.buckets (id, name, public)
values ('game-headers', 'game-headers', true)
on conflict (id) do nothing;

drop policy if exists "game_headers_public_read" on storage.objects;
create policy "game_headers_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'game-headers');

drop policy if exists "game_headers_public_insert" on storage.objects;
create policy "game_headers_public_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'game-headers');
