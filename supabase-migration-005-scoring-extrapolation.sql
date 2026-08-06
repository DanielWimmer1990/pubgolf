-- Beyond the scoring table's edited range (-3..3), extrapolate linearly
-- using the slope of the last step instead of capping at the outermost
-- row's points — e.g. PAR 6 with 1 sip (diff -5) should keep scaling past
-- the diff -3 row instead of getting stuck at its value.
create or replace function fn_calc_round_drink_points()
returns trigger as $$
declare
  v_par         integer;
  v_table       jsonb;
  v_diff        integer;
  v_points      integer;
  v_edge_points integer;
  v_step        integer;
begin
  select r.game_id, r.par, g.scoring_table into new.game_id, v_par, v_table
  from rounds r join games g on g.id = r.game_id
  where r.id = new.round_id;

  if new.sips is null then
    new.points := null;
    return new;
  end if;

  v_diff := new.sips - v_par;

  select (row_data->>'points')::integer into v_points
  from jsonb_array_elements(v_table->'rows') as row_data
  where (row_data->>'diff')::integer = v_diff;

  if v_points is null then
    if v_diff > 3 then
      select (row_data->>'points')::integer into v_edge_points
      from jsonb_array_elements(v_table->'rows') as row_data
      where (row_data->>'diff')::integer = 3;
      select v_edge_points - (row_data->>'points')::integer into v_step
      from jsonb_array_elements(v_table->'rows') as row_data
      where (row_data->>'diff')::integer = 2;
      v_points := coalesce(v_edge_points, 0) + coalesce(v_step, 0) * (v_diff - 3);
    elsif v_diff < -3 then
      select (row_data->>'points')::integer into v_edge_points
      from jsonb_array_elements(v_table->'rows') as row_data
      where (row_data->>'diff')::integer = -3;
      select v_edge_points - (row_data->>'points')::integer into v_step
      from jsonb_array_elements(v_table->'rows') as row_data
      where (row_data->>'diff')::integer = -2;
      v_points := coalesce(v_edge_points, 0) + coalesce(v_step, 0) * (-3 - v_diff);
    else
      v_points := 0;
    end if;
  end if;

  new.points := coalesce(v_points, 0);
  new.reported_at := now();
  return new;
end;
$$ language plpgsql;
