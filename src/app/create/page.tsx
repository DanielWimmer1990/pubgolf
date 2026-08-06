"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlayerIdentityForm,
  type PlayerIdentity,
} from "@/components/game/PlayerIdentityForm";
import {
  GameSettingsForm,
  type GameSettings,
} from "@/components/game/GameSettingsForm";
import { supabase } from "@/lib/supabase";
import { generateUniqueGameCode } from "@/lib/gameCode";
import { computeDefaultScoringTable } from "@/lib/scoring";
import { getOrCreateDeviceToken, savePlayerId } from "@/lib/deviceIdentity";
import { PLAYER_COLORS } from "@/lib/playerColors";

const DEFAULT_SETTINGS: GameSettings = {
  scoringTable: computeDefaultScoringTable(),
  defaultDrink: "",
  defaultRulePoints: -2,
  defaultMinigamePointsWinner: 1,
  defaultMinigamePointsLoser: -1,
  headerImageUrl: null,
  showFinalPresentation: true,
  showLiveLeaderboard: true,
  hideLeaderboardFinalRound: false,
};

export default function CreateGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [gameName, setGameName] = useState("");
  const [identity, setIdentity] = useState<PlayerIdentity>({
    name: "",
    color: PLAYER_COLORS[0],
    avatarEmoji: null,
  });
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [submitting, setSubmitting] = useState(false);

  function goToSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!identity.name.trim()) {
      toast.error("Bitte gib deinen Namen ein.");
      return;
    }
    setStep(2);
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
          default_rule_points: settings.defaultRulePoints,
          default_minigame_points_winner: settings.defaultMinigamePointsWinner,
          default_minigame_points_loser: settings.defaultMinigamePointsLoser,
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
        <form onSubmit={goToSettings} className="w-full max-w-sm space-y-6">
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
            Weiter zu den Einstellungen
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setStep(1)}
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
