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
  const height = 160;
  const padding = 22;

  const allValues = players
    .flatMap((p) => series.get(p.id) ?? [])
    .concat([0]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  function x(roundIndex: number) {
    return (
      padding +
      (roundIndex / Math.max(1, maxRound - 1)) * (width - padding * 2)
    );
  }
  function y(value: number) {
    return height - padding - ((value - min) / range) * (height - padding * 2);
  }

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={padding}
          y1={y(0)}
          x2={width - padding}
          y2={y(0)}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="4 3"
        />
        {Array.from({ length: maxRound }).map((_, i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 4}
            fontSize={8}
            textAnchor="middle"
            fill="currentColor"
            opacity={0.4}
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
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: player.color }}
            />
            {player.name}
          </div>
        ))}
      </div>
    </div>
  );
}
