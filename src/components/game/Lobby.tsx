"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, Home, Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { GameCodeBadge } from "@/components/game/GameCodeBadge";
import { JoinForm } from "@/components/game/JoinForm";
import { HostAddPlayerForm } from "@/components/game/HostAddPlayerForm";
import { EditPlayerDialog } from "@/components/game/EditPlayerDialog";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/database";

export function Lobby() {
  const { code, game, players, isHost, myPlayer } = useGame();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [starting, setStarting] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  if (!game) return null;

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
      <Link
        href="/"
        className="self-start flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        Startseite
      </Link>

      {game.header_image_url && (
        <div className="w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.header_image_url}
            alt=""
            className="h-32 w-full rounded-3xl border border-white/10 object-cover"
          />
        </div>
      )}

      <div className="text-center space-y-1">
        <h1 className="font-heading text-3xl font-bold">
          {game.name || "Pubgolf-Spiel"}
        </h1>
        <p className="text-sm text-muted-foreground">Wartet in der Lobby</p>
      </div>

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

      <GameCodeBadge code={code} />

      {isHost ? (
        <div className="w-full max-w-sm">
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

      <EditPlayerDialog
        player={editingPlayer}
        onClose={() => setEditingPlayer(null)}
      />
    </main>
  );
}
