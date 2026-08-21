"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { Leaderboard } from "@/components/game/Leaderboard";
import { RoundBreakdownCard } from "@/components/game/RoundBreakdownCard";
import { GuestQuickActions } from "@/components/game/GuestQuickActions";
import { PastRoundsList } from "@/components/game/PastRoundsList";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function RoundSummary() {
  const { game, currentRound, activePlayer, players, isHost } = useGame();
  const [advancing, setAdvancing] = useState(false);
  const [ending, setEnding] = useState(false);
  const [pickingBonusPlayer, setPickingBonusPlayer] = useState(false);
  const [reopening, setReopening] = useState(false);

  if (!game || !currentRound) return null;

  const isLastBaseRound = currentRound.round_number >= players.length;
  // Suspense for the final round hides the leaderboard from everyone,
  // host included — that's the whole point of the setting, otherwise the
  // host could just check the round summary and spoil their own reveal.
  const suspenseActive =
    game.hide_leaderboard_final_round && currentRound.is_final_round;
  const canSeeLeaderboard =
    !suspenseActive && (isHost || game.show_live_leaderboard);

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
      <GuestQuickActions />
      <div className="text-center space-y-1">
        <h2 className="font-heading text-2xl font-bold">
          Runde {currentRound.round_number} beendet
        </h2>
        {activePlayer && (
          <p className="font-heading text-lg text-muted-foreground">
            {activePlayer.name}&apos;s Bar
          </p>
        )}
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

      {suspenseActive && (
        <p className="text-center text-xs text-muted-foreground">
          🤫 Die Rangliste bleibt geheim — die Auflösung gibt es im
          Endergebnis, sobald das Spiel beendet ist.
        </p>
      )}

      {!isHost && <RoundBreakdownCard round={currentRound} />}
      {!isHost && <PastRoundsList />}

      {isLastBaseRound && (
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-primary">
          🏁 Letzte Runde
        </p>
      )}

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
