"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlayerIdentityForm,
  type PlayerIdentity,
} from "@/components/game/PlayerIdentityForm";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import {
  GameSettingsForm,
  type GameSettings,
} from "@/components/game/GameSettingsForm";
import { supabase } from "@/lib/supabase";
import { generateUniqueGameCode } from "@/lib/gameCode";
import { computeDefaultScoringTable } from "@/lib/scoring";
import { getOrCreateDeviceToken, savePlayerId } from "@/lib/deviceIdentity";
import { PLAYER_COLORS } from "@/lib/playerColors";
import { cn } from "@/lib/utils";

type DraftPlayer = {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string | null;
};

const DEFAULT_SETTINGS: GameSettings = {
  scoringTable: computeDefaultScoringTable(),
  defaultDrink: "",
  penaltyTypes: [
    { id: "water_hazard", name: "Water Hazard (Klogang)", points: 10 },
    { id: "spill", name: "Getränk umschütten", points: 5 },
    { id: "vomit", name: "Kotzen", points: 20 },
  ],
  headerImageUrl: null,
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
  const [draftPlayers, setDraftPlayers] = useState<DraftPlayer[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState<PlayerIdentity>({
    name: "",
    color: PLAYER_COLORS[1],
    avatarEmoji: null,
  });
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [submitting, setSubmitting] = useState(false);

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!identity.name.trim()) {
      toast.error("Bitte gib deinen Namen ein.");
      return;
    }
    setStep(2);
  }

  function addDraftPlayer() {
    if (!newPlayer.name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    setDraftPlayers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newPlayer.name.trim(),
        color: newPlayer.color,
        avatarEmoji: newPlayer.avatarEmoji,
      },
    ]);
    const nextColor =
      PLAYER_COLORS[(draftPlayers.length + 2) % PLAYER_COLORS.length];
    setNewPlayer({ name: "", color: nextColor, avatarEmoji: null });
    setShowAddPlayer(false);
  }

  function removeDraftPlayer(id: string) {
    setDraftPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const code = await generateUniqueGameCode();

      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          code,
          name: gameName.trim() || null,
          status: "lobby",
          scoring_table: settings.scoringTable,
          current_round_number: 0,
          header_image_url: settings.headerImageUrl,
          default_drink: settings.defaultDrink.trim() || null,
          penalty_types: settings.penaltyTypes,
          show_final_presentation: settings.showFinalPresentation,
          show_live_leaderboard: settings.showLiveLeaderboard,
          hide_leaderboard_final_round: settings.hideLeaderboardFinalRound,
        })
        .select()
        .single();

      if (gameError || !game) throw gameError;

      const deviceToken = getOrCreateDeviceToken(code);
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

      if (draftPlayers.length > 0) {
        const { error: draftError } = await supabase.from("players").insert(
          draftPlayers.map((p, index) => ({
            game_id: game.id,
            device_token: crypto.randomUUID(),
            name: p.name,
            color: p.color,
            avatar_emoji: p.avatarEmoji,
            turn_order: index + 1,
            is_host: false,
          }))
        );
        if (draftError) throw draftError;
      }

      savePlayerId(code, player.id);
      router.push(`/game/${code}`);
    } catch (err) {
      console.error(err);
      toast.error("Spiel konnte nicht erstellt werden. Versuch's nochmal.");
      setSubmitting(false);
    }
  }

  if (step === 1) {
    return (
      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <form onSubmit={goToStep2} className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="font-heading text-3xl font-bold">Neues Spiel</h1>
            <p className="text-sm text-muted-foreground">
              Du bist der Host und steuerst die ganze Runde.
            </p>
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

          <Button type="submit" size="lg" className="w-full text-base">
            Weiter zu den Spielern
          </Button>
        </form>
      </main>
    );
  }

  if (step === 2) {
    return (
      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
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
              Trag ein, wer schon feststeht. Weitere können später per
              Code/QR selbst beitreten oder vom Host ergänzt werden.
            </p>
          </div>

          <ul className="space-y-2">
            <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-xl">
              <PlayerAvatar
                name={identity.name || "?"}
                color={identity.color}
                avatarEmoji={identity.avatarEmoji}
                size="sm"
              />
              <span className="font-medium">{identity.name}</span>
              <span className="ml-auto text-xs font-medium text-primary">
                Host
              </span>
            </li>
            {draftPlayers.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-xl"
              >
                <PlayerAvatar
                  name={p.name}
                  color={p.color}
                  avatarEmoji={p.avatarEmoji}
                  size="sm"
                />
                <span className="font-medium">{p.name}</span>
                <button
                  type="button"
                  onClick={() => removeDraftPlayer(p.id)}
                  aria-label={`${p.name} entfernen`}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
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
                  onClick={addDraftPlayer}
                >
                  Zur Liste hinzufügen
                </Button>
              </div>
            )}
          </div>

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
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
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
          <p className="text-sm text-muted-foreground">
            Kannst du später nicht mehr ändern — leg sie jetzt fest.
          </p>
        </div>

        <GameSettingsForm value={settings} onChange={setSettings} />

        <Button
          type="submit"
          size="lg"
          className="w-full text-base"
          disabled={submitting}
        >
          {submitting ? "Erstelle Spiel…" : "Spiel erstellen"}
        </Button>
      </form>
    </main>
  );
}
