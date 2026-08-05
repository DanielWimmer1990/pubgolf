"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { computePointsForSips } from "@/lib/scoring";

export function SipInput() {
  const { currentRound, game, myPlayer, roundDrinks } = useGame();
  const [sips, setSips] = useState(currentRound?.par ?? 3);
  const [submitting, setSubmitting] = useState(false);

  if (!currentRound || !game || !myPlayer) return null;

  const myDrink = roundDrinks.find(
    (rd) => rd.round_id === currentRound.id && rd.player_id === myPlayer.id
  );

  if (myDrink) {
    const points = myDrink.points ?? 0;
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">
          Du hast {myDrink.sips} Schlucke gebraucht
        </p>
        <p
          className={
            points > 0
              ? "text-2xl font-bold text-emerald-500"
              : points < 0
              ? "text-2xl font-bold text-red-500"
              : "text-2xl font-bold"
          }
        >
          {points > 0 ? "+" : ""}
          {points} Punkte
        </p>
        <p className="text-sm text-muted-foreground">
          Warte auf die anderen…
        </p>
      </div>
    );
  }

  const par = currentRound.par ?? 1;
  const estimatedPoints = computePointsForSips(sips, par, game.scoring_table);

  async function submit() {
    setSubmitting(true);
    const { error } = await supabase.from("round_drinks").upsert(
      {
        round_id: currentRound!.id,
        player_id: myPlayer!.id,
        sips,
      },
      { onConflict: "round_id,player_id" }
    );
    if (error) {
      console.error(error);
      toast.error("Konnte Schlucke nicht speichern.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-muted-foreground">
        PAR {par} — wie viele Schlucke hast du gebraucht?
      </p>

      <div className="flex items-center gap-6">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 text-xl"
          onClick={() => setSips((s) => Math.max(0, s - 1))}
        >
          −
        </Button>
        <span className="w-16 text-5xl font-bold tabular-nums">{sips}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 text-xl"
          onClick={() => setSips((s) => s + 1)}
        >
          +
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Ergibt {estimatedPoints > 0 ? "+" : ""}
        {estimatedPoints} Punkte
      </p>

      <Button
        size="lg"
        className="w-full max-w-xs text-base"
        onClick={submit}
        disabled={submitting}
      >
        {submitting ? "Speichere…" : "Fertig!"}
      </Button>
    </div>
  );
}
