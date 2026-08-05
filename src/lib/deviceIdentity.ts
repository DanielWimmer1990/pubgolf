// Player identity without login: each device gets a random token the first
// time it opens a game, stored in localStorage. Joining a game links that
// token to a players row; on later visits we match the token back to the
// player to know "who am I on this device" for this specific game code.

function deviceKey(gameCode: string) {
  return `pubgolf:${gameCode}:device`;
}

function playerKey(gameCode: string) {
  return `pubgolf:${gameCode}:playerId`;
}

export function getOrCreateDeviceToken(gameCode: string): string {
  if (typeof window === "undefined") return "";
  const key = deviceKey(gameCode);
  let token = window.localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(key, token);
  }
  return token;
}

export function savePlayerId(gameCode: string, playerId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(playerKey(gameCode), playerId);
}

export function getStoredIdentity(gameCode: string): {
  deviceToken: string;
  playerId: string | null;
} {
  if (typeof window === "undefined") {
    return { deviceToken: "", playerId: null };
  }
  return {
    deviceToken: getOrCreateDeviceToken(gameCode),
    playerId: window.localStorage.getItem(playerKey(gameCode)),
  };
}

export function clearIdentity(gameCode: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(deviceKey(gameCode));
  window.localStorage.removeItem(playerKey(gameCode));
}
