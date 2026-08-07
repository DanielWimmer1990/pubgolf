import type { ScoringTable } from "@/types/database";

/**
 * Default table: exactly hitting PAR is worth 0. Going over PAR (more sips
 * than rolled) earns plus points, going under PAR (fewer sips) costs minus
 * points — 2 points per sip of difference. Symmetric and easy to explain
 * out loud at a bar.
 *
 * Only the diff -1/0/+1 rows are stored — every other diff is a straight
 * multiple of the ±1 step (diff 3 is just 3x the diff-1 row, diff -5 is 5x
 * the diff -1 row, etc.), so editing further-out rows separately would only
 * ever add confusing redundancy, never a materially different rule.
 */
export function computeDefaultScoringTable(): ScoringTable {
  return {
    rows: [
      { diff: -1, points: -2 },
      { diff: 0, points: 0 },
      { diff: 1, points: 2 },
    ],
  };
}

/** Client-side mirror of the fn_calc_round_drink_points DB trigger, for optimistic UI only. */
export function computePointsForSips(
  sips: number,
  par: number,
  scoringTable: ScoringTable
): number {
  const diff = sips - par;
  if (diff === 0) return 0;

  const rows = scoringTable.rows;
  if (diff > 0) {
    const overStep = rows.find((r) => r.diff === 1)?.points ?? 0;
    return diff * overStep;
  }
  const underStep = rows.find((r) => r.diff === -1)?.points ?? 0;
  return -diff * underStep;
}

export function diffLabel(diff: number): string {
  if (diff === 0) return "Genau PAR";
  if (diff < 0) return `${Math.abs(diff)} unter PAR`;
  return `${diff} über PAR`;
}
