"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Dices, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuggestionInput } from "@/components/ui/suggestion-input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DiceRoller } from "@/components/game/DiceRoller";
import { InfoButton } from "@/components/game/InfoButton";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";
import { pointsKindLabel } from "@/lib/pointsLabel";
import {
  getRecentRuleTexts,
  getRecentMinigameNames,
  trackRuleText,
  trackMinigameName,
} from "@/lib/roundHistory";

export function RoundSetup() {
  const { game, currentRound, activePlayer, players, rounds, rules } =
    useGame();
  // If we're re-entering setup for a round that already had values (e.g.
  // the host went back from the active round to tweak PAR or the rule),
  // prefill from what's already on the round instead of starting blank.
  const existingRule = rules.find((r) => r.round_id === currentRound?.id);
  const [barName, setBarName] = useState(() => currentRound?.bar_name ?? "");
  const [drinkDescription, setDrinkDescription] = useState(
    () => currentRound?.drink_description ?? game?.default_drink ?? ""
  );
  const [par, setPar] = useState<number | null>(() => currentRound?.par ?? null);
  const [ruleText, setRuleText] = useState(
    () => existingRule?.text ?? currentRound?.draft_rule_text ?? ""
  );
  const [rulePoints, setRulePoints] = useState(
    () =>
      existingRule?.violation_points ??
      currentRound?.draft_rule_points ??
      game?.default_rule_points ??
      2
  );
  const [minigameEnabled, setMinigameEnabled] = useState(true);
  const [minigameName, setMinigameName] = useState(
    () => currentRound?.minigame_name ?? ""
  );
  const [minigamePointsWinner, setMinigamePointsWinner] = useState(
    () =>
      currentRound?.minigame_points_winner ??
      game?.default_minigame_points_winner ??
      -1
  );
  const [minigamePointsLoser, setMinigamePointsLoser] = useState(
    () =>
      currentRound?.minigame_points_loser ??
      game?.default_minigame_points_loser ??
      1
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
    supabase
      .from("rule_templates")
      .select("text")
      .order("text")
      .then(({ data }) => {
        if (!data) return;
        setRecentRules((prev) => {
          const merged = [...prev, ...data.map((r) => r.text)];
          return [...new Set(merged)];
        });
      });
    supabase
      .from("minigame_templates")
      .select("name")
      .order("name")
      .then(({ data }) => {
        if (!data) return;
        setRecentMinigames((prev) => {
          const merged = [...prev, ...data.map((m) => m.name)];
          return [...new Set(merged)];
        });
      });
  }, []);

  // Sync the in-progress setup to the `rounds` row (debounced) so
  // non-host players waiting on RoundWaiting can see the bar, PAR,
  // minigame and rule take shape live, instead of just a generic
  // "host is choosing" message.
  const currentRoundId = currentRound?.id;
  useEffect(() => {
    if (!currentRoundId) return;
    const timer = setTimeout(() => {
      supabase
        .from("rounds")
        .update({
          bar_name: barName.trim() || null,
          drink_description: drinkDescription.trim() || null,
          par,
          minigame_name: minigameEnabled ? minigameName.trim() || null : null,
          minigame_points_winner: minigameEnabled ? minigamePointsWinner : null,
          minigame_points_loser: minigameEnabled ? minigamePointsLoser : null,
          draft_rule_text: ruleText.trim() || null,
          draft_rule_points: rulePoints,
        })
        .eq("id", currentRoundId)
        .then(({ error }) => {
          if (error) console.error(error);
        });
    }, 500);
    return () => clearTimeout(timer);
    // currentRoundId (not the currentRound object) is intentional — the
    // object reference changes on every realtime echo of this very write,
    // which would otherwise retrigger this effect forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentRoundId,
    barName,
    drinkDescription,
    par,
    ruleText,
    rulePoints,
    minigameEnabled,
    minigameName,
    minigamePointsWinner,
    minigamePointsLoser,
  ]);

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
      // Editing an already-configured round (host went back from active
      // setup) updates the existing rule instead of inserting a duplicate.
      if (existingRule) {
        const { error: ruleError } = await supabase
          .from("rules")
          .update({ text: ruleText.trim(), violation_points: rulePoints })
          .eq("id", existingRule.id);
        if (ruleError) throw ruleError;
      } else {
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
      }

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
      supabase
        .from("rule_templates")
        .upsert({ text: ruleText.trim() }, { onConflict: "text", ignoreDuplicates: true })
        .then(({ error: templateError }) => {
          if (templateError) console.error(templateError);
        });
      if (minigameEnabled && minigameName.trim()) {
        trackMinigameName(minigameName);
        supabase
          .from("minigame_templates")
          .upsert(
            { name: minigameName.trim() },
            { onConflict: "name", ignoreDuplicates: true }
          )
          .then(({ error: templateError }) => {
            if (templateError) console.error(templateError);
          });
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
          <InfoButton title="Neue Regel">
            Der aktive Spieler legt eine neue Regel fest, die ab sofort für
            den Rest des Spiels gilt (z.&nbsp;B. &bdquo;Nicht mit links
            trinken&ldquo;). Bricht jemand die Regel, kannst du das jederzeit
            im Spiel eintragen — dafür gibt es die hier festgelegten
            Strafpunkte. Regeln bleiben aktiv, auch über diese Runde hinaus.
          </InfoButton>
        </Label>
        <SuggestionInput
          id="rule-text"
          value={ruleText}
          onChange={setRuleText}
          suggestions={recentRules}
          placeholder="z.B. Kein Ja und Nein mehr sagen"
          maxLength={140}
        />
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="rule-points" className="text-sm text-muted-foreground">
            Punkte bei Regelbruch
          </Label>
          <div className="flex items-center gap-2">
            {pointsKindLabel(rulePoints) && (
              <span className="text-xs text-muted-foreground">
                {pointsKindLabel(rulePoints)}
              </span>
            )}
            <NumberInput
              id="rule-points"
              value={rulePoints}
              onChange={setRulePoints}
              className="w-20 text-center"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Label className="flex items-center gap-1.5">
            <Dices className="h-4 w-4 text-primary" />
            Minispiel
            <InfoButton title="Minispiel">
              Ein kleines Duell oder eine Challenge für diese Runde (z.&nbsp;B.
              Armdrücken, Schere-Stein-Papier). Gewinner und Verlierer
              bekommen die hier festgelegten Punkte. Falls diese Runde kein
              Minispiel stattfinden soll, kannst du es rechts abschalten.
            </InfoButton>
          </Label>
          <Switch
            checked={minigameEnabled}
            onCheckedChange={setMinigameEnabled}
            aria-label="Minispiel für diese Runde"
          />
        </div>
        {minigameEnabled ? (
          <div className="space-y-3">
            <SuggestionInput
              value={minigameName}
              onChange={setMinigameName}
              suggestions={recentMinigames}
              placeholder="z.B. Schere Stein Papier"
              maxLength={60}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Punkte Gewinner
                  {pointsKindLabel(minigamePointsWinner) &&
                    ` · ${pointsKindLabel(minigamePointsWinner)}`}
                </Label>
                <NumberInput
                  value={minigamePointsWinner}
                  onChange={setMinigamePointsWinner}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Punkte Verlierer
                  {pointsKindLabel(minigamePointsLoser) &&
                    ` · ${pointsKindLabel(minigamePointsLoser)}`}
                </Label>
                <NumberInput
                  value={minigamePointsLoser}
                  onChange={setMinigamePointsLoser}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Kein Minispiel diese Runde.
          </p>
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
