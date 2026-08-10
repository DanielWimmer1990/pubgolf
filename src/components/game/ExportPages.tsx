import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { ScoreProgressionChart } from "@/components/game/ScoreProgressionChart";
import { cn } from "@/lib/utils";
import type { Player, Round } from "@/types/database";

const MEDALS = ["🥇", "🥈", "🥉"];
const PAGE_W = 1120;
const PAGE_H = 790;

type FunAward = {
  emoji: string;
  title: string;
  player: Player;
  detail: string;
};

type RoundBreakdownRow = {
  round: Round;
  cells: { player: Player; sips: number | null; points: number | null }[];
};

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ width: PAGE_W, height: PAGE_H }}
      className="flex flex-col bg-background px-16 py-12"
    >
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
          🏁 {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

const SLOGAN_TEMPLATES = (
  winnerName: string | undefined,
  roundCount: number,
  playerCount: number
) => [
  `${playerCount} Spieler betraten die Bars. Nur ${
    winnerName ?? "einer"
  } verließ sie als Champion.`,
  `${roundCount} Runden, ${playerCount} Legenden, null Reue.`,
  `Wo PAR nur eine Empfehlung war.`,
  winnerName
    ? `${winnerName} trinkt. ${winnerName} gewinnt. So einfach ist das.`
    : `Getrunken wurde hart, gewonnen noch härter.`,
  `Schlag für Schlag, Schluck für Schluck — diese Nacht wird Geschichte.`,
  `Beweismaterial für die nächste Ausrede beim Arzt.`,
];

function generateSlogan(
  winnerName: string | undefined,
  roundCount: number,
  playerCount: number
): string {
  const options = SLOGAN_TEMPLATES(winnerName, roundCount, playerCount);
  return options[Math.floor(Math.random() * options.length)];
}

function PointsSpan({ total }: { total: number }) {
  return (
    <span
      className={cn(
        "text-2xl font-bold tabular-nums",
        total < 0 && "text-emerald-500",
        total > 0 && "text-red-500"
      )}
    >
      {total > 0 ? "+" : ""}
      {total}
    </span>
  );
}

export function ExportPages({
  gameName,
  leaderboard,
  players,
  funAwards,
  progression,
  roundBreakdown,
  pagesRef,
}: {
  gameName: string;
  leaderboard: { player: Player; total: number }[];
  players: Player[];
  funAwards: FunAward[];
  progression: { maxRound: number; series: Map<string, number[]> };
  roundBreakdown: RoundBreakdownRow[];
  pagesRef: React.RefObject<HTMLDivElement | null>;
}) {
  const slogan = generateSlogan(
    leaderboard[0]?.player.name,
    roundBreakdown.length,
    players.length
  );

  return (
    <div
      ref={pagesRef}
      style={{ position: "fixed", top: 0, left: -99999 }}
      aria-hidden
    >
      {/* Page 1 — Cover */}
      <div data-export-page="cover">
        <div
          style={{ width: PAGE_W, height: PAGE_H }}
          className="flex flex-col items-center justify-center gap-6 bg-background px-16 text-center"
        >
          <div className="text-7xl">⛳🍺</div>
          <h1 className="font-heading text-6xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
            {gameName}
          </h1>
          <p className="max-w-2xl font-heading text-2xl font-medium text-foreground/90">
            {slogan}
          </p>
          <p className="text-sm text-muted-foreground">
            {roundBreakdown.length} Runden · {players.length} Spieler
          </p>
        </div>
      </div>

      {/* Page 2 — Finale Tabelle */}
      <div data-export-page="standings">
        <PageShell title="Endstand" subtitle={gameName}>
          <div className="flex h-full flex-col justify-center gap-3">
            {leaderboard.map(({ player, total }, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center gap-5 rounded-2xl border border-white/10 bg-white/5 px-6 py-4",
                  index === 0 && "border-amber-400/60 bg-amber-400/10"
                )}
              >
                <span className="w-12 text-center text-3xl">
                  {MEDALS[index] ?? index + 1}
                </span>
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  avatarEmoji={player.avatar_emoji}
                  size="lg"
                />
                <span className="flex-1 truncate text-xl font-semibold">
                  {player.name}
                </span>
                <PointsSpan total={total} />
              </div>
            ))}
          </div>
        </PageShell>
      </div>

      {/* Page 3 — Punkteverlauf */}
      <div data-export-page="chart">
        <PageShell title="Punkteverlauf" subtitle={gameName}>
          <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10">
            <div className="w-full max-w-3xl">
              <ScoreProgressionChart
                players={players}
                maxRound={progression.maxRound}
                series={progression.series}
              />
            </div>
          </div>
        </PageShell>
      </div>

      {/* Page 4 — Fun Awards */}
      <div data-export-page="awards">
        <PageShell title="Fun Awards" subtitle={gameName}>
          <div className="grid h-full grid-cols-2 gap-4 content-center">
            {funAwards.map((award) => (
              <div
                key={award.title}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <span className="text-3xl">{award.emoji}</span>
                <div className="flex-1">
                  <p className="text-base font-medium">{award.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {award.player.name} · {award.detail}
                  </p>
                </div>
                <PlayerAvatar
                  name={award.player.name}
                  color={award.player.color}
                  avatarEmoji={award.player.avatar_emoji}
                  size="md"
                />
              </div>
            ))}
          </div>
        </PageShell>
      </div>

      {/* Page 5 — Rundenergebnisse */}
      <div data-export-page="rounds">
        <PageShell title="Rundenergebnisse" subtitle={gameName}>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Runde
                  </th>
                  {players.map((player) => (
                    <th
                      key={player.id}
                      className="px-4 py-3 text-left font-medium text-muted-foreground"
                    >
                      {player.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roundBreakdown.map(({ round, cells }) => (
                  <tr key={round.id} className="border-b border-white/10">
                    <td className="px-4 py-3">
                      <p className="font-medium">Runde {round.round_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {round.bar_name}
                        {round.par ? ` · PAR ${round.par}` : ""}
                      </p>
                    </td>
                    {cells.map(({ player, sips, points }) => (
                      <td key={player.id} className="px-4 py-3">
                        {sips == null ? (
                          <span className="text-muted-foreground">–</span>
                        ) : (
                          <>
                            <span className="tabular-nums">{sips} S.</span>{" "}
                            <span
                              className={cn(
                                "font-semibold tabular-nums",
                                (points ?? 0) < 0 && "text-emerald-500",
                                (points ?? 0) > 0 && "text-red-500"
                              )}
                            >
                              ({(points ?? 0) > 0 ? "+" : ""}
                              {points ?? 0})
                            </span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageShell>
      </div>
    </div>
  );
}
