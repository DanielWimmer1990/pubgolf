-- Carries the curated explanation text (rule_templates.description /
-- minigame_templates.description) onto the actual game-round rows, so
-- "Aktive Regeln" and the live Minispiel card can show an info button
-- with the explanation, not just during round setup.
alter table rules add column if not exists description text;
alter table rounds add column if not exists minigame_description text;
