"use client";

import { ChevronDown } from "lucide-react";
import { RoundBreakdownCard } from "@/components/game/RoundBreakdownCard";
import { useGame } from "@/hooks/useGame";

/** Every finished round, collapsed by default — tap one to see the full
 * breakdown (sips, Regelbruch, Minispiel, Extrapunkte) for that round. */
export function PastRoundsList() {
  const { rounds } = useGame();
  const doneRounds = rounds
    .filter((r) => r.status === "done")
    .sort((a, b) => b.round_number - a.round_number);

  if (doneRounds.length === 0) return null;

  return (
    <div className="w-full max-w-md space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Vergangene Runden
      </p>
      <ul className="space-y-2">
        {doneRounds.map((round) => (
          <li key={round.id}>
            <details className="group rounded-3xl border border-white/10 bg-white/5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
                <span>
                  Runde {round.round_number}
                  {round.bar_name ? ` · ${round.bar_name}` : ""}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4">
                <RoundBreakdownCard round={round} bare />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
