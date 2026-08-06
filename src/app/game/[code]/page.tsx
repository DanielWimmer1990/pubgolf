"use client";

import { useGame } from "@/hooks/useGame";
import { Lobby } from "@/components/game/Lobby";
import { GameHeader } from "@/components/game/GameHeader";
import { RoundSetup } from "@/components/game/RoundSetup";
import { RoundWaiting } from "@/components/game/RoundWaiting";
import { RoundActive } from "@/components/game/RoundActive";
import { RoundSummary } from "@/components/game/RoundSummary";
import { FinalResults } from "@/components/game/FinalResults";
import { Button } from "@/components/ui/button";

export default function GamePage() {
  const { loading, notFound, loadError, game, currentRound, isHost } =
    useGame();

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Lade Spiel…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-medium">Verbindung fehlgeschlagen</p>
        <p className="text-sm text-muted-foreground">
          Spiel konnte nicht geladen werden. Prüf deine Internetverbindung.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Nochmal versuchen
        </Button>
      </main>
    );
  }

  if (notFound || !game) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-medium">Spiel nicht gefunden</p>
        <p className="text-sm text-muted-foreground">
          Prüf den Code oder frag den Host nach einem neuen Link.
        </p>
      </main>
    );
  }

  if (game.status === "lobby") {
    return <Lobby />;
  }

  if (game.status === "finished") {
    return (
      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <FinalResults />
      </main>
    );
  }

  return (
    <>
      <GameHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-8">
        {!currentRound ? (
          <p className="text-muted-foreground">
            Nächste Runde wird vorbereitet…
          </p>
        ) : currentRound.status === "setup" ? (
          isHost ? (
            <RoundSetup />
          ) : (
            <RoundWaiting />
          )
        ) : currentRound.status === "active" ? (
          <RoundActive />
        ) : (
          <RoundSummary />
        )}
      </main>
    </>
  );
}
