"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HostSipEntry } from "@/components/game/HostSipEntry";
import { RoundLiveStatus } from "@/components/game/RoundLiveStatus";
import { MinigameResultForm } from "@/components/game/MinigameResultForm";
import { RuleViolationBox } from "@/components/game/RuleViolationBox";
import { PenaltyAdjustmentBox } from "@/components/game/PenaltyAdjustmentBox";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";

export function RoundActive() {
  const { currentRound, isHost } = useGame();
  const [ending, setEnding] = useState(false);
  if (!currentRound) return null;

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
      {currentRound.bar_name && (
        <div className="text-center">
          <p className="font-heading text-xl font-semibold">
            {currentRound.bar_name}
          </p>
          {currentRound.drink_description && (
            <p className="text-sm text-muted-foreground">
              {currentRound.drink_description}
            </p>
          )}
        </div>
      )}

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

      {isHost && (
        <Button
          size="lg"
          className="w-full max-w-md text-base"
          onClick={endRound}
          disabled={ending}
        >
          {ending ? "Beende…" : "Runde beenden"}
        </Button>
      )}
    </div>
  );
}
