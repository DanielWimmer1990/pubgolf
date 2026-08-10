"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { ScoreProgressionChart } from "@/components/game/ScoreProgressionChart";
import { ShareResultsButton } from "@/components/game/ShareResultsButton";
import { ExportPages } from "@/components/game/ExportPages";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/database";

const MEDALS = ["🥇", "🥈", "🥉"];
const REVEAL_STEP = 0.7;
const CONFETTI_COLORS = ["#F97316", "#EF4444", "#EAB308", "#10B981", "#FBBF24"];

function fireConfetti(big = false) {
  const duration = big ? 2200 : 1400;
  const end = Date.now() + duration;
  (function frame() {
    confetti({
      particleCount: big ? 10 : 4,
      angle: 60,
      spread: big ? 100 : 60,
      origin: { x: 0 },
      colors: CONFETTI_COLORS,
    });
    confetti({
      particleCount: big ? 10 : 4,
      angle: 120,
      spread: big ? 100 : 60,
      origin: { x: 1 },
      colors: CONFETTI_COLORS,
    });
    if (big) {
      confetti({
        particleCount: 24,
        spread: 120,
        startVelocity: 48,
        origin: { x: 0.5, y: 0.3 },
        colors: CONFETTI_COLORS,
      });
    }
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

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
    pointAdjustments,
  } = useGame();
  const presentation = game?.show_final_presentation ?? true;
  const pagesRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const showResults = !presentation || revealed;

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    fireConfetti();
    const winnerDelayMs = leaderboard.length * REVEAL_STEP * 1000;
    window.setTimeout(() => fireConfetti(true), winnerDelayMs + 200);
  }

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
      // Golf-style: the most negative (most Gutpunkte) sip is the best one,
      // the most positive (most Strafpunkte) is the roughest.
      const best = scoredDrinks.reduce((a, b) =>
        (b.points ?? 0) < (a.points ?? 0) ? b : a
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
        (b.points ?? 0) > (a.points ?? 0) ? b : a
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

      const sipTotals = new Map<string, number>();
      for (const rd of roundDrinks) {
        if (rd.sips == null) continue;
        sipTotals.set(rd.player_id, (sipTotals.get(rd.player_id) ?? 0) + rd.sips);
      }
      const topDrinker = [...sipTotals.entries()].sort((a, b) => b[1] - a[1])[0];
      if (topDrinker) {
        const player = playerById.get(topDrinker[0]);
        if (player) {
          awards.push({
            emoji: "🍺",
            title: "Durstigster Spieler",
            player,
            detail: `${topDrinker[1]} Schlucke insgesamt`,
          });
        }
      }
    }

    const winCounts = new Map<string, number>();
    const loseCounts = new Map<string, number>();
    for (const mr of minigameResults) {
      if (mr.outcome === "winner") {
        winCounts.set(mr.player_id, (winCounts.get(mr.player_id) ?? 0) + 1);
      } else if (mr.outcome === "loser") {
        loseCounts.set(mr.player_id, (loseCounts.get(mr.player_id) ?? 0) + 1);
      }
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
    const topLoser = [...loseCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topLoser) {
      const player = playerById.get(topLoser[0]);
      if (player) {
        awards.push({
          emoji: "🙈",
          title: "Minispiel-Pechvogel",
          player,
          detail: `${topLoser[1]}x verloren`,
        });
      }
    }

    const penaltyTotals = new Map<string, number>();
    for (const pa of pointAdjustments) {
      penaltyTotals.set(
        pa.player_id,
        (penaltyTotals.get(pa.player_id) ?? 0) + pa.points
      );
    }
    const topPenalized = [...penaltyTotals.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (topPenalized) {
      const player = playerById.get(topPenalized[0]);
      if (player) {
        awards.push({
          emoji: "🚽",
          title: "Strafpunkte-Sammler",
          player,
          detail: `+${topPenalized[1]} Strafpunkte`,
        });
      }
    }

    return awards;
  }, [
    players,
    rounds,
    roundDrinks,
    ruleViolations,
    minigameResults,
    pointAdjustments,
  ]);

  const progression = useMemo(() => {
    const maxRound = rounds.reduce((max, r) => Math.max(max, r.round_number), 0);
    const roundIdToNumber = new Map(rounds.map((r) => [r.id, r.round_number]));
    const deltaByRoundPlayer = new Map<number, Map<string, number>>();

    function addDelta(
      roundId: string | null | undefined,
      playerId: string,
      points: number
    ) {
      const roundNumber = roundId ? roundIdToNumber.get(roundId) : undefined;
      if (!roundNumber) return;
      if (!deltaByRoundPlayer.has(roundNumber)) {
        deltaByRoundPlayer.set(roundNumber, new Map());
      }
      const m = deltaByRoundPlayer.get(roundNumber)!;
      m.set(playerId, (m.get(playerId) ?? 0) + points);
    }

    for (const rd of roundDrinks) {
      if (rd.points != null) addDelta(rd.round_id, rd.player_id, rd.points);
    }
    for (const pa of pointAdjustments) {
      addDelta(pa.round_id, pa.player_id, pa.points);
    }
    for (const mr of minigameResults) {
      addDelta(mr.round_id, mr.player_id, mr.points_applied);
    }
    for (const rv of ruleViolations) {
      addDelta(rv.round_id, rv.violator_player_id, rv.points_applied);
    }

    const series = new Map<string, number[]>();
    for (const player of players) {
      let cum = 0;
      const arr: number[] = [];
      for (let rn = 1; rn <= maxRound; rn++) {
        cum += deltaByRoundPlayer.get(rn)?.get(player.id) ?? 0;
        arr.push(cum);
      }
      series.set(player.id, arr);
    }

    return { maxRound, series };
  }, [rounds, roundDrinks, pointAdjustments, minigameResults, ruleViolations, players]);

  const roundBreakdown = useMemo(() => {
    return rounds
      .filter((r) => r.status === "done")
      .sort((a, b) => a.round_number - b.round_number)
      .map((round) => ({
        round,
        cells: players.map((player) => {
          const drink = roundDrinks.find(
            (rd) => rd.round_id === round.id && rd.player_id === player.id
          );
          return {
            player,
            sips: drink?.sips ?? null,
            points: drink?.points ?? null,
          };
        }),
      }));
  }, [rounds, players, roundDrinks]);

  const summary = useMemo(() => {
    if (leaderboard.length === 0) return null;
    const [winner, runnerUp] = leaderboard;
    // Golf-style: winner has the lowest total, so the lead is how far
    // behind the runner-up is.
    const margin = runnerUp ? runnerUp.total - winner.total : null;
    const sentences: string[] = [];
    sentences.push(
      `${winner.player.name} gewinnt mit ${winner.total > 0 ? "+" : ""}${
        winner.total
      } Punkten${
        margin != null && runnerUp
          ? margin === 0
            ? ` – Gleichstand mit ${runnerUp.player.name}!`
            : ` – ${margin} Punkte Vorsprung auf ${runnerUp.player.name}.`
          : "."
      }`
    );
    const last = leaderboard[leaderboard.length - 1];
    if (last && last.player.id !== winner.player.id) {
      sentences.push(
        `${last.player.name} musste sich mit ${last.total > 0 ? "+" : ""}${
          last.total
        } Punkten hinten anstellen.`
      );
    }
    if (funAwards.length > 0) {
      const a = funAwards[0];
      sentences.push(`${a.emoji} ${a.title}: ${a.player.name} (${a.detail}).`);
    }
    return sentences.join(" ");
  }, [leaderboard, funAwards]);

  return (
    <div className="w-full max-w-md space-y-8 py-6">
      <ExportPages
        pagesRef={pagesRef}
        gameName={game?.name || game?.code || "Pubgolf"}
        leaderboard={leaderboard}
        players={players}
        funAwards={funAwards}
        progression={progression}
        roundBreakdown={roundBreakdown}
      />
      <div className="space-y-8">
        <div className="text-center space-y-1">
          <div className="text-6xl">🏁</div>
          <h1 className="font-heading text-4xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
            Spiel beendet!
          </h1>
          <p className="text-sm text-muted-foreground">Endstand</p>
        </div>

        {presentation && !revealed ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 py-10 backdrop-blur-xl">
            <p className="text-sm text-muted-foreground">Wer hat gewonnen?</p>
            <Button size="lg" className="gap-2 text-base" onClick={reveal}>
              🥁 Rangliste aufdecken
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {leaderboard.map(({ player, total }, index) =>
              presentation ? (
                <motion.li
                  key={player.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={
                    index === 0
                      ? { opacity: 1, y: 0, scale: [1, 1.3, 1] }
                      : { opacity: 1, y: 0 }
                  }
                  transition={{
                    delay: (leaderboard.length - index) * REVEAL_STEP,
                    duration: index === 0 ? 0.7 : 0.4,
                    times: index === 0 ? [0, 0.5, 1] : undefined,
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-xl",
                    index === 0 &&
                      "border-amber-400/60 bg-amber-400/10 shadow-[0_0_40px_-8px] shadow-amber-400/50"
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
                      total < 0 && "text-emerald-500",
                      total > 0 && "text-red-500"
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
                      total < 0 && "text-emerald-500",
                      total > 0 && "text-red-500"
                    )}
                  >
                    {total > 0 ? "+" : ""}
                    {total}
                  </span>
                </li>
              )
            )}
          </ul>
        )}

        {presentation && showResults && summary && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">
              Zusammenfassung
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm leading-relaxed backdrop-blur-xl">
              {summary}
            </p>
          </div>
        )}

        {presentation && showResults && progression.maxRound > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Punkteverlauf
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <ScoreProgressionChart
                players={players}
                maxRound={progression.maxRound}
                series={progression.series}
              />
            </div>
          </div>
        )}

        {presentation && showResults && funAwards.length > 0 && (
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

      <ShareResultsButton
        pagesRef={pagesRef}
        fileName={`pubgolf-${game?.code ?? "ergebnis"}.pdf`}
      />

      <Button asChild size="lg" className="w-full text-base gap-2">
        <Link href="/">
          <Home className="h-4 w-4" />
          Zur Startseite
        </Link>
      </Button>
    </div>
  );
}
