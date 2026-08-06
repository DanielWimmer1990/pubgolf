"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { GameCodeBadge } from "@/components/game/GameCodeBadge";
import { ScoringTableEditor } from "@/components/game/ScoringTableEditor";
import { JoinForm } from "@/components/game/JoinForm";
import { HostAddPlayerForm } from "@/components/game/HostAddPlayerForm";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import type { ScoringTable } from "@/types/database";

export function Lobby() {
  const { code, game, players, isHost, myPlayer } = useGame();
  const [scoringTable, setScoringTable] = useState<ScoringTable | null>(null);
  const [showScoring, setShowScoring] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [starting, setStarting] = useState(false);
  const [savingScoring, setSavingScoring] = useState(false);

  if (!game) return null;
  const effectiveScoringTable = scoringTable ?? game.scoring_table;

  async function saveScoringTable(next: ScoringTable) {
    setScoringTable(next);
    setSavingScoring(true);
    const { error } = await supabase
      .from("games")
      .update({ scoring_table: next })
      .eq("id", game!.id);
    setSavingScoring(false);
    if (error) toast.error("Punkte-Regeln konnten nicht gespeichert werden.");
  }

  async function startGame() {
    if (players.length < 2) {
      toast.error("Mindestens 2 Spieler nötig, um zu starten.");
      return;
    }
    setStarting(true);
    try {
      const firstPlayer = players[0];
      const { data: round, error: roundError } = await supabase
        .from("rounds")
        .insert({
          game_id: game!.id,
          round_number: 1,
          active_player_id: firstPlayer.id,
          status: "setup",
        })
        .select()
        .single();
      if (roundError || !round) throw roundError;

      const { error: gameError } = await supabase
        .from("games")
        .update({
          status: "in_progress",
          current_round_number: 1,
          started_at: new Date().toISOString(),
        })
        .eq("id", game!.id);
      if (gameError) throw gameError;
    } catch (err) {
      console.error(err);
      toast.error("Spiel konnte nicht gestartet werden.");
      setStarting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-10">
      <div className="text-center space-y-1">
        <h1 className="font-heading text-3xl font-bold">
          {game.name || "Pubgolf-Spiel"}
        </h1>
        <p className="text-sm text-muted-foreground">Wartet in der Lobby</p>
      </div>

      <GameCodeBadge code={code} />

      <div className="w-full max-w-sm space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Spieler ({players.length})
        </p>
        <ul className="space-y-2">
          {players.map((player) => (
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
              <span className="font-medium">{player.name}</span>
              {player.is_host && (
                <span className="ml-auto text-xs font-medium text-primary">
                  Host
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <div className="w-full max-w-sm space-y-4">
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 text-muted-foreground"
              onClick={() => setShowAddPlayer((v) => !v)}
            >
              {showAddPlayer ? "Formular ausblenden" : "+ Spieler hinzufügen"}
            </Button>
            {showAddPlayer && (
              <HostAddPlayerForm onDone={() => setShowAddPlayer(false)} />
            )}
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 text-muted-foreground"
              onClick={() => setShowScoring((v) => !v)}
            >
              {showScoring
                ? "Punkte-Regeln ausblenden"
                : "Punkte-Regeln anpassen"}
            </Button>
            {showScoring && (
              <ScoringTableEditor
                value={effectiveScoringTable}
                onChange={saveScoringTable}
              />
            )}
            {savingScoring && (
              <p className="text-xs text-muted-foreground">Speichere…</p>
            )}
          </div>

          <Button
            size="lg"
            className="w-full text-base"
            onClick={startGame}
            disabled={starting || players.length < 2}
          >
            {starting
              ? "Starte…"
              : players.length < 2
              ? "Warte auf mehr Spieler…"
              : "Spiel starten"}
          </Button>
        </div>
      ) : myPlayer ? (
        <p className="text-sm text-muted-foreground">
          Du bist dabei! Warte, bis der Host das Spiel startet…
        </p>
      ) : (
        <div className="w-full max-w-sm space-y-3">
          {showJoin ? (
            <JoinForm onDone={() => setShowJoin(false)} />
          ) : (
            <>
              <Button
                size="lg"
                className="w-full text-base"
                onClick={() => setShowJoin(true)}
              >
                Ich spiele mit
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                oder einfach zuschauen — der Host startet, sobald alle da
                sind
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
