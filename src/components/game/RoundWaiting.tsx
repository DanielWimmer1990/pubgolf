"use client";

import { MapPin, Dices, ScrollText, Gamepad2 } from "lucide-react";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { Leaderboard } from "@/components/game/Leaderboard";
import { GuestQuickActions } from "@/components/game/GuestQuickActions";
import { PastRoundsList } from "@/components/game/PastRoundsList";
import { useGame } from "@/hooks/useGame";
import { pointsKindLabel } from "@/lib/pointsLabel";

export function RoundWaiting() {
  const { activePlayer, currentRound, leaderboard, game } = useGame();
  if (!activePlayer || !currentRound || !game) return null;

  // Respect the same final-round suspense setting used everywhere else —
  // this view is spectator-only, so no host bypass needed here.
  const suspenseActive =
    game.hide_leaderboard_final_round && currentRound.is_final_round;
  const canSeeLeaderboard = !suspenseActive && game.show_live_leaderboard;

  const items = [
    currentRound.bar_name && {
      icon: MapPin,
      text: currentRound.bar_name,
    },
    currentRound.par && {
      icon: Dices,
      text: `PAR ${currentRound.par}`,
    },
    currentRound.draft_rule_text && {
      icon: ScrollText,
      text: `${currentRound.draft_rule_text}${
        currentRound.draft_rule_points != null &&
        pointsKindLabel(currentRound.draft_rule_points)
          ? ` (${currentRound.draft_rule_points > 0 ? "+" : ""}${
              currentRound.draft_rule_points
            } ${pointsKindLabel(currentRound.draft_rule_points)})`
          : ""
      }`,
    },
    currentRound.minigame_name && {
      icon: Gamepad2,
      text: currentRound.minigame_name,
    },
  ].filter((v): v is { icon: typeof MapPin; text: string } => !!v);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <GuestQuickActions />
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
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
            {items.length > 0
              ? "Der Gastgeber bereitet die Runde vor…"
              : `Der Gastgeber wählt gerade Bar, PAR und Regel für Runde ${currentRound.round_number}…`}
          </p>
        </div>

        {items.length > 0 && (
          <ul className="w-full space-y-1.5 text-left">
            {items.map(({ icon: Icon, text }, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canSeeLeaderboard && leaderboard.length > 0 && (
        <div className="space-y-2">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Aktuelle Rangliste
          </p>
          <Leaderboard compact />
        </div>
      )}
    </div>
  );
}
