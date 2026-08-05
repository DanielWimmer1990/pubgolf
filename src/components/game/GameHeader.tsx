"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RulesList } from "@/components/game/RulesList";
import { LeaderboardDrawer } from "@/components/game/LeaderboardDrawer";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";

export function GameHeader() {
  const { game, currentRound, isHost } = useGame();
  const [ending, setEnding] = useState(false);

  if (!game) return null;

  async function endGame() {
    if (!window.confirm("Spiel wirklich beenden und Endergebnis zeigen?")) {
      return;
    }
    setEnding(true);
    const { error } = await supabase
      .from("games")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", game!.id);
    if (error) {
      console.error(error);
      toast.error("Spiel konnte nicht beendet werden.");
      setEnding(false);
    }
  }

  return (
    <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-none">
          {game.name || "Pubgolf"}
        </p>
        {currentRound && (
          <p className="text-xs text-muted-foreground">
            Runde {currentRound.round_number}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <LeaderboardDrawer />
        <RulesList />
        {isHost && (
          <Button
            variant="ghost"
            size="sm"
            onClick={endGame}
            disabled={ending}
            className="text-muted-foreground"
          >
            Beenden
          </Button>
        )}
      </div>
    </header>
  );
}
