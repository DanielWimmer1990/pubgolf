import { supabase } from "@/lib/supabase";
import type { Player } from "@/types/database";

/**
 * Shuffles whose bar comes first. Runs once at game start so the
 * rotation stays a fair round-robin (everyone still gets exactly one
 * turn per lap) — just not "whoever joined first goes first".
 */
export async function randomizeTurnOrder(players: Player[]): Promise<Player[]> {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  await Promise.all(
    shuffled.map((player, index) =>
      supabase.from("players").update({ turn_order: index }).eq("id", player.id)
    )
  );
  return shuffled;
}
