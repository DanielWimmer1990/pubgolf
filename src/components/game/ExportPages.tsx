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

// html2canvas doesn't reliably capture `background-clip: text` (gradient
// text silently renders invisible in the exported PDF) — a plain radial
// gradient on the page background is safe though, so that's where the
// color goes instead of on the heading text.
const PAGE_BACKGROUND_STYLE = {
  backgroundColor: "#0b0714",
  backgroundImage:
    "radial-gradient(circle at 12% 12%, rgba(251,122,30,0.35), transparent 55%), radial-gradient(circle at 88% 22%, rgba(236,72,153,0.28), transparent 55%), radial-gradient(circle at 50% 95%, rgba(124,58,237,0.35), transparent 55%)",
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
      style={{ width: PAGE_W, height: PAGE_H, ...PAGE_BACKGROUND_STYLE }}
      className="flex flex-col px-16 py-12"
    >
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="font-heading text-4xl font-bold text-orange-300">
          🏁 {title}
        </h1>
        {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

const SLOGAN_TEMPLATES = (
  gameName: string,
  winnerName: string | undefined,
  roundCount: number,
  playerCount: number
) => [
  `${gameName} — wo jeder Schluck zählt und PAR nur eine Empfehlung ist.`,
  `Willkommen bei ${gameName}. Nüchtern kommt hier keiner mehr raus.`,
  `${gameName}: ${playerCount} Spieler, ${roundCount} Runden, null Reue.`,
  winnerName
    ? `${gameName} ist Geschichte — und ${winnerName} hat sie geschrieben.`
    : `${gameName} — die Legende beginnt jetzt.`,
  `Die Bar-Tour ${gameName}: Schlag für Schlag, Schluck für Schluck.`,
  `${gameName} — Beweismaterial für die nächste Ausrede beim Arzt.`,
];

function generateSlogan(
  gameName: string,
  winnerName: string | undefined,
  roundCount: number,
  playerCount: number
): string {
  const options = SLOGAN_TEMPLATES(gameName, winnerName, roundCount, playerCount);
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
    gameName,
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
          style={{ width: PAGE_W, height: PAGE_H, ...PAGE_BACKGROUND_STYLE }}
          className="flex flex-col items-center justify-center gap-5 px-16 text-center"
        >
          <div className="flex items-center gap-2 text-lg font-heading font-semibold uppercase tracking-[0.35em] text-white/70">
            <span>⛳🍺</span>
            <span>Pubgolf</span>
          </div>
          <h1 className="font-heading text-7xl font-bold text-white">
            {gameName}
          </h1>
          <p className="max-w-2xl font-heading text-2xl font-medium text-white/90">
            {slogan}
          </p>
          <p className="text-sm text-white/60">
            {roundBreakdown.length} Runden · {players.length} Spieler
          </p>
        </div>
      </div>

      {/* Page 2 — Finale Tabelle */}
      <div data-export-page="standings">
        <PageShell title="Endstand" subtitle={gameName}>
          {(() => {
            // Fixed page height, so row density has to shrink with the
            // player count instead of overflowing (which just gets
            // silently clipped top/bottom by the PDF capture).
            const density =
              leaderboard.length > 8
                ? "compact"
                : leaderboard.length > 5
                ? "cozy"
                : "normal";
            const rowPadding =
              density === "compact"
                ? "px-4 py-1.5"
                : density === "cozy"
                ? "px-5 py-2.5"
                : "px-6 py-4";
            const rowGap =
              density === "compact"
                ? "gap-1.5"
                : density === "cozy"
                ? "gap-2"
                : "gap-3";
            const avatarSize =
              density === "compact" ? "sm" : density === "cozy" ? "md" : "lg";
            const nameSize =
              density === "compact"
                ? "text-base"
                : density === "cozy"
                ? "text-lg"
                : "text-xl";
            const medalSize =
              density === "compact"
                ? "text-lg"
                : density === "cozy"
                ? "text-2xl"
                : "text-3xl";
            return (
              <div className={cn("flex h-full flex-col justify-center", rowGap)}>
                {leaderboard.map(({ player, total }, index) => (
                  <div
                    key={player.id}
                    className={cn(
                      "flex items-center gap-5 rounded-2xl border border-white/10 bg-white/5",
                      rowPadding,
                      index === 0 && "border-amber-400/60 bg-amber-400/10"
                    )}
                  >
                    <span className={cn("w-12 text-center", medalSize)}>
                      {MEDALS[index] ?? index + 1}
                    </span>
                    <PlayerAvatar
                      name={player.name}
                      color={player.color}
                      avatarEmoji={player.avatar_emoji}
                      size={avatarSize}
                    />
                    <span
                      className={cn("flex-1 truncate font-semibold", nameSize)}
                    >
                      {player.name}
                    </span>
                    <PointsSpan total={total} />
                  </div>
                ))}
              </div>
            );
          })()}
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
