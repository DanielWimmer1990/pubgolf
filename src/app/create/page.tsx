"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlayerIdentityForm,
  type PlayerIdentity,
} from "@/components/game/PlayerIdentityForm";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { GameCodeBadge } from "@/components/game/GameCodeBadge";
import {
  GameSettingsForm,
  type GameSettings,
} from "@/components/game/GameSettingsForm";
import { supabase } from "@/lib/supabase";
import { generateUniqueGameCode } from "@/lib/gameCode";
import { computeDefaultScoringTable } from "@/lib/scoring";
import { getOrCreateDeviceToken, savePlayerId } from "@/lib/deviceIdentity";
import { trackRecentGame } from "@/lib/recentGames";
import { randomizeTurnOrder } from "@/lib/turnOrder";
import { PLAYER_COLORS } from "@/lib/playerColors";
import { findIdentityConflict } from "@/lib/playerValidation";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/database";

const DEFAULT_PENALTY_TYPES = [
  { id: "water_hazard", name: "Water Hazard (Klogang)", points: 10, icon: "🚽" },
  { id: "spill", name: "Getränk umschütten", points: 5, icon: "💧" },
  { id: "vomit", name: "Kotzen", points: 20, icon: "🤮" },
];

const DEFAULT_SETTINGS: GameSettings = {
  scoringTable: computeDefaultScoringTable(),
  defaultDrink: "",
  penaltyTypes: DEFAULT_PENALTY_TYPES,
  showFinalPresentation: true,
  showLiveLeaderboard: true,
  hideLeaderboardFinalRound: false,
};

