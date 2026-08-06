"use client";

import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({ compact = false }: { compact?: boolean }) {
  const { leaderboard } = useGame();

  return (
    <div className="w-full max-w-md space-y-2">
      {!compact && (
        <p className="text-sm font-medium text-muted-foreground">
          Rangliste
        </p>
      )}
      <ul className="space-y-1.5">
        {leaderboard.map(({ player, total }, index) => (
          <li
            key={player.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl",
              index === 0 && "border-amber-400/50 bg-amber-400/10"
            )}
          >
            <span className="w-6 text-center text-sm text-muted-foreground">
              {MEDALS[index] ?? index + 1}
            </span>
            <PlayerAvatar
              name={player.name}
              color={player.color}
              avatarEmoji={player.avatar_emoji}
              size="sm"
            />
            <span className="flex-1 truncate font-medium">{player.name}</span>
            <span
              className={cn(
                "font-bold tabular-nums",
                total > 0 && "text-emerald-500",
                total < 0 && "text-red-500"
              )}
            >
              {total > 0 ? "+" : ""}
              {total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
