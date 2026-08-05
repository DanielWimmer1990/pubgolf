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
        className="animate-pulse"
      />
      <div>
        <p className="text-lg font-medium">{activePlayer.name} ist dran</p>
        <p className="text-sm text-muted-foreground">
          Wählt gerade die Bar, würfelt das PAR und legt die Regel für Runde{" "}
          {currentRound.round_number} fest…
        </p>
      </div>
    </div>
  );
}
