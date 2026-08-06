import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import type { ScoringTable } from "@/types/database";
import { diffLabel } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type ScoringTableEditorProps = {
  value: ScoringTable;
  onChange: (value: ScoringTable) => void;
};

export function ScoringTableEditor({
  value,
  onChange,
}: ScoringTableEditorProps) {
  function updatePoints(diff: number, points: number) {
    onChange({
      rows: value.rows.map((row) =>
        row.diff === diff ? { ...row, points } : row
      ),
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Punkte-Regeln</Label>
        <p className="text-sm text-muted-foreground">
          Genau das gewürfelte PAR getroffen? 0 Punkte. Wer mehr Schlucke
          braucht als gewürfelt, bekommt <span className="text-emerald-400 font-medium">Pluspunkte</span> —
          wer weniger braucht, <span className="text-red-400 font-medium">Minuspunkte</span>. Frei
          anpassbar für jede Zeile.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 divide-y divide-white/10 backdrop-blur-xl">
        {value.rows.map((row) => (
          <div
            key={row.diff}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <span className="text-sm">{diffLabel(row.diff)}</span>
            <NumberInput
              value={row.points}
              onChange={(v) => updatePoints(row.diff, v)}
              className={cn(
                "w-20 text-center font-semibold",
                row.points > 0 && "text-emerald-400",
                row.points < 0 && "text-red-400"
              )}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Abweichungen über diesen Bereich hinaus werden im gleichen Schritt
        weitergerechnet (z.B. PAR 6 bei 1 Schluck ergibt weiterhin −10).
      </p>
    </div>
  );
}
