"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ScrollText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Round } from "@/types/database";

type PendingEntry = {
  id: string;
  ruleId: string;
  ruleText: string;
  playerId: string;
  playerName: string;
  points: number;
};

export function RuleViolationBox({ round }: { round: Round }) {
  const { rules, ruleViolations, players, myPlayer } = useGame();
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [saving, setSaving] = useState(false);

  if (rules.length === 0) return null;

  const savedForRound = ruleViolations.filter(
    (rv) => rv.round_id === round.id
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

  function addPending(
    ruleId: string,
    ruleText: string,
    playerId: string,
    playerName: string,
    points: number
  ) {
    setPending((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ruleId, ruleText, playerId, playerName, points },
    ]);
  }

  function removePending(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
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
                {rule.violation_points})
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => {
                const count = countFor(rule.id, player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() =>
                      addPending(
                        rule.id,
                        rule.text,
                        player.id,
                        player.name,
                        rule.violation_points
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
                {tag.playerName}: {tag.ruleText}
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
