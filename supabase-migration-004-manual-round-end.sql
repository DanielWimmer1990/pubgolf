-- Pubgolf — migration 004: round completion is now host-controlled.
-- The host now saves sips/minigame/penalties independently and explicitly
-- clicks "Runde beenden" — drop the trigger that used to auto-complete a
-- round the instant every player had sips recorded, since that short-
-- circuited the new flow before the host could touch the other boxes.
-- Run once in the Supabase SQL editor. Safe to re-run.

drop trigger if exists trg_round_drinks_complete on round_drinks;
drop function if exists fn_maybe_complete_round();
