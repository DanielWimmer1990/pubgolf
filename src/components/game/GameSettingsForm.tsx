import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScoringTableEditor } from "@/components/game/ScoringTableEditor";
import { HeaderImageUpload } from "@/components/game/HeaderImageUpload";
import type { ScoringTable } from "@/types/database";

export type GameSettings = {
  scoringTable: ScoringTable;
  defaultDrink: string;
  defaultRulePoints: number;
  defaultMinigamePointsWinner: number;
  defaultMinigamePointsLoser: number;
  headerImageUrl: string | null;
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
      <HeaderImageUpload
        value={value.headerImageUrl}
        onChange={(url) => set("headerImageUrl", url)}
      />

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

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <Label>Standard-Punkte für neue Regeln</Label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Punkte bei Regelbruch
          </span>
          <Input
            type="number"
            value={value.defaultRulePoints}
            onChange={(e) =>
              set("defaultRulePoints", Number(e.target.value))
            }
            className="w-20 text-center"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <Label>Standard-Punkte für Minispiele</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Gewinner</span>
            <Input
              type="number"
              value={value.defaultMinigamePointsWinner}
              onChange={(e) =>
                set("defaultMinigamePointsWinner", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Verlierer</span>
            <Input
              type="number"
              value={value.defaultMinigamePointsLoser}
              onChange={(e) =>
                set("defaultMinigamePointsLoser", Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>

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
                Rangliste wird versteckt, sobald der Host eine Runde als
                „letzte Runde&rdquo; markiert — Auflösung erst am Ende.
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
