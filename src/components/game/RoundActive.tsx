"use client";

import { SipInput } from "@/components/game/SipInput";
import { RoundLiveStatus } from "@/components/game/RoundLiveStatus";
import { MinigameResultForm } from "@/components/game/MinigameResultForm";
import { useGame } from "@/hooks/useGame";

export function RoundActive() {
  const { currentRound } = useGame();
  if (!currentRound) return null;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {currentRound.bar_name && (
        <div className="text-center">
          <p className="font-medium">{currentRound.bar_name}</p>
          {currentRound.drink_description && (
            <p className="text-sm text-muted-foreground">
              {currentRound.drink_description}
            </p>
          )}
        </div>
      )}

      <SipInput />
      <RoundLiveStatus />
      {currentRound.minigame_name && (
        <MinigameResultForm round={currentRound} />
      )}
    </div>
  );
}
