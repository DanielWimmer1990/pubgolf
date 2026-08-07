"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Dices, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DiceRoller } from "@/components/game/DiceRoller";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import {
  getRecentRuleTexts,
  getRecentMinigameNames,
  trackRuleText,
  trackMinigameName,
} from "@/lib/roundHistory";

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
  const [recentRules, setRecentRules] = useState<string[]>([]);
  const [recentMinigames, setRecentMinigames] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setRecentRules(getRecentRuleTexts());
      setRecentMinigames(getRecentMinigameNames());
    });
  }, []);

  if (!currentRound || !game) return null;

  const canStart = !!par && barName.trim().length > 0 && ruleText.trim().length > 0;
  const missingForStart = [
    !par && "PAR würfeln",
    barName.trim().length === 0 && "Bar eintragen",
    ruleText.trim().length === 0 && "Regel eintragen",
  ].filter((v): v is string => !!v);
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

      trackRuleText(ruleText);
      if (minigameEnabled && minigameName.trim()) {
        trackMinigameName(minigameName);
      }
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
    <div className="w-full max-w-md space-y-6">
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
          {currentRound.round_number === players.length && (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              🏁 Letzte Runde
            </p>
          )}
          <h2 className="font-heading text-2xl font-bold">
            Runde {currentRound.round_number}
          </h2>
          {activePlayer && (
            <p className="font-heading text-lg text-muted-foreground">
              {activePlayer.name}&apos;s Bar
            </p>
          )}
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
        <Input
          id="rule-text"
          list="rule-suggestions"
          value={ruleText}
          onChange={(e) => setRuleText(e.target.value)}
          placeholder="z.B. Kein Ja und Nein mehr sagen"
          maxLength={140}
        />
        {recentRules.length > 0 && (
          <datalist id="rule-suggestions">
            {recentRules.map((text) => (
              <option key={text} value={text} />
            ))}
          </datalist>
        )}
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="rule-points" className="text-sm text-muted-foreground">
            Punkte bei Regelbruch
          </Label>
          <NumberInput
            id="rule-points"
            value={rulePoints}
            onChange={setRulePoints}
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
              list="minigame-suggestions"
              value={minigameName}
              onChange={(e) => setMinigameName(e.target.value)}
              placeholder="z.B. Schere Stein Papier"
              maxLength={60}
            />
            {recentMinigames.length > 0 && (
              <datalist id="minigame-suggestions">
                {recentMinigames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Punkte Gewinner
                </Label>
                <NumberInput
                  value={minigamePointsWinner}
                  onChange={setMinigamePointsWinner}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Punkte Verlierer
                </Label>
                <NumberInput
                  value={minigamePointsLoser}
                  onChange={setMinigamePointsLoser}
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
      {!canStart && (
        <p className="text-center text-xs text-muted-foreground">
          Es fehlt noch: {missingForStart.join(", ")}
        </p>
      )}
    </div>
  );
}
