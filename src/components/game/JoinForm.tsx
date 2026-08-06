"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PlayerIdentityForm,
  type PlayerIdentity,
} from "@/components/game/PlayerIdentityForm";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { getOrCreateDeviceToken, savePlayerId } from "@/lib/deviceIdentity";
import { PLAYER_COLORS } from "@/lib/playerColors";
import { findIdentityConflict } from "@/lib/playerValidation";

/** Self-registration form: lets a visitor add themselves to the player
 * roster. Joining never grants any game controls — only the host can
 * operate the game once it starts. */
export function JoinForm({ onDone }: { onDone?: () => void }) {
  const { code, game, players } = useGame();
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
    if (!game) return;
    if (!identity.name.trim()) {
      toast.error("Bitte gib deinen Namen ein.");
      return;
    }
    const conflict = findIdentityConflict(identity, players);
    if (conflict) {
      toast.error(conflict);
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
      onDone?.();
    } catch (err) {
      console.error(err);
      toast.error("Beitreten hat nicht geklappt. Versuch's nochmal.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
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
  );
}
