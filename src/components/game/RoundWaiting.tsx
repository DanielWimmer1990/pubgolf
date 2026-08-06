"use client";

import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";

export function RoundWaiting() {
  const { activePlayer, currentRound } = useGame();
  if (!activePlayer || !currentRound) return null;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <PlayerAvatar
        name={activePlayer.name}
        color={activePlayer.color}
        avatarEmoji={activePlayer.avatar_emoji}
        size="lg"
        className="animate-pulse shadow-[0_0_40px_-8px] shadow-primary"
      />
      <div>
        <p className="font-heading text-xl font-semibold">
          {activePlayer.name} ist dran
        </p>
        <p className="text-sm text-muted-foreground">
          Der Gastgeber wählt gerade Bar, PAR und Regel für Runde{" "}
          {currentRound.round_number}…
        </p>
      </div>
    </div>
  );
}
