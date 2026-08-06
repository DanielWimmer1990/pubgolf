-- A drink can't be finished in 0 sips — require at least 1.
alter table round_drinks drop constraint if exists round_drinks_sips_check;
alter table round_drinks add constraint round_drinks_sips_check check (sips >= 1);
