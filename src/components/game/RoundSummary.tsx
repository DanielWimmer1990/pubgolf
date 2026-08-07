"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { Leaderboard } from "@/components/game/Leaderboard";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Highlight = { emoji: string; text: string };

function pick(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

function withSign(points: number): string {
  return `${points > 0 ? "+" : ""}${points}`;
}

const BEST_SIP_TEMPLATES = (name: string, points: number) => [
  `${name} rockt die Runde mit ${withSign(points)} Punkten!`,
  `${name} knallt sich mit ${withSign(points)} Punkten die Krone auf!`,
  `${name} zieht allen mit ${withSign(points)} Punkten die Show!`,
];

const WORST_SIP_TEMPLATES = (name: string, points: number) => [
  `${name} schleicht sich elegant mit ${withSign(points)} Punkten vorbei`,
  `${name} ist der Minimalist der Runde (${withSign(points)})`,
  `${name} trinkt wie ein Profi — nur ${withSign(points)} Punkte`,
];

const PENALTY_TEMPLATES = (name: string, label: string, points: number) => [
  `${name} hat's übertrieben: ${label} (${withSign(points)})`,
  `${name} kassiert eine Runde ${label} (${withSign(points)})`,
  `${name} baut Mist: ${label} (${withSign(points)})`,
];

const MINIGAME_TEMPLATES = (name: string, game: string) => [
  `${name} ist der Meister im "${game}"!`,
  `${name} räumt bei "${game}" ab!`,
  `${name} lässt niemandem eine Chance bei "${game}"!`,
];

export function RoundSummary() {
  const {
    game,
    currentRound,
    activePlayer,
    players,
    roundDrinks,
    pointAdjustments,
    minigameResults,
    isHost,
  } = useGame();
  const [advancing, setAdvancing] = useState(false);
  const [ending, setEnding] = useState(false);
  const [pickingBonusPlayer, setPickingBonusPlayer] = useState(false);
  const [reopening, setReopening] = useState(false);

  const highlights = useMemo<Highlight[]>(() => {
    if (!currentRound) return [];
    const playerById = new Map(players.map((p) => [p.id, p]));
    const items: Highlight[] = [];

    const scored = roundDrinks.filter(
      (rd) => rd.round_id === currentRound.id && rd.points != null
    );
    if (scored.length > 0) {
      const best = scored.reduce((a, b) =>
        (b.points ?? 0) > (a.points ?? 0) ? b : a
      );
      const worst = scored.reduce((a, b) =>
        (b.points ?? 0) < (a.points ?? 0) ? b : a
      );
      const bestPlayer = playerById.get(best.player_id);
      if (bestPlayer) {
        items.push({
          emoji: "🏆",
          text: pick(BEST_SIP_TEMPLATES(bestPlayer.name, best.points ?? 0)),
        });
      }
      if (worst.player_id !== best.player_id) {
        const worstPlayer = playerById.get(worst.player_id);
        if (worstPlayer) {
          items.push({
            emoji: "🐌",
            text: pick(
              WORST_SIP_TEMPLATES(worstPlayer.name, worst.points ?? 0)
            ),
          });
        }
      }
    }

    for (const pa of pointAdjustments.filter(
      (p) => p.round_id === currentRound.id
    )) {
      const player = playerById.get(pa.player_id);
      if (!player) continue;
      items.push({
        emoji: "⚠️",
        text: pick(PENALTY_TEMPLATES(player.name, pa.label, pa.points)),
      });
    }

    const winner = minigameResults.find(
      (mr) => mr.round_id === currentRound.id && mr.outcome === "winner"
    );
    if (winner && currentRound.minigame_name) {
      const player = playerById.get(winner.player_id);
      if (player) {
        items.push({
          emoji: "🎮",
          text: pick(MINIGAME_TEMPLATES(player.name, currentRound.minigame_name)),
        });
      }
    }

    return items;
  }, [currentRound, players, roundDrinks, pointAdjustments, minigameResults]);

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
  const canSeeLeaderboard =
    isHost ||
    (game.show_live_leaderboard &&
      !(game.hide_leaderboard_final_round && currentRound.is_final_round));

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

  async function reopenRound() {
    if (!currentRound) return;
    setReopening(true);
    const { error } = await supabase
      .from("rounds")
      .update({ status: "active" })
      .eq("id", currentRound.id);
    if (error) {
      console.error(error);
      toast.error("Runde konnte nicht wieder geöffnet werden.");
      setReopening(false);
    }
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
    <div className="w-full max-w-md space-y-5">
      {isHost && (
        <button
          type="button"
          onClick={reopenRound}
          disabled={reopening}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {reopening ? "Öffne…" : "Zurück zur Runde"}
        </button>
      )}
      <div className="text-center space-y-1">
        <h2 className="font-heading text-2xl font-bold">
          Runde {currentRound.round_number}
          {activePlayer && ` · ${activePlayer.name}'s Bar`} beendet
        </h2>
        {currentRound.bar_name && (
          <p className="text-sm text-muted-foreground">
            {currentRound.bar_name} · PAR {currentRound.par}
          </p>
        )}
      </div>

      {canSeeLeaderboard && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Zwischentabelle
          </p>
          <Leaderboard compact />
        </div>
      )}

      {highlights.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Highlights der Runde
          </p>
          <ul className="space-y-1.5">
            {highlights.map((h, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <span className="text-base">{h.emoji}</span>
                <span>{h.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm font-medium text-muted-foreground">
        Diese Runde
      </p>
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
            <span className="flex-1 truncate font-medium">{player.name}</span>
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
