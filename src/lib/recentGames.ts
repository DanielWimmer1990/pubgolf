export type RecentGame = {
  code: string;
  name: string | null;
  lastVisited: string; // ISO timestamp
};

const STORAGE_KEY = "pubgolf:recentGames";
const MAX_ENTRIES = 12;

export function getRecentGames(): RecentGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentGame[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function trackRecentGame(code: string, name: string | null) {
  if (typeof window === "undefined") return;
  const existing = getRecentGames().filter((g) => g.code !== code);
  const next = [
    { code, name, lastVisited: new Date().toISOString() },
    ...existing,
  ].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function removeRecentGame(code: string) {
  if (typeof window === "undefined") return;
  const next = getRecentGames().filter((g) => g.code !== code);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
