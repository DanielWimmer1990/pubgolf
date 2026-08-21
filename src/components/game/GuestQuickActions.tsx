"use client";

import { RulesList } from "@/components/game/RulesList";
import { IdeaLibraryDialog } from "@/components/game/IdeaLibraryDialog";
import { useGame } from "@/hooks/useGame";

/** Regeln/Ideen for guests — hidden from the top bar for non-hosts and
 * shown inline in the round content instead. No Rangliste button here:
 * every guest screen already shows a live leaderboard preview, so a
 * second entry point to the same data would just be redundant. */
export function GuestQuickActions() {
  const { isHost } = useGame();
  if (isHost) return null;

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <RulesList bare />
      <IdeaLibraryDialog bare />
    </div>
  );
}
