-- Sign convention, kept consistent with sip scoring and penalty_types:
-- bad things (breaking a rule, losing a minigame) give plus points, good
-- things (winning) give minus points. Only affects the *default* prefilled
-- value for new rules/minigames going forward — already-declared rules and
-- rounds keep whatever value was actually used.
alter table games alter column default_rule_points set default 2;
alter table games alter column default_minigame_points_winner set default -1;
alter table games alter column default_minigame_points_loser set default 1;
