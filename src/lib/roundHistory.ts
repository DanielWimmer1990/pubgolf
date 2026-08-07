const RULE_KEY = "pubgolf:recentRules";
const MINIGAME_KEY = "pubgolf:recentMinigames";
const MAX_ENTRIES = 15;

function getList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function trackEntry(key: string, value: string) {
  if (typeof window === "undefined" || !value.trim()) return;
  const trimmed = value.trim();
  const existing = getList(key).filter(
    (v) => v.toLowerCase() !== trimmed.toLowerCase()
  );
  const next = [trimmed, ...existing].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(key, JSON.stringify(next));
}

/** Rule texts and minigame names the host has used before, on this device
 * — offered as suggestions so recurring favorites don't need retyping. */
export function getRecentRuleTexts(): string[] {
  return getList(RULE_KEY);
}

export function trackRuleText(text: string) {
  trackEntry(RULE_KEY, text);
}

export function getRecentMinigameNames(): string[] {
  return getList(MINIGAME_KEY);
}

export function trackMinigameName(name: string) {
  trackEntry(MINIGAME_KEY, name);
}
