"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Minus } from "lucide-react";
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
  // Player -> how many times they broke this rule right now. Tapping a
  // player again adds another entry instead of just toggling one on/off.
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [submitting, setSubmitting] = useState(false);

  const totalCount = [...counts.values()].reduce((sum, n) => sum + n, 0);

  function increment(playerId: string) {
    setCounts((prev) => {
      const next = new Map(prev);
      next.set(playerId, (next.get(playerId) ?? 0) + 1);
      return next;
    });
  }

  function decrement(playerId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setCounts((prev) => {
      const next = new Map(prev);
      const current = next.get(playerId) ?? 0;
      if (current <= 1) next.delete(playerId);
      else next.set(playerId, current - 1);
      return next;
    });
  }

  async function submit() {
    if (!rule || totalCount === 0 || !myPlayer) return;
    setSubmitting(true);
    const rows = [...counts.entries()].flatMap(([playerId, count]) =>
      Array.from({ length: count }, () => ({
        game_id: rule.game_id,
        rule_id: rule.id,
        round_id: currentRound?.id ?? null,
        violator_player_id: playerId,
        reported_by_player_id: myPlayer.id,
        points_applied: rule.violation_points,
      }))
    );
    const { error } = await supabase.from("rule_violations").insert(rows);
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error("Eintrag konnte nicht gespeichert werden.");
      return;
    }
    toast.success("Regelbruch eingetragen!");
    setCounts(new Map());
    onClose();
  }

  return (
    <Dialog
      open={!!rule}
      onOpenChange={(open) => {
        if (!open) {
          setCounts(new Map());
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
            Wer hat die Regel gebrochen? Mehrfach antippen für mehrere
            Verstöße.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {players.map((player) => {
              const count = counts.get(player.id) ?? 0;
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => increment(player.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-lg border p-2 text-xs",
                    count > 0 && "border-foreground"
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
                      onClick={(e) => decrement(player.id, e)}
                      aria-label={`Einen Verstoß für ${player.name} entfernen`}
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-background text-muted-foreground hover:text-red-400"
                    >
                      <Minus className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            className="w-full"
            onClick={submit}
            disabled={totalCount === 0 || submitting}
          >
            {submitting
              ? "Trage ein…"
              : `Eintragen${totalCount > 0 ? ` (${totalCount})` : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
