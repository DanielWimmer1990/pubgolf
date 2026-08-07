"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HostSipEntry } from "@/components/game/HostSipEntry";
import { RoundLiveStatus } from "@/components/game/RoundLiveStatus";
import { MinigameResultForm } from "@/components/game/MinigameResultForm";
import { RuleViolationBox } from "@/components/game/RuleViolationBox";
import { PenaltyAdjustmentBox } from "@/components/game/PenaltyAdjustmentBox";
import { ExtraPointsBox } from "@/components/game/ExtraPointsBox";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";

export function RoundActive() {
  const { currentRound, isHost, players, roundDrinks } = useGame();
  const [ending, setEnding] = useState(false);
  if (!currentRound) return null;

  const reportedCount = players.filter((p) =>
    roundDrinks.some(
      (rd) =>
        rd.round_id === currentRound.id &&
        rd.player_id === p.id &&
        rd.sips != null
    )
  ).length;
  const allReported = reportedCount === players.length;

  async function endRound() {
    if (!currentRound) return;
    setEnding(true);
    const { error } = await supabase
      .from("rounds")
      .update({ status: "done" })
      .eq("id", currentRound.id);
    setEnding(false);
    if (error) {
      console.error(error);
      toast.error("Runde konnte nicht beendet werden.");
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="text-center">
        {currentRound.round_number === players.length && (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            🏁 Letzte Runde
          </p>
        )}
        {currentRound.bar_name && (
          <>
            <p className="font-heading text-xl font-semibold">
              {currentRound.bar_name}
            </p>
            {currentRound.drink_description && (
              <p className="text-sm text-muted-foreground">
                {currentRound.drink_description}
              </p>
            )}
          </>
        )}
      </div>

      {isHost ? (
        <HostSipEntry round={currentRound} />
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Der Gastgeber trägt gerade die Schlucke ein…
        </p>
      )}

      <RoundLiveStatus />
      {currentRound.minigame_name && (
        <MinigameResultForm round={currentRound} />
      )}
      {isHost && <RuleViolationBox round={currentRound} />}
      {isHost && <PenaltyAdjustmentBox round={currentRound} />}
      {isHost && <ExtraPointsBox round={currentRound} />}

      {isHost && (
        <div className="w-full max-w-md space-y-2">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={endRound}
            disabled={ending || !allReported}
          >
            {ending ? "Beende…" : "Runde beenden"}
          </Button>
          {!allReported && (
            <p className="text-center text-xs text-muted-foreground">
              Noch nicht alle Schlucke eingetragen ({reportedCount}/
              {players.length})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
