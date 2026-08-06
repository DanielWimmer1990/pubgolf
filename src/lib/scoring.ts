import type { ScoringTable } from "@/types/database";

export const SCORING_DIFF_MIN = -3;
export const SCORING_DIFF_MAX = 3;

/**
 * Default table: exactly hitting PAR is worth 0. Going over PAR (more sips
 * than rolled) earns plus points, going under PAR (fewer sips) costs minus
 * points — 2 points per sip of difference. Symmetric and easy to explain
 * out loud at a bar.
 */
export function computeDefaultScoringTable(): ScoringTable {
  const rows = [];
  for (let diff = SCORING_DIFF_MIN; diff <= SCORING_DIFF_MAX; diff++) {
    rows.push({ diff, points: 2 * diff });
  }
  return { rows };
}

/** Client-side mirror of the fn_calc_round_drink_points DB trigger, for optimistic UI only. */
export function computePointsForSips(
  sips: number,
  par: number,
  scoringTable: ScoringTable
): number {
  const diff = sips - par;
  const rows = scoringTable.rows;

  const exact = rows.find((r) => r.diff === diff);
  if (exact) return exact.points;

  // Beyond the edited range, keep extrapolating at the same rate as the
  // last step in the table instead of capping at the outermost row.
  if (diff > SCORING_DIFF_MAX) {
    const edge = rows.find((r) => r.diff === SCORING_DIFF_MAX);
    const prev = rows.find((r) => r.diff === SCORING_DIFF_MAX - 1);
    const step = edge && prev ? edge.points - prev.points : 0;
    return (edge?.points ?? 0) + step * (diff - SCORING_DIFF_MAX);
  }
  if (diff < SCORING_DIFF_MIN) {
    const edge = rows.find((r) => r.diff === SCORING_DIFF_MIN);
    const next = rows.find((r) => r.diff === SCORING_DIFF_MIN + 1);
    const step = edge && next ? edge.points - next.points : 0;
    return (edge?.points ?? 0) + step * (SCORING_DIFF_MIN - diff);
  }
  return 0;
}

export function diffLabel(diff: number): string {
  if (diff === 0) return "Genau PAR";
  if (diff < 0) return `${Math.abs(diff)} unter PAR`;
  return `${diff} über PAR`;
}
