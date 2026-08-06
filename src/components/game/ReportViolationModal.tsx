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
  const [violatorId, setViolatorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!rule || !violatorId || !myPlayer) return;
    setSubmitting(true);
    const { error } = await supabase.from("rule_violations").insert({
      game_id: rule.game_id,
      rule_id: rule.id,
      round_id: currentRound?.id ?? null,
      violator_player_id: violatorId,
      reported_by_player_id: myPlayer.id,
      points_applied: rule.violation_points,
    });
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error("Meldung konnte nicht gespeichert werden.");
      return;
    }
    toast.success("Regelbruch gemeldet!");
    setViolatorId(null);
    onClose();
  }

  return (
    <Dialog
      open={!!rule}
      onOpenChange={(open) => {
        if (!open) {
          setViolatorId(null);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regelbruch melden</DialogTitle>
          <DialogDescription>{rule?.text}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Wer hat die Regel gebrochen?</p>
          <div className="grid grid-cols-3 gap-2">
            {players.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => setViolatorId(player.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs",
                  violatorId === player.id && "border-foreground"
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
            disabled={!violatorId || submitting}
          >
            {submitting
              ? "Melde…"
              : `Melden (${rule && rule.violation_points > 0 ? "+" : ""}${
                  rule?.violation_points ?? 0
                } Punkte)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
