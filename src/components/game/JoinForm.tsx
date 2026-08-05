"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PlayerIdentityForm,
  type PlayerIdentity,
} from "@/components/game/PlayerIdentityForm";
import { supabase } from "@/lib/supabase";
import { getOrCreateDeviceToken, savePlayerId } from "@/lib/deviceIdentity";
import { PLAYER_COLORS } from "@/lib/playerColors";
import type { Game, Player } from "@/types/database";

export function JoinForm({
  code,
  game,
  players,
}: {
  code: string;
  game: Game;
  players: Player[];
}) {
  const [identity, setIdentity] = useState<PlayerIdentity>({
    name: "",
    color:
      PLAYER_COLORS[players.length % PLAYER_COLORS.length] ??
      PLAYER_COLORS[0],
    avatarEmoji: null,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identity.name.trim()) {
      toast.error("Bitte gib deinen Namen ein.");
      return;
    }

    setSubmitting(true);
    try {
      const deviceToken = getOrCreateDeviceToken(code);
      const { data: player, error } = await supabase
        .from("players")
        .insert({
          game_id: game.id,
          device_token: deviceToken,
          name: identity.name.trim(),
          color: identity.color,
          avatar_emoji: identity.avatarEmoji,
          turn_order: players.length,
          is_host: false,
        })
        .select()
        .single();

      if (error || !player) throw error;
      savePlayerId(code, player.id);
      // GameProvider's realtime subscription (or its own state) will pick up
      // the new player row and re-render into the game view automatically.
    } catch (err) {
      console.error(err);
      toast.error("Beitreten hat nicht geklappt. Versuch's nochmal.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">
            {game.name || "Pubgolf-Spiel"} beitreten
          </h1>
          <p className="text-sm text-muted-foreground">
            {players.length}{" "}
            {players.length === 1 ? "Spieler ist" : "Spieler sind"} schon
            dabei.
          </p>
        </div>

        <PlayerIdentityForm value={identity} onChange={setIdentity} />

        <Button
          type="submit"
          size="lg"
          className="w-full text-base"
          disabled={submitting}
        >
          {submitting ? "Trete bei…" : "Beitreten"}
        </Button>
      </form>
    </main>
  );
}
