import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { pointsKindLabel } from "@/lib/pointsLabel";
import type { PenaltyType } from "@/types/database";

const PENALTY_ICONS = [
  "🚽",
  "💧",
  "🤮",
  "🍺",
  "🤢",
  "💥",
  "🙈",
  "📱",
  "😵",
  "🔥",
  "❌",
  "⚠️",
];

function IconPicker({
  value,
  onPick,
}: {
  value: string;
  onPick: (icon: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Icon wählen"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 text-lg hover:bg-white/10"
      >
        {value || "⚠️"}
      </button>
      {open && (
        <div className="absolute left-0 top-12 z-10 grid grid-cols-6 gap-1 rounded-2xl border border-white/15 bg-popover p-2 shadow-lg">
          {PENALTY_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => {
                onPick(icon);
                setOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-white/10"
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PenaltyTypesEditor({
  value,
  onChange,
}: {
  value: PenaltyType[];
  onChange: (value: PenaltyType[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newPoints, setNewPoints] = useState(5);
  const [newIcon, setNewIcon] = useState("⚠️");

  function updateRow(id: string, patch: Partial<PenaltyType>) {
    onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removeRow(id: string) {
    onChange(value.filter((p) => p.id !== id));
  }

  function addRow() {
    if (!newName.trim()) return;
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        name: newName.trim(),
        points: newPoints,
        icon: newIcon,
      },
    ]);
    setNewName("");
    setNewPoints(5);
    setNewIcon("⚠️");
  }

  return (
    <div className={cn("space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl")}>
      <div className="space-y-1">
        <Label>Standard-Strafpunkte</Label>
        <p className="text-sm text-muted-foreground">
          Feste Vorfälle mit eigenem Punktewert, während der Runde per Klick
          eintragbar. Frei anpassbar und erweiterbar.
        </p>
      </div>

      <div className="space-y-2">
        {value.map((penalty) => (
          <div
            key={penalty.id}
            className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <IconPicker
                value={penalty.icon}
                onPick={(icon) => updateRow(penalty.id, { icon })}
              />
              <Input
                value={penalty.name}
                onChange={(e) =>
                  updateRow(penalty.id, { name: e.target.value })
                }
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => removeRow(penalty.id)}
                aria-label={`${penalty.name} entfernen`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 pl-1">
              <span className="text-xs text-muted-foreground">
                Punkte
                {pointsKindLabel(penalty.points) &&
                  ` · ${pointsKindLabel(penalty.points)}`}
              </span>
              <NumberInput
                value={penalty.points}
                onChange={(v) => updateRow(penalty.id, { points: v })}
                className="w-20 text-center"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <IconPicker value={newIcon} onPick={setNewIcon} />
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Neue Strafe, z.B. Handy verloren"
            className="min-w-0 flex-1"
            maxLength={40}
          />
          <button
            type="button"
            onClick={addRow}
            disabled={!newName.trim()}
            aria-label="Strafe hinzufügen"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 pl-1">
          <span className="text-xs text-muted-foreground">
            Punkte
            {pointsKindLabel(newPoints) && ` · ${pointsKindLabel(newPoints)}`}
          </span>
          <NumberInput
            value={newPoints}
            onChange={setNewPoints}
            className="w-20 text-center"
          />
        </div>
      </div>
    </div>
  );
}
