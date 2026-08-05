"use client";

import { toast } from "sonner";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { MinigameOutcome, Round } from "@/types/database";

const OUTCOME_LABEL: Record<MinigameOutcome, string> = {
  winner: "Gewinner",
  loser: "Verlierer",
  neutral: "–",
};

export function MinigameResultForm({ round }: { round: Round }) {
  const { players, minigameResults, myPlayer } = useGame();

  if (!round.minigame_name) return null;

  const resultsForRound = minigameResults.filter(
    (mr) => mr.round_id === round.id
  );

  async function setOutcome(playerId: string, outcome: MinigameOutcome) {
    if (!myPlayer) return;
    const points =
      outcome === "winner"
        ? round.minigame_points_winner ?? 0
        : outcome === "loser"
        ? round.minigame_points_loser ?? 0
        : 0;

    const { error } = await supabase.from("minigame_results").upsert(
      {
        game_id: round.game_id,
        round_id: round.id,
        player_id: playerId,
        outcome,
        points_applied: points,
        recorded_by_player_id: myPlayer.id,
      },
      { onConflict: "round_id,player_id" }
    );
    if (error) {
      console.error(error);
      toast.error("Ergebnis konnte nicht gespeichert werden.");
    }
  }

  return (
    <div className="w-full max-w-sm space-y-3 rounded-xl border p-3">
      <div>
        <p className="font-medium">🎲 {round.minigame_name}</p>
        <p className="text-xs text-muted-foreground">
          Gewinner {round.minigame_points_winner! > 0 ? "+" : ""}
          {round.minigame_points_winner} · Verlierer{" "}
          {round.minigame_points_loser! > 0 ? "+" : ""}
          {round.minigame_points_loser} Punkte
        </p>
      </div>

      <ul className="space-y-2">
        {players.map((player) => {
          const current = resultsForRound.find(
            (mr) => mr.player_id === player.id
          )?.outcome;
          return (
            <li key={player.id} className="flex items-center gap-2">
              <PlayerAvatar
                name={player.name}
                color={player.color}
                avatarEmoji={player.avatar_emoji}
                size="sm"
              />
              <span className="flex-1 truncate text-sm">{player.name}</span>
              <div className="flex gap-1">
                {(["winner", "loser", "neutral"] as MinigameOutcome[]).map(
                  (outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => setOutcome(player.id, outcome)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs",
                        current === outcome &&
                          "border-foreground bg-accent font-medium"
                      )}
                    >
                      {OUTCOME_LABEL[outcome]}
                    </button>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
