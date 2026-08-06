"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlayerIdentityForm,
  type PlayerIdentity,
} from "@/components/game/PlayerIdentityForm";
import { ScoringTableEditor } from "@/components/game/ScoringTableEditor";
import { supabase } from "@/lib/supabase";
import { generateUniqueGameCode } from "@/lib/gameCode";
import { computeDefaultScoringTable } from "@/lib/scoring";
import { getOrCreateDeviceToken, savePlayerId } from "@/lib/deviceIdentity";
import { PLAYER_COLORS } from "@/lib/playerColors";

export default function CreateGamePage() {
  const router = useRouter();
  const [gameName, setGameName] = useState("");
  const [identity, setIdentity] = useState<PlayerIdentity>({
    name: "",
    color: PLAYER_COLORS[0],
    avatarEmoji: null,
  });
  const [scoringTable, setScoringTable] = useState(computeDefaultScoringTable());
  const [showScoring, setShowScoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identity.name.trim()) {
      toast.error("Bitte gib deinen Namen ein.");
      return;
    }

    setSubmitting(true);
    try {
      const code = await generateUniqueGameCode();

      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          code,
          name: gameName.trim() || null,
          status: "lobby",
          scoring_table: scoringTable,
          current_round_number: 0,
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

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
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

        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-0 text-muted-foreground"
            onClick={() => setShowScoring((v) => !v)}
          >
            {showScoring ? "Punkte-Regeln ausblenden" : "Punkte-Regeln anpassen"}
          </Button>
          {showScoring && (
            <ScoringTableEditor
              value={scoringTable}
              onChange={setScoringTable}
            />
          )}
        </div>

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
