-- Scope rule violations to the round they were reported in, so the
-- per-round "Regelbruch eintragen" box starts fresh each round instead of
-- showing every violation ever logged for that rule. Nullable since older
-- rows predate this column; they just won't count toward any round's box
-- (they still count toward the overall leaderboard total, which sums all
-- rule_violations regardless of round_id).
alter table rule_violations add column if not exists round_id uuid references rounds(id) on delete set null;
