import type { ScoringTable } from "@/types/database";

export const SCORING_DIFF_MIN = -3;
export const SCORING_DIFF_MAX = 3;

/**
 * Default table derived from the example that defines this game's house
 * rule: PAR 2 in 1 sip (diff -1) = +2 points, PAR 2 in 4 sips (diff +2) = -1
 * point. Both fit points = -diff + 1 exactly.
 */
export function computeDefaultScoringTable(): ScoringTable {
  const rows = [];
  for (let diff = SCORING_DIFF_MIN; diff <= SCORING_DIFF_MAX; diff++) {
    rows.push({ diff, points: -diff + 1 });
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
  const clamped = Math.max(SCORING_DIFF_MIN, Math.min(SCORING_DIFF_MAX, diff));
  const row = scoringTable.rows.find((r) => r.diff === clamped);
  return row?.points ?? 0;
}

export function diffLabel(diff: number): string {
  if (diff === 0) return "Genau PAR";
  if (diff < 0) return `${Math.abs(diff)} unter PAR`;
  return `${diff} über PAR`;
}
