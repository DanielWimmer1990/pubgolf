"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Settings, Share2, UserPlus } from "lucide-react";
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

export function toSettings(game: Game): GameSettings {
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
  const { code, game } = useGame();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [saving, setSaving] = useState(false);

  if (!game) return null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setSettings(toSettings(game!));
  }

  async function shareHostInvite() {
    const url = `${window.location.origin}/game/${code}?host=${game!.host_invite_token}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pubgolf — Co-Host",
          text: "Du bist jetzt Co-Host — du kannst die Runde mitsteuern.",
          url,
        });
        return;
      } catch {
        // user cancelled the share sheet — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Co-Host-Link kopiert!");
    } catch {
      toast.error("Konnte Link nicht kopieren.");
    }
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
          <div className="max-h-[60vh] space-y-6 overflow-y-auto px-4 pb-4">
            <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <UserPlus className="h-4 w-4 text-primary" />
                Zusätzliche Hosts einladen
              </p>
              <p className="text-xs text-muted-foreground">
                Wer diesen Link öffnet, wird ebenfalls Host und kann die
                Runde mitsteuern.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5 border-primary/40"
                onClick={shareHostInvite}
              >
                <Share2 className="h-3.5 w-3.5" />
                Co-Host-Link teilen
              </Button>
            </div>

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
