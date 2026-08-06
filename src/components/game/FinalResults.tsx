"use client";

import { useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/database";

const MEDALS = ["🥇", "🥈", "🥉"];

type FunAward = {
  emoji: string;
  title: string;
  player: Player;
  detail: string;
};

export function FinalResults() {
  const {
    game,
    leaderboard,
    players,
    rounds,
    roundDrinks,
    ruleViolations,
    minigameResults,
  } = useGame();
  const presentation = game?.show_final_presentation ?? true;

  useEffect(() => {
    if (!presentation) return;
    const duration = 2000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ["#F97316", "#EF4444", "#EAB308", "#10B981"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ["#F97316", "#EF4444", "#EAB308", "#10B981"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [presentation]);

  const funAwards = useMemo<FunAward[]>(() => {
    const awards: FunAward[] = [];
    const playerById = new Map(players.map((p) => [p.id, p]));

    const violationCounts = new Map<string, number>();
    for (const rv of ruleViolations) {
      violationCounts.set(
        rv.violator_player_id,
        (violationCounts.get(rv.violator_player_id) ?? 0) + 1
      );
    }
    const topViolator = [...violationCounts.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (topViolator) {
      const player = playerById.get(topViolator[0]);
      if (player) {
        awards.push({
          emoji: "🚨",
          title: "Regelbrecher-König",
          player,
          detail: `${topViolator[1]}x erwischt`,
        });
      }
    }

    const scoredDrinks = roundDrinks.filter((rd) => rd.points != null);
    if (scoredDrinks.length > 0) {
      const best = scoredDrinks.reduce((a, b) =>
        (b.points ?? 0) > (a.points ?? 0) ? b : a
      );
      const bestPlayer = playerById.get(best.player_id);
      const bestRound = rounds.find((r) => r.id === best.round_id);
      if (bestPlayer) {
        awards.push({
          emoji: "🏆",
          title: "Bester Schluck",
          player: bestPlayer,
          detail: `${best.points! > 0 ? "+" : ""}${best.points} Punkte${
            bestRound?.bar_name ? ` in ${bestRound.bar_name}` : ""
          }`,
        });
      }

      const worst = scoredDrinks.reduce((a, b) =>
        (b.points ?? 0) < (a.points ?? 0) ? b : a
      );
      const worstPlayer = playerById.get(worst.player_id);
      const worstRound = rounds.find((r) => r.id === worst.round_id);
      if (worstPlayer) {
        awards.push({
          emoji: "🐌",
          title: "Langsamster Schluck",
          player: worstPlayer,
          detail: `${worst.points! > 0 ? "+" : ""}${worst.points} Punkte${
            worstRound?.bar_name ? ` in ${worstRound.bar_name}` : ""
          }`,
        });
      }
    }

    const winCounts = new Map<string, number>();
    for (const mr of minigameResults) {
      if (mr.outcome !== "winner") continue;
      winCounts.set(mr.player_id, (winCounts.get(mr.player_id) ?? 0) + 1);
    }
    const topWinner = [...winCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topWinner) {
      const player = playerById.get(topWinner[0]);
      if (player) {
        awards.push({
          emoji: "🎮",
          title: "Minispiel-Champion",
          player,
          detail: `${topWinner[1]}x gewonnen`,
        });
      }
    }

    return awards;
  }, [players, rounds, roundDrinks, ruleViolations, minigameResults]);

  return (
    <div className="w-full max-w-sm space-y-8 py-6">
      {game?.header_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.header_image_url}
          alt=""
          className="h-32 w-full rounded-3xl border border-white/10 object-cover"
        />
      )}

      <div className="text-center space-y-1">
        <div className="text-6xl">🏁</div>
        <h1 className="font-heading text-4xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
          Spiel beendet!
        </h1>
        <p className="text-sm text-muted-foreground">Endstand</p>
      </div>

      <ul className="space-y-2">
        {leaderboard.map(({ player, total }, index) =>
          presentation ? (
            <motion.li
              key={player.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (leaderboard.length - index) * 0.08 }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-xl",
                index === 0 && "border-amber-400/60 bg-amber-400/10"
              )}
            >
              <span className="w-7 text-center text-lg">
                {MEDALS[index] ?? index + 1}
              </span>
              <PlayerAvatar
                name={player.name}
                color={player.color}
                avatarEmoji={player.avatar_emoji}
                size="md"
              />
              <span className="flex-1 truncate font-semibold">
                {player.name}
              </span>
              <span
                className={cn(
                  "text-lg font-bold tabular-nums",
                  total > 0 && "text-emerald-500",
                  total < 0 && "text-red-500"
                )}
              >
                {total > 0 ? "+" : ""}
                {total}
              </span>
            </motion.li>
          ) : (
            <li
              key={player.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2"
            >
              <span className="w-6 text-center text-sm text-muted-foreground">
                {index + 1}.
              </span>
              <PlayerAvatar
                name={player.name}
                color={player.color}
                avatarEmoji={player.avatar_emoji}
                size="sm"
              />
              <span className="flex-1 truncate font-medium">
                {player.name}
              </span>
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
          )
        )}
      </ul>

      {presentation && funAwards.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Fun Awards
          </p>
          <ul className="space-y-2">
            {funAwards.map((award) => (
              <li
                key={award.title}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-xl"
              >
                <span className="text-xl">{award.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{award.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {award.player.name} · {award.detail}
                  </p>
                </div>
                <PlayerAvatar
                  name={award.player.name}
                  color={award.player.color}
                  avatarEmoji={award.player.avatar_emoji}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
