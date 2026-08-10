"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { pointsKindLabel } from "@/lib/pointsLabel";
import type { MinigameOutcome, Round } from "@/types/database";

const OUTCOME_LABEL: Record<MinigameOutcome, string> = {
  winner: "Gewinner",
  loser: "Verlierer",
  neutral: "–",
};

export function MinigameResultForm({ round }: { round: Round }) {
  const { players, minigameResults, myPlayer, isHost } = useGame();

  const resultsForRound = minigameResults.filter(
    (mr) => mr.round_id === round.id
  );

  const [outcomes, setOutcomes] = useState<Record<string, MinigameOutcome>>(
    () =>
      Object.fromEntries(
        players.map((p) => [
          p.id,
          resultsForRound.find((mr) => mr.player_id === p.id)?.outcome ??
            "neutral",
        ])
      )
  );
  const [saving, setSaving] = useState(false);

  if (!round.minigame_name) return null;

  function setOutcome(playerId: string, outcome: MinigameOutcome) {
    setOutcomes((prev) => ({ ...prev, [playerId]: outcome }));
  }

  async function save() {
    if (!myPlayer) return;
    setSaving(true);
    const rows = players.map((p) => {
      const outcome = outcomes[p.id] ?? "neutral";
      const points =
        outcome === "winner"
          ? round.minigame_points_winner ?? 0
          : outcome === "loser"
          ? round.minigame_points_loser ?? 0
          : 0;
      return {
        game_id: round.game_id,
        round_id: round.id,
        player_id: p.id,
        outcome,
        points_applied: points,
        recorded_by_player_id: myPlayer.id,
      };
    });

    const { error } = await supabase
      .from("minigame_results")
      .upsert(rows, { onConflict: "round_id,player_id" });
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Ergebnis konnte nicht gespeichert werden.");
      return;
    }
    toast.success("Minispiel gespeichert!");
  }

  return (
    <div className="w-full max-w-md space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div>
        <p className="font-heading font-semibold">
          🎲 Minispiel: {round.minigame_name}
        </p>
        <p className="text-xs text-muted-foreground">
          Gewinner {round.minigame_points_winner! > 0 ? "+" : ""}
          {round.minigame_points_winner}
          {pointsKindLabel(round.minigame_points_winner ?? 0) &&
            ` (${pointsKindLabel(round.minigame_points_winner ?? 0)})`}{" "}
          · Verlierer {round.minigame_points_loser! > 0 ? "+" : ""}
          {round.minigame_points_loser}
          {pointsKindLabel(round.minigame_points_loser ?? 0) &&
            ` (${pointsKindLabel(round.minigame_points_loser ?? 0)})`}
        </p>
      </div>

      <ul className="space-y-2">
        {players.map((player) => {
          const current = isHost
            ? outcomes[player.id] ?? "neutral"
            : resultsForRound.find((mr) => mr.player_id === player.id)
                ?.outcome;
          return (
            <li key={player.id} className="flex items-center gap-2">
              <PlayerAvatar
                name={player.name}
                color={player.color}
                avatarEmoji={player.avatar_emoji}
                size="sm"
              />
              <span className="flex-1 truncate text-sm">{player.name}</span>
              {isHost ? (
                <div className="flex gap-1">
                  {(["winner", "loser", "neutral"] as MinigameOutcome[]).map(
                    (outcome) => (
                      <button
                        key={outcome}
                        type="button"
                        onClick={() => setOutcome(player.id, outcome)}
                        className={cn(
                          "rounded-full border border-white/15 px-2.5 py-1 text-xs",
                          current === outcome &&
                            "border-primary bg-primary/20 font-medium text-primary"
                        )}
                      >
                        {OUTCOME_LABEL[outcome]}
                      </button>
                    )
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {current ? OUTCOME_LABEL[current] : "–"}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {isHost && (
        <Button
          className="w-full"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Speichere…" : "Speichern"}
        </Button>
      )}
    </div>
  );
}
