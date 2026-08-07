"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Round } from "@/types/database";

export function ExtraPointsBox({ round }: { round: Round }) {
  const { players, myPlayer } = useGame();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [points, setPoints] = useState(2);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!myPlayer || !playerId || !label.trim()) {
      toast.error("Bitte Spieler und Beschreibung angeben.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("point_adjustments").insert({
      game_id: round.game_id,
      round_id: round.id,
      player_id: playerId,
      label: label.trim(),
      points,
      created_by_player_id: myPlayer.id,
    });
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Extrapunkte konnten nicht gespeichert werden.");
      return;
    }
    toast.success("Extrapunkte eingetragen!");
    setLabel("");
    setPoints(2);
    setPlayerId(null);
  }

  return (
    <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Extrapunkte
        </p>
        <p className="text-xs text-muted-foreground">
          Für alles, was sonst nirgends reinpasst — frei mit Gut- oder
          Strafpunkten eintragbar.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {players.map((player) => (
          <button
            key={player.id}
            type="button"
            onClick={() => setPlayerId(player.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm hover:border-primary/50 hover:bg-primary/10",
              playerId === player.id
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-white/15"
            )}
          >
            {player.name}
          </button>
        ))}
      </div>

      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="z.B. Handy verloren"
        maxLength={60}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Punkte</span>
        <NumberInput
          value={points}
          onChange={setPoints}
          className="w-20 text-center"
        />
      </div>

      <Button
        className="w-full"
        onClick={submit}
        disabled={saving || !playerId || !label.trim()}
      >
        {saving ? "Speichere…" : "Eintragen"}
      </Button>
    </div>
  );
}
