"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { InfoButton } from "@/components/game/InfoButton";
import { ReportViolationModal } from "@/components/game/ReportViolationModal";
import { useGame } from "@/hooks/useGame";
import type { Rule } from "@/types/database";

export function RulesList({ bare = false }: { bare?: boolean }) {
  const { rules, players, isHost } = useGame();
  const [reportingRule, setReportingRule] = useState<Rule | null>(null);

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.name ?? "?";
  }

  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          {bare ? (
            <Button size="lg" className="w-full gap-1.5 text-base">
              <ScrollText className="h-4 w-4" />
              Regeln ({rules.length})
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5">
              <ScrollText className="h-4 w-4" />
              Regeln ({rules.length})
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Aktive Regeln</DrawerTitle>
            <DrawerDescription>
              Gilt für den Rest des Spiels.{" "}
              {isHost
                ? "Du kannst jederzeit einen Regelbruch melden."
                : "Nur der Gastgeber kann Regelbrüche melden."}
            </DrawerDescription>
          </DrawerHeader>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto px-4 pb-4">
            {rules.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Noch keine Regeln aufgestellt.
              </p>
            )}
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-2 rounded-lg border p-3"
              >
                <div className="flex-1">
                  <p className="flex items-center gap-1 text-sm font-medium">
                    {rule.text}
                    {rule.description && (
                      <InfoButton title={rule.text}>
                        {rule.description}
                      </InfoButton>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    von {playerName(rule.created_by_player_id)} ·{" "}
                    {rule.violation_points > 0 ? "+" : ""}
                    {rule.violation_points} Punkte bei Bruch
                  </p>
                </div>
                {isHost && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setReportingRule(rule)}
                  >
                    Melden
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Schließen</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ReportViolationModal
        rule={reportingRule}
        onClose={() => setReportingRule(null)}
      />
    </>
  );
}
