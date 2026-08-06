"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Dices, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DiceRoller } from "@/components/game/DiceRoller";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";

export function RoundSetup() {
  const { game, currentRound, activePlayer, players, rounds } = useGame();
  const [barName, setBarName] = useState("");
  const [drinkDescription, setDrinkDescription] = useState(
    () => game?.default_drink ?? ""
  );
  const [par, setPar] = useState<number | null>(null);
  const [ruleText, setRuleText] = useState("");
  const [rulePoints, setRulePoints] = useState(
    () => game?.default_rule_points ?? -2
  );
  const [minigameEnabled, setMinigameEnabled] = useState(false);
  const [minigameName, setMinigameName] = useState("");
  const [minigamePointsWinner, setMinigamePointsWinner] = useState(
    () => game?.default_minigame_points_winner ?? 1
  );
  const [minigamePointsLoser, setMinigamePointsLoser] = useState(
    () => game?.default_minigame_points_loser ?? -1
  );
  const [submitting, setSubmitting] = useState(false);
  const [goingBack, setGoingBack] = useState(false);

  if (!currentRound || !game) return null;

  const canStart = !!par && barName.trim().length > 0 && ruleText.trim().length > 0;
  const previousRound = rounds.find(
    (r) => r.round_number === currentRound.round_number - 1
  );

  async function startRound() {
    if (!canStart || !currentRound) return;
    setSubmitting(true);
    try {
      const { error: ruleError, data: rule } = await supabase
        .from("rules")
        .insert({
          game_id: currentRound.game_id,
          round_id: currentRound.id,
          created_by_player_id: currentRound.active_player_id,
          text: ruleText.trim(),
          violation_points: rulePoints,
        })
        .select()
        .single();
      if (ruleError || !rule) throw ruleError;

      const isFinalRound =
        game!.hide_leaderboard_final_round &&
        currentRound.round_number >= players.length;

      const { error: roundError } = await supabase
        .from("rounds")
        .update({
          bar_name: barName.trim(),
          drink_description: drinkDescription.trim() || null,
          par,
          status: "active",
          minigame_name: minigameEnabled ? minigameName.trim() || null : null,
          minigame_points_winner: minigameEnabled ? minigamePointsWinner : null,
          minigame_points_loser: minigameEnabled ? minigamePointsLoser : null,
          is_final_round: isFinalRound,
        })
        .eq("id", currentRound.id);
      if (roundError) throw roundError;
    } catch (err) {
      console.error(err);
      toast.error("Runde konnte nicht gestartet werden.");
      setSubmitting(false);
    }
  }

  async function goBack() {
    if (!previousRound || !currentRound) return;
    if (
      !window.confirm(
        `Zurück zu Runde ${previousRound.round_number}? Die aktuelle Runde geht dabei verloren.`
      )
    ) {
      return;
    }
    setGoingBack(true);
    try {
      const { error: roundError } = await supabase
        .from("rounds")
        .update({ status: "active" })
        .eq("id", previousRound.id);
      if (roundError) throw roundError;

      const { error: deleteError } = await supabase
        .from("rounds")
        .delete()
        .eq("id", currentRound.id);
      if (deleteError) throw deleteError;

      const { error: gameError } = await supabase
        .from("games")
        .update({ current_round_number: previousRound.round_number })
        .eq("id", game!.id);
      if (gameError) throw gameError;
    } catch (err) {
      console.error(err);
      toast.error("Konnte nicht zurückgehen.");
      setGoingBack(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        {previousRound && (
          <button
            type="button"
            onClick={goBack}
            disabled={goingBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zu Runde {previousRound.round_number}
          </button>
        )}
        <div className="text-center space-y-1">
          <h2 className="font-heading text-2xl font-bold">
            Runde {currentRound.round_number}
          </h2>
          <p className="text-sm text-muted-foreground">
            {activePlayer
              ? `${activePlayer.name} ist an der Reihe — trag ein, was sie/er wählt`
              : "Bereite die Runde vor"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bar-name">Bar</Label>
        <Input
          id="bar-name"
          value={barName}
          onChange={(e) => setBarName(e.target.value)}
          placeholder="z.B. Zur Krone"
          maxLength={40}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="drink-description">Getränk (optional)</Label>
        <Input
          id="drink-description"
          value={drinkDescription}
          onChange={(e) => setDrinkDescription(e.target.value)}
          placeholder="z.B. kleines Bier"
          maxLength={40}
        />
      </div>

      <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-white/5 py-5 backdrop-blur-xl">
        <Label>PAR für diese Runde</Label>
        <DiceRoller value={par} onRoll={setPar} />
      </div>

      <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <Label htmlFor="rule-text" className="flex items-center gap-1.5">
          <ScrollText className="h-4 w-4 text-primary" />
          Neue Regel für den Rest des Spiels
        </Label>
        <Textarea
          id="rule-text"
          value={ruleText}
          onChange={(e) => setRuleText(e.target.value)}
          placeholder="z.B. Kein Ja und Nein mehr sagen"
          maxLength={140}
        />
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="rule-points" className="text-sm text-muted-foreground">
            Punkte bei Regelbruch
          </Label>
          <Input
            id="rule-points"
            type="number"
            value={rulePoints}
            onChange={(e) => setRulePoints(Number(e.target.value))}
            className="w-20 text-center"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <Label htmlFor="minigame-toggle" className="flex items-center gap-1.5">
            <Dices className="h-4 w-4 text-primary" />
            Minispiel ausrufen
          </Label>
          <Switch
            id="minigame-toggle"
            checked={minigameEnabled}
            onCheckedChange={setMinigameEnabled}
          />
        </div>
        {minigameEnabled && (
          <div className="space-y-3">
            <Input
              value={minigameName}
              onChange={(e) => setMinigameName(e.target.value)}
              placeholder="z.B. Schere Stein Papier"
              maxLength={60}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Punkte Gewinner
                </Label>
                <Input
                  type="number"
                  value={minigamePointsWinner}
                  onChange={(e) =>
                    setMinigamePointsWinner(Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Punkte Verlierer
                </Label>
                <Input
                  type="number"
                  value={minigamePointsLoser}
                  onChange={(e) =>
                    setMinigamePointsLoser(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Button
        size="lg"
        className="w-full text-base"
        onClick={startRound}
        disabled={!canStart || submitting}
      >
        {submitting ? "Starte Runde…" : "Runde starten"}
      </Button>
    </div>
  );
}
