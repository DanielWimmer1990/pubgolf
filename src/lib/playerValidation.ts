import type { Player } from "@/types/database";
import type { PlayerIdentity } from "@/components/game/PlayerIdentityForm";

/**
 * Returns a user-facing error message if `identity` collides with an
 * existing player's name, color, or avatar — or null if it's free.
 * `excludePlayerId` lets an existing player's own row be edited without
 * tripping over itself.
 */
export function findIdentityConflict(
  identity: PlayerIdentity,
  existingPlayers: Player[],
  excludePlayerId?: string
): string | null {
  const others = existingPlayers.filter((p) => p.id !== excludePlayerId);
  const name = identity.name.trim().toLowerCase();

  if (others.some((p) => p.name.trim().toLowerCase() === name)) {
    return "Dieser Name ist schon vergeben.";
  }
  if (others.some((p) => p.color === identity.color)) {
    return "Diese Farbe ist schon vergeben.";
  }
  if (
    identity.avatarEmoji &&
    others.some((p) => p.avatar_emoji === identity.avatarEmoji)
  ) {
    return "Dieses Symbol ist schon vergeben.";
  }
  return null;
}
