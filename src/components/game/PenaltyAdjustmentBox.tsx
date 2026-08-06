"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import type { Round } from "@/types/database";

type PendingEntry = {
  id: string;
  playerId: string;
  label: string;
  points: number;
};

export function PenaltyAdjustmentBox({ round }: { round: Round }) {
  const { game, players, pointAdjustments, myPlayer } = useGame();
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [saving, setSaving] = useState(false);

  if (!game || game.penalty_types.length === 0) return null;

  const savedForRound = pointAdjustments.filter(
    (pa) => pa.round_id === round.id
  );

  function addPending(playerId: string, label: string, points: number) {
    setPending((prev) => [
      ...prev,
      { id: crypto.randomUUID(), playerId, label, points },
    ]);
  }

  function removePending(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  async function save() {
    if (!myPlayer || pending.length === 0) return;
    setSaving(true);
    const { error } = await supabase.from("point_adjustments").insert(
      pending.map((p) => ({
        game_id: round.game_id,
        round_id: round.id,
        player_id: p.playerId,
        label: p.label,
        points: p.points,
        created_by_player_id: myPlayer.id,
      }))
    );
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Strafpunkte konnten nicht gespeichert werden.");
      return;
    }
    setPending([]);
    toast.success("Strafpunkte gespeichert!");
  }

  return (
    <div className="w-full max-w-sm space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <p className="text-sm font-medium text-muted-foreground">
        Strafpunkte eintragen
      </p>

      <ul className="space-y-3">
        {players.map((player) => {
          const savedTags = savedForRound.filter(
            (pa) => pa.player_id === player.id
          );
          const pendingTags = pending.filter(
            (p) => p.playerId === player.id
          );
          return (
            <li key={player.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  avatarEmoji={player.avatar_emoji}
                  size="sm"
                />
                <span className="flex-1 truncate text-sm font-medium">
                  {player.name}
                </span>
              </div>

              {(savedTags.length > 0 || pendingTags.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {savedTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {tag.label} {tag.points > 0 ? "+" : ""}
                      {tag.points}
                    </span>
                  ))}
                  {pendingTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                    >
                      {tag.label} {tag.points > 0 ? "+" : ""}
                      {tag.points}
                      <button
                        type="button"
                        onClick={() => removePending(tag.id)}
                        aria-label="Entfernen"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {game.penalty_types.map((penalty) => (
                  <button
                    key={penalty.id}
                    type="button"
                    onClick={() =>
                      addPending(player.id, penalty.name, penalty.points)
                    }
                    className="rounded-full border border-white/15 px-2.5 py-1 text-xs hover:border-primary/50 hover:bg-primary/10"
                  >
                    {penalty.name} ({penalty.points > 0 ? "+" : ""}
                    {penalty.points})
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <Button
        className="w-full"
        onClick={save}
        disabled={saving || pending.length === 0}
      >
        {saving
          ? "Speichere…"
          : pending.length > 0
          ? `Speichern (${pending.length})`
          : "Speichern"}
      </Button>
    </div>
  );
}
