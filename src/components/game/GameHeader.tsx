"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Home } from "lucide-react";
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
import { RulesList } from "@/components/game/RulesList";
import { LeaderboardDrawer } from "@/components/game/LeaderboardDrawer";
import { GameSettingsDialog } from "@/components/game/GameSettingsDialog";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";

export function GameHeader() {
  const { game, currentRound, isHost } = useGame();
  const [ending, setEnding] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!game) return null;

  // Suspense for the final round hides the leaderboard from everyone,
  // host included — that's the whole point of the setting, otherwise the
  // host could just peek here and spoil their own reveal.
  const suspenseActive =
    game.hide_leaderboard_final_round && currentRound?.is_final_round;
  const canSeeLeaderboard =
    !suspenseActive && (isHost || game.show_live_leaderboard);

  async function endGame() {
    setEnding(true);
    const { error } = await supabase
      .from("games")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", game!.id);
    if (error) {
      console.error(error);
      toast.error("Spiel konnte nicht beendet werden.");
      setEnding(false);
      setConfirmOpen(false);
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
        {isHost && (
          <>
            {canSeeLeaderboard && <LeaderboardDrawer />}
            <RulesList />
            <GameSettingsDialog />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="text-muted-foreground"
            >
              Beenden
            </Button>
          </>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spiel beenden?</DialogTitle>
            <DialogDescription>
              Das Endergebnis wird für alle angezeigt. Diese Aktion kann
              nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="button" onClick={endGame} disabled={ending}>
              {ending ? "Beende…" : "Ja, beenden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
