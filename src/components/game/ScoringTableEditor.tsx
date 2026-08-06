import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScoringTable } from "@/types/database";
import { diffLabel } from "@/lib/scoring";

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
          Punkte je nach Schlucken im Vergleich zum gewürfelten PAR. Frei
          anpassbar, Standard: PAR − Schlucke + 1.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 divide-y divide-white/10 backdrop-blur-xl">
        {value.rows.map((row) => (
          <div
            key={row.diff}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <span className="text-sm">{diffLabel(row.diff)}</span>
            <Input
              type="number"
              value={row.points}
              onChange={(e) =>
                updatePoints(row.diff, Number(e.target.value))
              }
              className="w-20 text-center"
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Abweichungen über diesen Bereich hinaus zählen wie der jeweils
        äußerste Wert.
      </p>
    </div>
  );
}
