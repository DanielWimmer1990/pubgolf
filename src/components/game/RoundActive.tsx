"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { HostSipEntry } from "@/components/game/HostSipEntry";
import { RoundLiveStatus } from "@/components/game/RoundLiveStatus";
import { MinigameResultForm } from "@/components/game/MinigameResultForm";
import { RuleViolationBox } from "@/components/game/RuleViolationBox";
import { PenaltyAdjustmentBox } from "@/components/game/PenaltyAdjustmentBox";
import { ExtraPointsBox } from "@/components/game/ExtraPointsBox";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";

export function RoundActive() {
  const {
    currentRound,
    isHost,
    players,
    roundDrinks,
    minigameResults,
    ruleViolations,
    pointAdjustments,
  } = useGame();
  const [ending, setEnding] = useState(false);
  const [goingBack, setGoingBack] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
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
  const hasEnteredResults =
    reportedCount > 0 ||
    minigameResults.some((mr) => mr.round_id === currentRound.id) ||
    ruleViolations.some((rv) => rv.round_id === currentRound.id) ||
    pointAdjustments.some((pa) => pa.round_id === currentRound.id);

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

  async function backToSetup() {
    if (!currentRound) return;
    setGoingBack(true);
    const { error } = await supabase
      .from("rounds")
      .update({ status: "setup" })
      .eq("id", currentRound.id);
    setGoingBack(false);
    setBackConfirmOpen(false);
    if (error) {
      console.error(error);
      toast.error("Konnte nicht zur Vorbereitung zurückgehen.");
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {isHost && (
        <button
          type="button"
          onClick={() =>
            hasEnteredResults ? setBackConfirmOpen(true) : backToSetup()
          }
          disabled={goingBack}
          className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {goingBack ? "Öffne…" : "Zurück zur Vorbereitung"}
        </button>
      )}
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

      <Dialog open={backConfirmOpen} onOpenChange={setBackConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zurück zur Vorbereitung?</DialogTitle>
            <DialogDescription>
              Für diese Runde sind schon Ergebnisse eingetragen (Schlucke,
              Minispiel oder Strafpunkte). Änderungen an Bar, PAR oder
              Minispiel wirken sich nicht rückwirkend auf bereits
              gespeicherte Einträge aus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="button" onClick={backToSetup} disabled={goingBack}>
              {goingBack ? "Öffne…" : "Ja, zurück"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
