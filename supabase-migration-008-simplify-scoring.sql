-- Simplify the scoring table to just the diff -1/0/+1 rows — every other
-- diff is a straight multiple of the ±1 step (diff 3 is 3x the diff-1 row,
-- diff -5 is 5x the diff -1 row), so editing further-out rows separately
-- never added a materially different rule, only redundant UI.
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

-- Existing games' scoring_table may still have the old -3..3 rows; that's
-- harmless (the trigger above only ever reads diff -1/0/1), but trim them
-- down for consistency so the settings UI reflects the simplified model.
update games
set scoring_table = jsonb_build_object(
  'rows',
  (
    select jsonb_agg(row_data order by (row_data->>'diff')::integer)
    from jsonb_array_elements(scoring_table->'rows') as row_data
    where (row_data->>'diff')::integer in (-1, 0, 1)
  )
)
where scoring_table->'rows' is not null;
