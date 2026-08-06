"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function RoundSummary() {
  const { game, currentRound, players, roundDrinks, isHost } = useGame();
  const [advancing, setAdvancing] = useState(false);
  const [ending, setEnding] = useState(false);
  const [pickingBonusPlayer, setPickingBonusPlayer] = useState(false);

  if (!game || !currentRound) return null;

  const results = players
    .map((player) => ({
      player,
      drink: roundDrinks.find(
        (rd) => rd.round_id === currentRound.id && rd.player_id === player.id
      ),
    }))
    .sort((a, b) => (b.drink?.points ?? 0) - (a.drink?.points ?? 0));

  const isLastBaseRound = currentRound.round_number >= players.length;

  async function nextRound(activePlayerId: string) {
    setAdvancing(true);
    try {
      const nextRoundNumber = currentRound!.round_number + 1;

      const { error: roundError } = await supabase.from("rounds").insert({
        game_id: game!.id,
        round_number: nextRoundNumber,
        active_player_id: activePlayerId,
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

  function autoNextRound() {
    const currentIndex = players.findIndex(
      (p) => p.id === currentRound!.active_player_id
    );
    const nextPlayer = players[(currentIndex + 1) % players.length];
    nextRound(nextPlayer.id);
  }

  async function endGame() {
    if (!window.confirm("Spiel beenden und Endergebnis zeigen?")) return;
    setEnding(true);
    const { error } = await supabase
      .from("games")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", game!.id);
    if (error) {
      console.error(error);
      toast.error("Spiel konnte nicht beendet werden.");
      setEnding(false);
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

      {!isHost && (
        <p className="text-center text-sm text-muted-foreground">
          Warte, bis die nächste Runde eröffnet wird…
        </p>
      )}

      {isHost && !isLastBaseRound && (
        <Button
          size="lg"
          className="w-full text-base"
          onClick={autoNextRound}
          disabled={advancing}
        >
          {advancing ? "Starte…" : "Nächste Runde"}
        </Button>
      )}

      {isHost && isLastBaseRound && !pickingBonusPlayer && (
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Jeder war einmal dran — das Spiel könnte hier enden.
          </p>
          <Button
            size="lg"
            className="w-full text-base"
            onClick={endGame}
            disabled={ending}
          >
            {ending ? "Beende…" : "Spiel beenden"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full border-primary/40 text-base"
            onClick={() => setPickingBonusPlayer(true)}
            disabled={advancing}
          >
            Weitere Runde spielen
          </Button>
        </div>
      )}

      {isHost && isLastBaseRound && pickingBonusPlayer && (
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <p className="text-sm font-medium text-muted-foreground">
            Wem gehört die nächste Runde?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {players.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => nextRound(player.id)}
                disabled={advancing}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border border-white/10 p-2 text-xs hover:border-primary/50"
                )}
              >
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  avatarEmoji={player.avatar_emoji}
                  size="sm"
                />
                <span className="truncate max-w-full">{player.name}</span>
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setPickingBonusPlayer(false)}
            disabled={advancing}
          >
            Abbrechen
          </Button>
        </div>
      )}
    </div>
  );
}
