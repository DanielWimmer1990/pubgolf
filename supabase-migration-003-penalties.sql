-- Pubgolf — migration 003: penalty types + flexible point adjustments.
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

alter table games add column if not exists penalty_types jsonb not null default '[
  {"id": "water_hazard", "name": "Water Hazard (Klogang)", "points": 10},
  {"id": "spill", "name": "Getränk umschütten", "points": 5},
  {"id": "vomit", "name": "Kotzen", "points": 20}
]'::jsonb;

create table if not exists point_adjustments (
  id                      uuid default uuid_generate_v4() primary key,
  created_at              timestamptz default now(),
  game_id                 uuid not null references games(id) on delete cascade,
  round_id                uuid not null references rounds(id) on delete cascade,
  player_id               uuid not null references players(id) on delete cascade,
  label                   text not null,
  points                  integer not null,
  created_by_player_id    uuid not null references players(id)
);

alter table point_adjustments enable row level security;

drop policy if exists "point_adjustments_all" on point_adjustments;
create policy "point_adjustments_all" on point_adjustments for all to anon, authenticated using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'point_adjustments'
  ) then
    alter publication supabase_realtime add table point_adjustments;
  end if;
end $$;
