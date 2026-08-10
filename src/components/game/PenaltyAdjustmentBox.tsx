"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { pointsKindLabel } from "@/lib/pointsLabel";
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
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  if (!game || game.penalty_types.length === 0) return null;

  // Excludes optimistically-removed rows immediately, rather than waiting
  // for the realtime DELETE event to round-trip back into pointAdjustments.
  const savedForRound = pointAdjustments.filter(
    (pa) => pa.round_id === round.id && !removedIds.has(pa.id)
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

  function increment(playerId: string, label: string, points: number) {
    setPending((prev) => [
      ...prev,
      { id: crypto.randomUUID(), playerId, label, points },
    ]);
  }

  async function decrement(playerId: string, label: string) {
    const lastPendingIdx = [...pending]
      .reverse()
      .findIndex((p) => p.playerId === playerId && p.label === label);
    if (lastPendingIdx !== -1) {
      const idx = pending.length - 1 - lastPendingIdx;
      setPending((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    const savedMatch = savedForRound
      .filter((pa) => pa.player_id === playerId && pa.label === label)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (!savedMatch) return;

    setRemovedIds((prev) => new Set(prev).add(savedMatch.id));
    setRemovingId(savedMatch.id);
    const { error } = await supabase
      .from("point_adjustments")
      .delete()
      .eq("id", savedMatch.id);
    setRemovingId(null);
    if (error) {
      console.error(error);
      toast.error("Konnte nicht entfernt werden.");
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(savedMatch.id);
        return next;
      });
    }
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
    <div className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
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
                {penalty.points}
                {pointsKindLabel(penalty.points) &&
                  ` ${pointsKindLabel(penalty.points)}`}
                )
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => {
                const count = countFor(player.id, penalty.name);
                return (
                  <div key={player.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        increment(player.id, penalty.name, penalty.points)
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
                    {count > 0 && (
                      <button
                        type="button"
                        onClick={() => decrement(player.id, penalty.name)}
                        disabled={removingId != null}
                        aria-label={`Einen Eintrag für ${player.name} entfernen`}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-muted-foreground hover:bg-white/10 hover:text-red-400 disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
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
