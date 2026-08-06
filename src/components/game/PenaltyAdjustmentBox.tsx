"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Round } from "@/types/database";

type PendingEntry = {
  id: string;
  playerId: string;
  playerName: string;
  label: string;
  icon: string;
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

  function countFor(playerId: string, label: string) {
    const saved = savedForRound.filter(
      (pa) => pa.player_id === playerId && pa.label === label
    ).length;
    const queued = pending.filter(
      (p) => p.playerId === playerId && p.label === label
    ).length;
    return saved + queued;
  }

  function addPending(
    playerId: string,
    playerName: string,
    label: string,
    icon: string,
    points: number
  ) {
    setPending((prev) => [
      ...prev,
      { id: crypto.randomUUID(), playerId, playerName, label, icon, points },
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
    <div className="w-full max-w-sm space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <p className="text-sm font-medium text-muted-foreground">
        Strafpunkte eintragen
      </p>

      <ul className="space-y-4">
        {game.penalty_types.map((penalty) => (
          <li key={penalty.id} className="space-y-2">
            <p className="text-sm font-medium">
              <span className="mr-1.5 text-base">{penalty.icon ?? "⚠️"}</span>
              {penalty.name}{" "}
              <span className="text-muted-foreground">
                ({penalty.points > 0 ? "+" : ""}
                {penalty.points})
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => {
                const count = countFor(player.id, penalty.name);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() =>
                      addPending(
                        player.id,
                        player.name,
                        penalty.name,
                        penalty.icon ?? "⚠️",
                        penalty.points
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm hover:border-primary/50 hover:bg-primary/10",
                      count > 0
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-white/15"
                    )}
                  >
                    {player.name}
                    {count > 0 && ` ×${count}`}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {pending.length > 0 && (
        <div className="space-y-1.5 border-t border-white/10 pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Neu ausgewählt
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pending.map((tag) => (
              <span
                key={tag.id}
                className="flex items-center gap-1 rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
              >
                {tag.icon} {tag.playerName}: {tag.label}
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
        </div>
      )}

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
