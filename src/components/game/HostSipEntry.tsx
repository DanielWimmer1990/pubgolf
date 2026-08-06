"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { computePointsForSips } from "@/lib/scoring";
import type { Round } from "@/types/database";

export function HostSipEntry({ round }: { round: Round }) {
  const { game, players, roundDrinks } = useGame();
  const par = round.par ?? 1;

  const existing = new Map(
    roundDrinks
      .filter((rd) => rd.round_id === round.id && rd.sips != null)
      .map((rd) => [rd.player_id, rd.sips as number])
  );

  // undefined = host hasn't touched this player's stepper yet — stays
  // unsaved so "X / Y fertig" only counts sips the host actually entered.
  const [sipsByPlayer, setSipsByPlayer] = useState<Record<string, number>>(
    () => Object.fromEntries(existing)
  );
  const [submitting, setSubmitting] = useState(false);

  if (!game) return null;

  function setSips(playerId: string, value: number) {
    setSipsByPlayer((prev) => ({ ...prev, [playerId]: Math.max(1, value) }));
  }

  function bump(playerId: string, delta: number) {
    const current = sipsByPlayer[playerId];
    setSips(playerId, current === undefined ? par + delta : current + delta);
  }

  function setToPar(playerId: string) {
    setSips(playerId, par);
  }

  const touchedIds = Object.keys(sipsByPlayer);

  async function submitAll() {
    if (touchedIds.length === 0) return;
    setSubmitting(true);
    const rows = touchedIds.map((playerId) => ({
      round_id: round.id,
      player_id: playerId,
      sips: sipsByPlayer[playerId],
    }));
    const { error } = await supabase
      .from("round_drinks")
      .upsert(rows, { onConflict: "round_id,player_id" });
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error("Schlucke konnten nicht gespeichert werden.");
      return;
    }
    toast.success("Schlucke gespeichert!");
  }

  return (
    <div className="w-full max-w-md space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <p className="text-sm font-medium text-muted-foreground">
        Schlucke pro Spieler eintragen (PAR {par})
      </p>
      <ul className="space-y-2">
        {players.map((player) => {
          const sips = sipsByPlayer[player.id];
          const points =
            sips === undefined
              ? null
              : computePointsForSips(sips, par, game.scoring_table);
          return (
            <li
              key={player.id}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5"
            >
              <PlayerAvatar
                name={player.name}
                color={player.color}
                avatarEmoji={player.avatar_emoji}
                size="sm"
              />
              <span className="flex-1 truncate font-medium">
                {player.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => bump(player.id, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-lg hover:bg-white/10"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setToPar(player.id)}
                  className="w-6 text-center text-lg font-bold tabular-nums text-muted-foreground data-[set=true]:text-foreground"
                  data-set={sips !== undefined}
                >
                  {sips ?? "–"}
                </button>
                <button
                  type="button"
                  onClick={() => bump(player.id, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-lg hover:bg-white/10"
                >
                  +
                </button>
              </div>
              <span
                className={
                  points === null
                    ? "w-10 text-right text-sm text-muted-foreground"
                    : points > 0
                    ? "w-10 text-right text-sm font-bold text-emerald-400"
                    : points < 0
                    ? "w-10 text-right text-sm font-bold text-red-400"
                    : "w-10 text-right text-sm font-bold text-muted-foreground"
                }
              >
                {points === null
                  ? "–"
                  : `${points > 0 ? "+" : ""}${points}`}
              </span>
            </li>
          );
        })}
      </ul>

      <Button
        size="lg"
        className="w-full text-base"
        onClick={submitAll}
        disabled={submitting || touchedIds.length === 0}
      >
        {submitting
          ? "Speichere…"
          : touchedIds.length > 0
          ? `Speichern (${touchedIds.length})`
          : "Speichern"}
      </Button>
    </div>
  );
}
