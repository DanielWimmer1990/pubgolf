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
import { PLAYER_COLORS } from "@/lib/playerColors";
import { findIdentityConflict } from "@/lib/playerValidation";

/** Host-typed roster entry: adds a player who isn't registering themselves
 * (e.g. no phone in hand). They never get their own device identity for
 * this game, so they stay a pure spectator on any device. */
export function HostAddPlayerForm({ onDone }: { onDone?: () => void }) {
  const { game, players } = useGame();
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
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    const conflict = findIdentityConflict(identity, players);
    if (conflict) {
      toast.error(conflict);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("players").insert({
      game_id: game.id,
      device_token: crypto.randomUUID(),
      name: identity.name.trim(),
      color: identity.color,
      avatar_emoji: identity.avatarEmoji,
      turn_order: players.length,
      is_host: false,
    });
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error("Spieler konnte nicht hinzugefügt werden.");
      return;
    }
    setIdentity({
      name: "",
      color:
        PLAYER_COLORS[(players.length + 1) % PLAYER_COLORS.length] ??
        PLAYER_COLORS[0],
      avatarEmoji: null,
    });
    onDone?.();
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
        {submitting ? "Füge hinzu…" : "Spieler hinzufügen"}
      </Button>
    </form>
  );
}
