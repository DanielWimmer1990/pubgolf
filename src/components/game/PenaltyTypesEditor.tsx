import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { PenaltyType } from "@/types/database";

export function PenaltyTypesEditor({
  value,
  onChange,
}: {
  value: PenaltyType[];
  onChange: (value: PenaltyType[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newPoints, setNewPoints] = useState(5);

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
      { id: crypto.randomUUID(), name: newName.trim(), points: newPoints },
    ]);
    setNewName("");
    setNewPoints(5);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Standard-Strafpunkte</Label>
        <p className="text-sm text-muted-foreground">
          Feste Vorfälle mit eigenem Punktewert, während der Runde per Klick
          eintragbar. Frei anpassbar und erweiterbar.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 divide-y divide-white/10 backdrop-blur-xl">
        {value.map((penalty) => (
          <div
            key={penalty.id}
            className="flex items-center gap-2 px-3 py-2"
          >
            <Input
              value={penalty.name}
              onChange={(e) => updateRow(penalty.id, { name: e.target.value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={penalty.points}
              onChange={(e) =>
                updateRow(penalty.id, { points: Number(e.target.value) })
              }
              className="w-20 text-center"
            />
            <button
              type="button"
              onClick={() => removeRow(penalty.id)}
              aria-label={`${penalty.name} entfernen`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Neue Strafe, z.B. Handy verloren"
          className="flex-1"
          maxLength={40}
        />
        <Input
          type="number"
          value={newPoints}
          onChange={(e) => setNewPoints(Number(e.target.value))}
          className="w-20 text-center"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addRow}
          disabled={!newName.trim()}
          className="shrink-0 border-primary/40"
          aria-label="Strafe hinzufügen"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
