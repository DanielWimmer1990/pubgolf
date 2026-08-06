"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RulesList } from "@/components/game/RulesList";
import { LeaderboardDrawer } from "@/components/game/LeaderboardDrawer";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";

export function GameHeader() {
  const { game, currentRound, isHost } = useGame();
  const [ending, setEnding] = useState(false);

  if (!game) return null;

  const canSeeLeaderboard =
    isHost ||
    (game.show_live_leaderboard &&
      !(game.hide_leaderboard_final_round && currentRound?.is_final_round));

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
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-white/10 bg-background/70 px-4 py-3 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/"
          aria-label="Zur Startseite"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          <Home className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold leading-none">
            {game.name || "Pubgolf"}
          </p>
          {currentRound && (
            <p className="truncate text-xs text-muted-foreground">
              Runde {currentRound.round_number}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canSeeLeaderboard && <LeaderboardDrawer />}
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
