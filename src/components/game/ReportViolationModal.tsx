"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Rule } from "@/types/database";

export function ReportViolationModal({
  rule,
  onClose,
}: {
  rule: Rule | null;
  onClose: () => void;
}) {
  const { players, myPlayer, currentRound } = useGame();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  function toggle(playerId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  async function submit() {
    if (!rule || selectedIds.size === 0 || !myPlayer) return;
    setSubmitting(true);
    const { error } = await supabase.from("rule_violations").insert(
      [...selectedIds].map((playerId) => ({
        game_id: rule.game_id,
        rule_id: rule.id,
        round_id: currentRound?.id ?? null,
        violator_player_id: playerId,
        reported_by_player_id: myPlayer.id,
        points_applied: rule.violation_points,
      }))
    );
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error("Eintrag konnte nicht gespeichert werden.");
      return;
    }
    toast.success("Regelbruch eingetragen!");
    setSelectedIds(new Set());
    onClose();
  }

  return (
    <Dialog
      open={!!rule}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedIds(new Set());
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regelbruch eintragen</DialogTitle>
          <DialogDescription>{rule?.text}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Wer hat die Regel gebrochen? (Mehrfachauswahl möglich)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {players.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => toggle(player.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs",
                  selectedIds.has(player.id) && "border-foreground"
                )}
              >
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  avatarEmoji={player.avatar_emoji}
                  size="sm"
                />
                <span className="truncate max-w-full">{player.name}</span>
              </button>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={submit}
            disabled={selectedIds.size === 0 || submitting}
          >
            {submitting
              ? "Trage ein…"
              : `Eintragen${
                  selectedIds.size > 0 ? ` (${selectedIds.size})` : ""
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
