/**
 * Sign convention used throughout the app: bad things (breaking a rule,
 * losing a minigame, a penalty) give plus points, good things (winning)
 * give minus points — same direction as sip scoring (over PAR = plus,
 * under PAR = minus). This labels a value so the sign doesn't have to be
 * memorized every time.
 */
export function pointsKindLabel(points: number): string | null {
  if (points > 0) return "Strafpunkte";
  if (points < 0) return "Gutpunkte";
  return null;
}
