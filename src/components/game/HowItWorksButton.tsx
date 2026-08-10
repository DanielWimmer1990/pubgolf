"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function HowItWorksButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <HelpCircle className="h-4 w-4" />
        Wie funktioniert Pubgolf?
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>⛳🍺 Wie funktioniert Pubgolf?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-2 text-sm leading-relaxed text-foreground/90">
                <p>
                  Ihr zieht als Gruppe von Bar zu Bar. Jede Bar ist eine{" "}
                  <strong className="text-foreground">Runde</strong>, und
                  jede Runde gehört einem anderen Spieler — der sucht die
                  Bar aus, würfelt und stellt eine Regel auf. Am Ende hat,
                  wer die meisten Punkte gesammelt hat, gewonnen.
                </p>

                <div>
                  <p className="font-semibold text-foreground">
                    🎲 PAR &amp; Schlucke
                  </p>
                  <p>
                    Der aktive Spieler würfelt das PAR — die Anzahl
                    Schlucke, die euer Getränk &bdquo;eigentlich&ldquo;
                    braucht. Jeder trinkt sein Getränk und meldet, wie
                    viele Schlucke er wirklich gebraucht hat. Mehr Schlucke
                    als PAR gibt Strafpunkte, weniger Schlucke gibt
                    Gutpunkte — genau PAR getroffen zählt 0.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">
                    📜 Regeln
                  </p>
                  <p>
                    Jede Runde stellt der aktive Spieler eine neue Regel
                    auf (z.&nbsp;B. &bdquo;Nicht mit links trinken&ldquo;),
                    die ab sofort für den Rest des Spiels gilt. Wer sie
                    bricht, kassiert Strafpunkte — das kann jederzeit im
                    Spiel eingetragen werden, auch für Regeln aus früheren
                    Runden.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">
                    🎮 Minispiele
                  </p>
                  <p>
                    Zusätzlich kann der aktive Spieler ein Minispiel
                    ausrufen (Armdrücken, Schere-Stein-Papier, …). Gewinner
                    bekommen Gutpunkte, Verlierer Strafpunkte.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">
                    🚽 Strafpunkte &amp; Extrapunkte
                  </p>
                  <p>
                    Für Klassiker wie Klogang, Umschütten oder Kotzen gibt
                    es vorgefertigte Strafpunkte per Klick. Für alles
                    andere, was sonst passiert, gibt es ein freies Feld für
                    Extrapunkte — Gut- oder Strafpunkte, frei wählbar.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">
                    🏁 Ende &amp; Ergebnis
                  </p>
                  <p>
                    Standardmäßig ist jeder einmal an der Reihe, danach
                    kann der Gastgeber weitere Bonusrunden einlegen oder
                    das Spiel beenden. Am Ende gibt es eine Rangliste mit
                    Fun Awards — wer hat am meisten Regeln gebrochen, wer
                    hatte den heftigsten Schluck?
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Nur der Gastgeber steuert das Spiel — alle anderen
                  treten einfach bei und fiebern live mit.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" onClick={() => setOpen(false)}>
            Verstanden
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
