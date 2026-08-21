"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  GameSettingsForm,
  type GameSettings,
} from "@/components/game/GameSettingsForm";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import type { Game } from "@/types/database";

function toSettings(game: Game): GameSettings {
  return {
    scoringTable: game.scoring_table,
    defaultDrink: game.default_drink ?? "",
    penaltyTypes: game.penalty_types,
    showFinalPresentation: game.show_final_presentation,
    showLiveLeaderboard: game.show_live_leaderboard,
    hideLeaderboardFinalRound: game.hide_leaderboard_final_round,
  };
}

export function GameSettingsDialog() {
  const { game } = useGame();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [saving, setSaving] = useState(false);

  if (!game) return null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setSettings(toSettings(game!));
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("games")
      .update({
        scoring_table: settings.scoringTable,
        default_drink: settings.defaultDrink.trim() || null,
        penalty_types: settings.penaltyTypes,
        show_final_presentation: settings.showFinalPresentation,
        show_live_leaderboard: settings.showLiveLeaderboard,
        hide_leaderboard_final_round: settings.hideLeaderboardFinalRound,
      })
      .eq("id", game!.id);
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Einstellungen konnten nicht gespeichert werden.");
      return;
    }
    toast.success("Einstellungen gespeichert!");
    setOpen(false);
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Spieleinstellungen"
          className="text-muted-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Spieleinstellungen</DrawerTitle>
          <DrawerDescription>
            Änderungen gelten ab sofort — bereits eingetragene Runden werden
            nicht rückwirkend neu berechnet.
          </DrawerDescription>
        </DrawerHeader>
        {settings && (
          <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
            <GameSettingsForm value={settings} onChange={setSettings} />
          </div>
        )}
        <DrawerFooter>
          <Button onClick={save} disabled={saving}>
            {saving ? "Speichere…" : "Speichern"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
