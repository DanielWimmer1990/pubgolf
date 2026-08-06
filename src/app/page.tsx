"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeGameCode } from "@/lib/gameCode";
import { getRecentGames, removeRecentGame } from "@/lib/recentGames";
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
  const [showJoin, setShowJoin] = useState(false);
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

  async function deleteGame(e: React.MouseEvent, gameCode: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Dieses Spiel endgültig löschen?")) return;
    const { error } = await supabase.from("games").delete().eq("code", gameCode);
    if (error) {
      console.error(error);
      toast.error("Spiel konnte nicht gelöscht werden.");
      return;
    }
    removeRecentGame(gameCode);
    setRecentGames((prev) => prev.filter((g) => g.code !== gameCode));
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="text-center space-y-4">
        <div className="text-7xl drop-shadow-[0_0_30px_rgba(251,122,30,0.5)]">
          ⛳🍺
        </div>
        <h1 className="font-heading text-6xl font-bold tracking-tight bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
          Pubgolf
        </h1>
        <p className="font-heading text-lg font-semibold tracking-wide text-primary">
          Schlag für Schlag. Schluck für Schluck.
        </p>
        <p className="text-muted-foreground max-w-sm mx-auto text-base leading-relaxed">
          Ihr zieht als Gruppe von Bar zu Bar. Jede Runde ein neues PAR,
          dazu Extra-Regeln und Spontan-Duelle — bis eine Live-Rangliste
          zeigt, wer die Nacht gewinnt. Der Gastgeber hält die Fäden in der
          Hand, alle anderen fiebern live mit.
        </p>
      </div>

      <div className="w-full max-w-xs">
        <Button
          asChild
          size="lg"
          className="w-full text-base font-semibold shadow-[0_0_30px_-6px] shadow-primary"
        >
          <a href="/create">Neues Spiel starten</a>
        </Button>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-white/10" />
          oder
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {showJoin ? (
          <form onSubmit={handleJoin} className="flex flex-col gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Spielcode eingeben"
              className="h-12 text-center text-lg tracking-widest uppercase"
              maxLength={8}
              autoCapitalize="characters"
              autoFocus
            />
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full text-base"
              disabled={normalizeGameCode(code).length < 4}
            >
              Beitreten
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full text-base"
            onClick={() => setShowJoin(true)}
          >
            Spiel beitreten
          </Button>
        )}
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
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-xl hover:bg-white/10"
                >
                  <span className="truncate font-medium">
                    {game.name || game.code}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={`text-xs ${STATUS_CLASS[game.status]}`}>
                      {STATUS_LABEL[game.status]}
                    </span>
                    {game.status === "finished" && (
                      <button
                        type="button"
                        onClick={(e) => deleteGame(e, game.code)}
                        aria-label="Spiel löschen"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
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
