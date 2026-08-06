"use client";

import { HostSipEntry } from "@/components/game/HostSipEntry";
import { RoundLiveStatus } from "@/components/game/RoundLiveStatus";
import { MinigameResultForm } from "@/components/game/MinigameResultForm";
import { useGame } from "@/hooks/useGame";

export function RoundActive() {
  const { currentRound, isHost } = useGame();
  if (!currentRound) return null;

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
    </div>
  );
}
