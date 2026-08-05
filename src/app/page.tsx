"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeGameCode } from "@/lib/gameCode";
import { getRecentGames } from "@/lib/recentGames";
import { supabase } from "@/lib/supabase";
import type { GameStatus } from "@/types/database";

type RecentGameView = {
  code: string;
  name: string | null;
  status: GameStatus;
};

const STATUS_LABEL: Record<GameStatus, string> = {
  lobby: "Lobby",
  in_progress: "Läuft",
  finished: "Beendet",
};

const STATUS_CLASS: Record<GameStatus, string> = {
  lobby: "text-muted-foreground",
  in_progress: "text-emerald-500",
  finished: "text-muted-foreground",
};

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [recentGames, setRecentGames] = useState<RecentGameView[]>([]);

  useEffect(() => {
    const stored = getRecentGames();
    if (stored.length === 0) return;

    let cancelled = false;
    supabase
      .from("games")
      .select("code,name,status")
      .in(
        "code",
        stored.map((g) => g.code)
      )
      .then(({ data }) => {
        if (cancelled || !data) return;
        const byCode = new Map(data.map((g) => [g.code, g]));
        const merged = stored
          .map((g) => byCode.get(g.code))
          .filter((g): g is RecentGameView => !!g);
        setRecentGames(merged);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeGameCode(code);
    if (normalized.length < 4) return;
    router.push(`/game/${normalized}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="text-center space-y-3">
        <div className="text-6xl">⛳🍺</div>
        <h1 className="text-4xl font-bold tracking-tight">Pubgolf</h1>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Von Bar zu Bar, PAR für PAR. Würfeln, trinken, Regeln brechen,
          gewinnen.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button asChild size="lg" className="w-full text-base">
          <a href="/create">Neues Spiel starten</a>
        </Button>

        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Spielcode eingeben"
            className="text-center text-lg tracking-widest uppercase"
            maxLength={8}
            autoCapitalize="characters"
          />
          <Button
            type="submit"
            variant="secondary"
            size="lg"
            className="w-full text-base"
            disabled={normalizeGameCode(code).length < 4}
          >
            Spiel beitreten
          </Button>
        </form>
      </div>

      {recentGames.length > 0 && (
        <div className="w-full max-w-xs space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Deine Spiele
          </p>
          <ul className="space-y-1.5">
            {recentGames.map((game) => (
              <li key={game.code}>
                <a
                  href={`/game/${game.code}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-accent"
                >
                  <span className="truncate font-medium">
                    {game.name || game.code}
                  </span>
                  <span
                    className={`shrink-0 text-xs ${STATUS_CLASS[game.status]}`}
                  >
                    {STATUS_LABEL[game.status]}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
