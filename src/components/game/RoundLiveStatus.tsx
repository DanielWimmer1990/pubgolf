"use client";

import { Check } from "lucide-react";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/lib/utils";

export function RoundLiveStatus() {
  const { currentRound, players, roundDrinks } = useGame();
  if (!currentRound) return null;

  const reportedIds = new Set(
    roundDrinks
      .filter((rd) => rd.round_id === currentRound.id && rd.sips != null)
      .map((rd) => rd.player_id)
  );

  return (
    <div className="w-full max-w-md space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        {reportedIds.size} / {players.length} fertig
      </p>
      <ul className="flex flex-wrap gap-2">
        {players.map((player) => {
          const done = reportedIds.has(player.id);
          return (
            <li
              key={player.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs",
                done && "border-emerald-500/40 bg-emerald-500/10"
              )}
            >
              <PlayerAvatar
                name={player.name}
                color={player.color}
                avatarEmoji={player.avatar_emoji}
                size="sm"
                className="h-5 w-5 text-[10px]"
              />
              <span>{player.name}</span>
              {done && <Check className="h-3.5 w-3.5 text-emerald-500" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
