import type { Player } from "@/types/database";

export function ScoreProgressionChart({
  players,
  maxRound,
  series,
}: {
  players: Player[];
  maxRound: number;
  series: Map<string, number[]>;
}) {
  if (maxRound < 1) return null;

  const width = 320;
  const height = 170;
  const padTop = 10;
  const padBottom = 20;
  const padLeft = 30;
  const padRight = 12;

  const allValues = players
    .flatMap((p) => series.get(p.id) ?? [])
    .concat([0]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const mid = Math.round((min + max) / 2);
  const ticks = [...new Set([max, mid, min])];

  function x(roundIndex: number) {
    return (
      padLeft +
      (roundIndex / Math.max(1, maxRound - 1)) * (width - padLeft - padRight)
    );
  }
  function y(value: number) {
    return (
      height -
      padBottom -
      ((value - min) / range) * (height - padTop - padBottom)
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Punkte pro Runde
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={padLeft}
              y1={y(tick)}
              x2={width - padRight}
              y2={y(tick)}
              stroke="currentColor"
              strokeOpacity={tick === 0 ? 0.25 : 0.1}
              strokeDasharray={tick === 0 ? undefined : "3 3"}
            />
            <text
              x={padLeft - 5}
              y={y(tick)}
              fontSize={9}
              textAnchor="end"
              dominantBaseline="middle"
              fill="currentColor"
              opacity={0.55}
            >
              {tick > 0 ? `+${tick}` : tick}
            </text>
          </g>
        ))}
        {Array.from({ length: maxRound }).map((_, i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 6}
            fontSize={9}
            textAnchor="middle"
            fill="currentColor"
            opacity={0.5}
          >
            R{i + 1}
          </text>
        ))}
        {players.map((player) => {
          const values = series.get(player.id) ?? [];
          if (values.length === 0) return null;
          const d = values
            .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`)
            .join(" ");
          return (
            <path
              key={player.id}
              d={d}
              fill="none"
              stroke={player.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        {players.map((player) => {
          const values = series.get(player.id) ?? [];
          const last = values[values.length - 1];
          if (last === undefined) return null;
          return (
            <circle
              key={player.id}
              cx={x(values.length - 1)}
              cy={y(last)}
              r={3.5}
              fill={player.color}
              stroke="var(--background)"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {players.map((player) => {
          const values = series.get(player.id) ?? [];
          const last = values[values.length - 1];
          return (
            <div
              key={player.id}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              {player.name}
              {last !== undefined && (
                <span className="tabular-nums">
                  ({last > 0 ? "+" : ""}
                  {last})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
