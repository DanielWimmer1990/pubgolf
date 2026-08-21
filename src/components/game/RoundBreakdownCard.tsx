"use client";

import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/lib/utils";
import type { Round } from "@/types/database";

function PointsTag({ points }: { points: number }) {
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        points < 0 && "text-emerald-500",
        points > 0 && "text-red-500"
      )}
    >
      {points > 0 ? "+" : ""}
      {points}
    </span>
  );
}

/** Per-player breakdown for one round — sips, rule violations, minigame
 * outcome and extra points. Used both for the live current round and for
 * browsing past rounds, so guests always see what actually happened. */
export function RoundBreakdownCard({
  round,
  bare = false,
}: {
  round: Round;
  /** Skip the outer card chrome when already nested inside one (e.g. a
   * <details> disclosure in PastRoundsList). */
  bare?: boolean;
}) {
  const {
    players,
    roundDrinks,
    rules,
    ruleViolations,
    minigameResults,
    pointAdjustments,
  } = useGame();

  const ruleById = new Map(rules.map((r) => [r.id, r]));

  return (
    <div
      className={cn(
        "w-full max-w-md space-y-3",
        !bare &&
          "rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
      )}
    >
      <div>
        <p className="font-heading text-sm font-semibold">
          {round.bar_name ?? `Runde ${round.round_number}`}
        </p>
        {round.par && (
          <p className="text-xs text-muted-foreground">PAR {round.par}</p>
        )}
      </div>

      <ul className="space-y-3">
        {players.map((player) => {
          const drink = roundDrinks.find(
            (rd) => rd.round_id === round.id && rd.player_id === player.id
          );
          const violations = ruleViolations.filter(
            (rv) =>
              rv.round_id === round.id && rv.violator_player_id === player.id
          );
          const minigame = minigameResults.find(
            (mr) => mr.round_id === round.id && mr.player_id === player.id
          );
          const extras = pointAdjustments.filter(
            (pa) => pa.round_id === round.id && pa.player_id === player.id
          );

          const total =
            (drink?.points ?? 0) +
            violations.reduce((sum, v) => sum + v.points_applied, 0) +
            (minigame?.outcome !== "neutral" ? minigame?.points_applied ?? 0 : 0) +
            extras.reduce((sum, e) => sum + e.points, 0);

          const hasAnything =
            drink?.sips != null ||
            violations.length > 0 ||
            (minigame && minigame.outcome !== "neutral") ||
            extras.length > 0;

          return (
            <li key={player.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  avatarEmoji={player.avatar_emoji}
                  size="sm"
                />
                <span className="flex-1 truncate text-sm font-medium">
                  {player.name}
                </span>
                {hasAnything && <PointsTag points={total} />}
              </div>
              <div className="ml-8 space-y-0.5 text-xs text-muted-foreground">
                {drink?.sips != null && (
                  <p>
                    🍺 {drink.sips} Schlucke
                    {drink.points != null && (
                      <>
                        {" "}
                        · <PointsTag points={drink.points} />
                      </>
                    )}
                  </p>
                )}
                {violations.map((v) => (
                  <p key={v.id}>
                    📜 {ruleById.get(v.rule_id)?.text ?? "Regelbruch"} ·{" "}
                    <PointsTag points={v.points_applied} />
                  </p>
                ))}
                {minigame && minigame.outcome !== "neutral" && (
                  <p>
                    🎲 {round.minigame_name ?? "Minispiel"}:{" "}
                    {minigame.outcome === "winner" ? "Gewinner" : "Verlierer"}{" "}
                    · <PointsTag points={minigame.points_applied} />
                  </p>
                )}
                {extras.map((e) => (
                  <p key={e.id}>
                    ✨ {e.label} · <PointsTag points={e.points} />
                  </p>
                ))}
                {!hasAnything && <p>Noch nichts eingetragen.</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
