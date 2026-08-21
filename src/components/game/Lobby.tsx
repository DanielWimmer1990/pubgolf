"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, Home, Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { GameCodeBadge } from "@/components/game/GameCodeBadge";
import { JoinForm } from "@/components/game/JoinForm";
import { HostAddPlayerForm } from "@/components/game/HostAddPlayerForm";
import { EditPlayerDialog } from "@/components/game/EditPlayerDialog";
import {
  GameSettingsForm,
  type GameSettings,
} from "@/components/game/GameSettingsForm";
import { toSettings } from "@/components/game/GameSettingsDialog";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { randomizeTurnOrder } from "@/lib/turnOrder";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/database";

export function Lobby() {
  const { code, game, players, isHost, myPlayer } = useGame();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [step, setStep] = useState<"players" | "settings">("players");
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [starting, setStarting] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  if (!game) return null;

  function goToSettings() {
    if (players.length < 2) {
      toast.error("Mindestens 2 Spieler nötig, um zu starten.");
      return;
    }
    setSettings(toSettings(game!));
    setStep("settings");
  }

  async function startGame() {
    if (!settings) return;
    setStarting(true);
    try {
      // Settings + status go into one write, run alongside the turn
      // order shuffle instead of several sequential round-trips.
      const [gameResult, shuffledPlayers] = await Promise.all([
        supabase
          .from("games")
          .update({
            scoring_table: settings.scoringTable,
            default_drink: settings.defaultDrink.trim() || null,
            penalty_types: settings.penaltyTypes,
            show_final_presentation: settings.showFinalPresentation,
            show_live_leaderboard: settings.showLiveLeaderboard,
            hide_leaderboard_final_round: settings.hideLeaderboardFinalRound,
            status: "in_progress",
            current_round_number: 1,
            started_at: new Date().toISOString(),
          })
          .eq("id", game!.id),
        randomizeTurnOrder(players),
      ]);
      if (gameResult.error) throw gameResult.error;

      const firstPlayer = shuffledPlayers[0];
      const { error: roundError } = await supabase.from("rounds").insert({
        game_id: game!.id,
        round_number: 1,
        active_player_id: firstPlayer.id,
        status: "setup",
      });
      if (roundError) throw roundError;
    } catch (err) {
      console.error(err);
      toast.error("Spiel konnte nicht gestartet werden.");
      setStarting(false);
    }
  }

  return (
    step === "settings" && settings ? (
      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setStep("players")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Zurück
            </button>
            <h1 className="font-heading text-3xl font-bold">
              Spieleinstellungen
            </h1>
          </div>

          <GameSettingsForm value={settings} onChange={setSettings} />

          <Button
            size="lg"
            className="w-full text-base"
            onClick={startGame}
            disabled={starting}
          >
            {starting ? "Starte…" : "Spiel starten"}
          </Button>
        </div>
      </main>
    ) : (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-10">
      <Link
        href="/"
        className="self-start flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        Startseite
      </Link>

      <div className="text-center space-y-1">
        <h1 className="font-heading text-3xl font-bold">
          {game.name || "Pubgolf-Spiel"}
        </h1>
        <p className="text-sm text-muted-foreground">Wartet in der Lobby</p>
      </div>

      <div className="w-full max-w-md space-y-2">
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
              {isHost && (
                <button
                  type="button"
                  onClick={() => setEditingPlayer(player)}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground",
                    !player.is_host && "ml-auto"
                  )}
                  aria-label={`${player.name} bearbeiten`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>

        {isHost && (
          <div className="space-y-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between border-primary/40 text-base"
              onClick={() => setShowAddPlayer((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                Spieler hinzufügen
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  showAddPlayer && "rotate-180"
                )}
              />
            </Button>
            {showAddPlayer && (
              <HostAddPlayerForm onDone={() => setShowAddPlayer(false)} />
            )}
          </div>
        )}
      </div>

      <GameCodeBadge code={code} gameName={game.name} />

      {isHost ? (
        <div className="w-full max-w-md">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={goToSettings}
            disabled={players.length < 2}
          >
            {players.length < 2
              ? "Warte auf mehr Spieler…"
              : "Weiter zu den Einstellungen"}
          </Button>
        </div>
      ) : myPlayer ? (
        <p className="text-sm text-muted-foreground">
          Du bist dabei! Warte, bis der Host das Spiel startet…
        </p>
      ) : (
        <div className="w-full max-w-md space-y-3">
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

      <EditPlayerDialog
        player={editingPlayer}
        onClose={() => setEditingPlayer(null)}
      />
    </main>
    )
  );
}
