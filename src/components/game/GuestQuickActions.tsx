"use client";

import { LeaderboardDrawer } from "@/components/game/LeaderboardDrawer";
import { RulesList } from "@/components/game/RulesList";
import { IdeaLibraryDialog } from "@/components/game/IdeaLibraryDialog";
import { useGame } from "@/hooks/useGame";

/** Rangliste/Regeln/Ideen for guests — hidden from the top bar for
 * non-hosts and shown inline in the round content instead. */
export function GuestQuickActions() {
  const { game, currentRound, isHost } = useGame();
  if (!game || isHost) return null;

  const suspenseActive =
    game.hide_leaderboard_final_round && currentRound?.is_final_round;
  const canSeeLeaderboard = !suspenseActive && game.show_live_leaderboard;

  return (
    <div className="flex w-full max-w-md flex-wrap justify-center gap-2">
      {canSeeLeaderboard && <LeaderboardDrawer />}
      <RulesList />
      <IdeaLibraryDialog />
    </div>
  );
}
