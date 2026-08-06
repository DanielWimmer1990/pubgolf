import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScoringTableEditor } from "@/components/game/ScoringTableEditor";
import { PenaltyTypesEditor } from "@/components/game/PenaltyTypesEditor";
import type { PenaltyType, ScoringTable } from "@/types/database";

export type GameSettings = {
  scoringTable: ScoringTable;
  defaultDrink: string;
  penaltyTypes: PenaltyType[];
  showFinalPresentation: boolean;
  showLiveLeaderboard: boolean;
  hideLeaderboardFinalRound: boolean;
};

export function GameSettingsForm({
  value,
  onChange,
}: {
  value: GameSettings;
  onChange: (value: GameSettings) => void;
}) {
  function set<K extends keyof GameSettings>(key: K, v: GameSettings[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-6">
      <ScoringTableEditor
        value={value.scoringTable}
        onChange={(t) => set("scoringTable", t)}
      />

      <div className="space-y-2">
        <Label htmlFor="default-drink">Standard-Getränk (optional)</Label>
        <Input
          id="default-drink"
          value={value.defaultDrink}
          onChange={(e) => set("defaultDrink", e.target.value)}
          placeholder="z.B. kleines Bier"
          maxLength={40}
        />
        <p className="text-xs text-muted-foreground">
          Vorausgefüllt bei jeder Runde, bleibt änderbar.
        </p>
      </div>

      <PenaltyTypesEditor
        value={value.penaltyTypes}
        onChange={(t) => set("penaltyTypes", t)}
      />

      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="final-presentation">Endergebnis-Präsentation</Label>
            <p className="text-xs text-muted-foreground">
              Animierte Rangliste, Fun Awards und Konfetti statt einer
              schlichten Tabelle.
            </p>
          </div>
          <Switch
            id="final-presentation"
            checked={value.showFinalPresentation}
            onCheckedChange={(v) => set("showFinalPresentation", v)}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div>
            <Label htmlFor="live-leaderboard">Live-Rangliste</Label>
            <p className="text-xs text-muted-foreground">
              Alle können den Punktestand während des Spiels einsehen.
            </p>
          </div>
          <Switch
            id="live-leaderboard"
            checked={value.showLiveLeaderboard}
            onCheckedChange={(v) => set("showLiveLeaderboard", v)}
          />
        </div>

        {value.showLiveLeaderboard && (
          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div>
              <Label htmlFor="hide-final-round">
                Spannung in der letzten Runde
              </Label>
              <p className="text-xs text-muted-foreground">
                Rangliste wird versteckt, sobald jeder einmal dran war —
                Auflösung erst im Endergebnis.
              </p>
            </div>
            <Switch
              id="hide-final-round"
              checked={value.hideLeaderboardFinalRound}
              onCheckedChange={(v) => set("hideLeaderboardFinalRound", v)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
