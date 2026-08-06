"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PlayerIdentityForm,
  type PlayerIdentity,
} from "@/components/game/PlayerIdentityForm";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { findIdentityConflict } from "@/lib/playerValidation";
import type { Player } from "@/types/database";

function EditPlayerForm({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const { players } = useGame();
  const [identity, setIdentity] = useState<PlayerIdentity>({
    name: player.name,
    color: player.color,
    avatarEmoji: player.avatar_emoji,
  });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function save() {
    if (!identity.name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    const conflict = findIdentityConflict(identity, players, player.id);
    if (conflict) {
      toast.error(conflict);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("players")
      .update({
        name: identity.name.trim(),
        color: identity.color,
        avatar_emoji: identity.avatarEmoji,
      })
      .eq("id", player.id);
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Konnte nicht gespeichert werden.");
      return;
    }
    onClose();
  }

  async function remove() {
    if (!window.confirm(`${player.name} wirklich aus dem Spiel entfernen?`)) {
      return;
    }
    setRemoving(true);
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", player.id);
    setRemoving(false);
    if (error) {
      console.error(error);
      toast.error("Konnte nicht entfernt werden.");
      return;
    }
    onClose();
  }

  return (
    <>
      <PlayerIdentityForm value={identity} onChange={setIdentity} />

      <DialogFooter className="flex-col gap-2 sm:flex-col">
        <Button className="w-full" onClick={save} disabled={saving || removing}>
          {saving ? "Speichere…" : "Speichern"}
        </Button>
        {!player.is_host && (
          <Button
            type="button"
            variant="ghost"
            className="w-full text-red-400 hover:text-red-400"
            onClick={remove}
            disabled={saving || removing}
          >
            {removing ? "Entferne…" : "Spieler entfernen"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function EditPlayerDialog({
  player,
  onClose,
}: {
  player: Player | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spieler bearbeiten</DialogTitle>
        </DialogHeader>
        {player && (
          <EditPlayerForm key={player.id} player={player} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
