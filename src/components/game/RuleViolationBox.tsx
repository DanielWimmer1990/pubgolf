"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Minus, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { pointsKindLabel } from "@/lib/pointsLabel";
import type { Round } from "@/types/database";

type PendingEntry = {
  id: string;
  ruleId: string;
  playerId: string;
  points: number;
};

export function RuleViolationBox({ round }: { round: Round }) {
  const { rules, ruleViolations, players, myPlayer } = useGame();
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Pending selections are local UI state and don't get cleared just
  // because the `round` prop changes underneath this mounted component —
  // without this, an unsaved selection from the previous round kept
  // showing as "queued" (orange) once the next round started.
  useEffect(() => {
    setPending([]);
    setRemovedIds(new Set());
    setRemovingId(null);
  }, [round.id]);

  if (rules.length === 0) return null;

  // Excludes optimistically-removed rows immediately, rather than waiting
  // for the realtime DELETE event to round-trip back into ruleViolations.
  const savedForRound = ruleViolations.filter(
    (rv) => rv.round_id === round.id && !removedIds.has(rv.id)
  );

  function countFor(ruleId: string, playerId: string) {
    const saved = savedForRound.filter(
      (rv) => rv.rule_id === ruleId && rv.violator_player_id === playerId
    ).length;
    const queued = pending.filter(
      (p) => p.ruleId === ruleId && p.playerId === playerId
    ).length;
    return saved + queued;
  }

  function increment(ruleId: string, playerId: string, points: number) {
    setPending((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ruleId, playerId, points },
    ]);
  }

  async function decrement(ruleId: string, playerId: string) {
    const lastPendingIdx = [...pending]
      .reverse()
      .findIndex((p) => p.ruleId === ruleId && p.playerId === playerId);
    if (lastPendingIdx !== -1) {
      const idx = pending.length - 1 - lastPendingIdx;
      setPending((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    const savedMatch = savedForRound
      .filter((rv) => rv.rule_id === ruleId && rv.violator_player_id === playerId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (!savedMatch) return;

    setRemovedIds((prev) => new Set(prev).add(savedMatch.id));
    setRemovingId(savedMatch.id);
    const { error } = await supabase
      .from("rule_violations")
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
    const { error } = await supabase.from("rule_violations").insert(
      pending.map((p) => ({
        game_id: round.game_id,
        rule_id: p.ruleId,
        round_id: round.id,
        violator_player_id: p.playerId,
        reported_by_player_id: myPlayer.id,
        points_applied: p.points,
      }))
    );
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Regelbruch konnte nicht gespeichert werden.");
      return;
    }
    setPending([]);
    toast.success("Regelbruch gespeichert!");
  }

  return (
    <div className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <ScrollText className="h-4 w-4 text-primary" />
        Regelbruch eintragen
      </p>

      <ul className="space-y-4">
        {rules.map((rule) => (
          <li key={rule.id} className="space-y-2">
            <p className="text-sm font-medium">
              {rule.text}{" "}
              <span className="text-muted-foreground">
                ({rule.violation_points > 0 ? "+" : ""}
                {rule.violation_points}
                {pointsKindLabel(rule.violation_points) &&
                  ` ${pointsKindLabel(rule.violation_points)}`}
                )
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {players.map((player) => {
                const count = countFor(rule.id, player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() =>
                      increment(rule.id, player.id, rule.violation_points)
                    }
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-lg border p-2 text-xs hover:border-primary/50",
                      count > 0
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-white/15"
                    )}
                  >
                    <PlayerAvatar
                      name={player.name}
                      color={player.color}
                      avatarEmoji={player.avatar_emoji}
                      size="sm"
                    />
                    <span className="truncate max-w-full">
                      {player.name}
                      {count > 0 && ` ×${count}`}
                    </span>
                    {count > 0 && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          decrement(rule.id, player.id);
                        }}
                        aria-label={`Einen Eintrag für ${player.name} entfernen`}
                        className={cn(
                          "absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-background text-muted-foreground hover:text-red-400",
                          removingId != null && "pointer-events-none opacity-50"
                        )}
                      >
                        <Minus className="h-3 w-3" />
                      </span>
                    )}
                  </button>
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
