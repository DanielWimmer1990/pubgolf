-- Live draft fields on `rounds` so spectators (non-host players) can see
-- the rule the host is currently typing during round setup, before
-- "Runde starten" commits it into the `rules` table.
alter table rounds add column if not exists draft_rule_text text;
alter table rounds add column if not exists draft_rule_points integer;
