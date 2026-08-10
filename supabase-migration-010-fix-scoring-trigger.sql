-- URGENT: the live trigger still has the pre-simplification logic that
-- expects scoring_table rows at diff -3..3. Since the table was simplified
-- to only store diff -1/0/+1 (every other diff is a multiple of the ±1
-- step), the old trigger's exact-match lookup for diffs like +2 or -4
-- fails, falls through to its "within range" catch-all, and silently
-- scores them as 0 instead of extrapolating. This replaces it with the
-- correct logic.
create or replace function fn_calc_round_drink_points()
returns trigger as $$
declare
  v_par     integer;
  v_table   jsonb;
  v_diff    integer;
  v_over    integer;
  v_under   integer;
  v_points  integer;
begin
  select r.game_id, r.par, g.scoring_table into new.game_id, v_par, v_table
  from rounds r join games g on g.id = r.game_id
  where r.id = new.round_id;

  if new.sips is null then
    new.points := null;
    return new;
  end if;

  v_diff := new.sips - v_par;

  if v_diff = 0 then
    v_points := 0;
  else
    select (row_data->>'points')::integer into v_over
    from jsonb_array_elements(v_table->'rows') as row_data
    where (row_data->>'diff')::integer = 1;
    select (row_data->>'points')::integer into v_under
    from jsonb_array_elements(v_table->'rows') as row_data
    where (row_data->>'diff')::integer = -1;

    if v_diff > 0 then
      v_points := v_diff * coalesce(v_over, 0);
    else
      v_points := -v_diff * coalesce(v_under, 0);
    end if;
  end if;

  new.points := coalesce(v_points, 0);
  new.reported_at := now();
  return new;
end;
$$ language plpgsql;
