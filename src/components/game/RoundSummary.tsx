"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";

export function RoundSummary() {
  const { game, currentRound, players, roundDrinks, isHost } = useGame();
  const [advancing, setAdvancing] = useState(false);

  if (!game || !currentRound) return null;

  const results = players
    .map((player) => ({
      player,
      drink: roundDrinks.find(
        (rd) => rd.round_id === currentRound.id && rd.player_id === player.id
      ),
    }))
    .sort((a, b) => (b.drink?.points ?? 0) - (a.drink?.points ?? 0));

  const canAdvance = isHost;

  async function nextRound() {
    setAdvancing(true);
    try {
      const currentIndex = players.findIndex(
        (p) => p.id === currentRound!.active_player_id
      );
      const nextPlayer = players[(currentIndex + 1) % players.length];
      const nextRoundNumber = currentRound!.round_number + 1;

      const { error: roundError } = await supabase.from("rounds").insert({
        game_id: game!.id,
        round_number: nextRoundNumber,
        active_player_id: nextPlayer.id,
        status: "setup",
      });
      if (roundError) throw roundError;

      const { error: gameError } = await supabase
        .from("games")
        .update({ current_round_number: nextRoundNumber })
        .eq("id", game!.id);
      if (gameError) throw gameError;
    } catch (err) {
      console.error(err);
      toast.error("Nächste Runde konnte nicht gestartet werden.");
      setAdvancing(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-heading text-2xl font-bold">
          Runde {currentRound.round_number} beendet
        </h2>
        {currentRound.bar_name && (
          <p className="text-sm text-muted-foreground">
            {currentRound.bar_name} · PAR {currentRound.par}
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {results.map(({ player, drink }) => (
          <li
            key={player.id}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-xl"
          >
            <PlayerAvatar
              name={player.name}
              color={player.color}
              avatarEmoji={player.avatar_emoji}
              size="sm"
            />
            <div className="flex-1">
              <p className="font-medium leading-none">{player.name}</p>
              <p className="text-xs text-muted-foreground">
                {drink?.sips ?? "–"} Schlucke
              </p>
            </div>
            <span
              className={
                (drink?.points ?? 0) > 0
                  ? "font-bold text-emerald-500"
                  : (drink?.points ?? 0) < 0
                  ? "font-bold text-red-500"
                  : "font-bold text-muted-foreground"
              }
            >
              {(drink?.points ?? 0) > 0 ? "+" : ""}
              {drink?.points ?? 0}
            </span>
          </li>
        ))}
      </ul>

      {canAdvance ? (
        <Button
          size="lg"
          className="w-full text-base"
          onClick={nextRound}
          disabled={advancing}
        >
          {advancing ? "Starte…" : "Nächste Runde"}
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Warte, bis die nächste Runde eröffnet wird…
        </p>
      )}
    </div>
  );
}
