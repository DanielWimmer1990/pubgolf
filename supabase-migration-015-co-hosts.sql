-- Lets the host share a special link that promotes whoever opens it to
-- co-host, instead of exactly one player ever being able to control the
-- game. host_invite_token is a per-game secret (same trust model as the
-- join code itself — no real auth in this app).
alter table games
  add column if not exists host_invite_token uuid default uuid_generate_v4();

update games set host_invite_token = uuid_generate_v4()
where host_invite_token is null;