export default function CreateGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [gameName, setGameName] = useState("");
  const [identity, setIdentity] = useState<PlayerIdentity>({
    name: "",
    color: PLAYER_COLORS[0],
    avatarEmoji: null,
  });
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState<PlayerIdentity>({
    name: "",
    color: PLAYER_COLORS[1],
    avatarEmoji: null,
  });
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    const channel = supabase
      .channel(`create-players:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            setPlayers((prev) => prev.filter((p) => p.id !== oldId));
            return;
          }
          const row = payload.new as Player;
          setPlayers((prev) => {
            const idx = prev.findIndex((p) => p.id === row.id);
            const next = idx === -1 ? [...prev, row] : prev.map((p, i) => (i === idx ? row : p));
            return next.sort((a, b) => a.turn_order - b.turn_order);
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!identity.name.trim()) {
      toast.error("Bitte gib deinen Namen ein.");
      return;
    }
    setCreating(true);
    try {
      if (gameId && code) {
        // Coming back from a later step — update the existing game/host
        // player instead of creating a duplicate.
        const hostConflict = findIdentityConflict(
          identity,
          players,
          players.find((p) => p.is_host)?.id
        );
        if (hostConflict) {
          toast.error(hostConflict);
          setCreating(false);
          return;
        }

        const { error: gameUpdateError } = await supabase
          .from("games")
          .update({ name: gameName.trim() || null })
          .eq("id", gameId);
        if (gameUpdateError) throw gameUpdateError;

        const hostPlayer = players.find((p) => p.is_host);
        if (hostPlayer) {
          const { error: hostUpdateError } = await supabase
            .from("players")
            .update({
              name: identity.name.trim(),
              color: identity.color,
              avatar_emoji: identity.avatarEmoji,
            })
            .eq("id", hostPlayer.id);
          if (hostUpdateError) throw hostUpdateError;
        }
        setStep(2);
        return;
      }

      const newCode = await generateUniqueGameCode();

      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          code: newCode,
          name: gameName.trim() || null,
          status: "lobby",
          scoring_table: DEFAULT_SETTINGS.scoringTable,
          current_round_number: 0,
          penalty_types: DEFAULT_SETTINGS.penaltyTypes,
        })
        .select()
        .single();
      if (gameError || !game) throw gameError;

      const deviceToken = getOrCreateDeviceToken(newCode);
      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
          game_id: game.id,
          device_token: deviceToken,
          name: identity.name.trim(),
          color: identity.color,
          avatar_emoji: identity.avatarEmoji,
          turn_order: 0,
          is_host: true,
        })
        .select()
        .single();
      if (playerError || !player) throw playerError;

      savePlayerId(newCode, player.id);
      trackRecentGame(newCode, gameName.trim() || null);
      setCode(newCode);
      setGameId(game.id);
      setPlayers([player]);
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Spiel konnte nicht erstellt werden. Versuch's nochmal.");
    } finally {
      setCreating(false);
    }
  }

  async function addPlayer() {
    if (!gameId || !newPlayer.name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    const conflict = findIdentityConflict(newPlayer, players);
    if (conflict) {
      toast.error(conflict);
      return;
    }
    setAddingPlayer(true);
    const { error } = await supabase.from("players").insert({
      game_id: gameId,
      device_token: crypto.randomUUID(),
      name: newPlayer.name.trim(),
      color: newPlayer.color,
      avatar_emoji: newPlayer.avatarEmoji,
      turn_order: players.length,
      is_host: false,
    });
    setAddingPlayer(false);
    if (error) {
      console.error(error);
      toast.error("Spieler konnte nicht hinzugefügt werden.");
      return;
    }
    setNewPlayer({
      name: "",
      color: PLAYER_COLORS[(players.length + 1) % PLAYER_COLORS.length],
      avatarEmoji: null,
    });
    setShowAddPlayer(false);
  }

  async function handleSettingsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gameId || !code) return;
    if (players.length < 2) {
      toast.error("Mindestens 2 Spieler nötig, um zu starten.");
      return;
    }
    setSavingSettings(true);
    try {
      const { error: settingsError } = await supabase
        .from("games")
        .update({
          scoring_table: settings.scoringTable,
          default_drink: settings.defaultDrink.trim() || null,
          penalty_types: settings.penaltyTypes,
          show_final_presentation: settings.showFinalPresentation,
          show_live_leaderboard: settings.showLiveLeaderboard,
          hide_leaderboard_final_round: settings.hideLeaderboardFinalRound,
        })
        .eq("id", gameId);
      if (settingsError) throw settingsError;

      const shuffledPlayers = await randomizeTurnOrder(players);
      const firstPlayer = shuffledPlayers[0];
      const { error: roundError } = await supabase.from("rounds").insert({
        game_id: gameId,
        round_number: 1,
        active_player_id: firstPlayer.id,
        status: "setup",
      });
      if (roundError) throw roundError;

      const { error: startError } = await supabase
        .from("games")
        .update({
          status: "in_progress",
          current_round_number: 1,
          started_at: new Date().toISOString(),
        })
        .eq("id", gameId);
      if (startError) throw startError;

      router.push(`/game/${code}`);
    } catch (err) {
      console.error(err);
      toast.error("Spiel konnte nicht gestartet werden.");
    } finally {
      setSavingSettings(false);
    }
  }

  if (step === 1) {
    return (
      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <form onSubmit={handleStep1Submit} className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Zurück
            </button>
            <div className="space-y-1 text-center">
              <h1 className="font-heading text-3xl font-bold">Neues Spiel</h1>
              <p className="text-sm text-muted-foreground">
                Du bist der Host und steuerst die ganze Runde.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="game-name">Spielname (optional)</Label>
            <Input
              id="game-name"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="z.B. Junggesellenabschied Basti"
              maxLength={40}
            />
          </div>

          <PlayerIdentityForm value={identity} onChange={setIdentity} />

          <Button
            type="submit"
            size="lg"
            className="w-full text-base"
            disabled={creating}
          >
            {creating ? "Erstelle Spiel…" : "Weiter zu den Spielern"}
          </Button>
        </form>
      </main>
    );
  }

  if (step === 2) {
    return (
      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Zurück
            </button>
            <h1 className="font-heading text-3xl font-bold">Spieler</h1>
            <p className="text-sm text-muted-foreground">
              Teile den Code, damit andere direkt beitreten — oder trag sie
              selbst ein.
            </p>
          </div>

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

          <div className="space-y-2">
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
              <div className="space-y-4">
                <PlayerIdentityForm value={newPlayer} onChange={setNewPlayer} />
                <Button
                  type="button"
                  className="w-full text-base"
                  onClick={addPlayer}
                  disabled={addingPlayer}
                >
                  {addingPlayer ? "Füge hinzu…" : "Spieler hinzufügen"}
                </Button>
              </div>
            )}
          </div>

          {code && <GameCodeBadge code={code} gameName={gameName} />}

          <Button
            type="button"
            size="lg"
            className="w-full text-base"
            onClick={() => setStep(3)}
          >
            Weiter zu den Einstellungen
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <form onSubmit={handleSettingsSubmit} className="w-full max-w-md space-y-6">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setStep(2)}
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
          type="submit"
          size="lg"
          className="w-full text-base"
          disabled={savingSettings}
        >
          {savingSettings ? "Starte Spiel…" : "Spiel starten"}
        </Button>
      </form>
    </main>
  );
}
