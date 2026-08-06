"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZE = 96; // px

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

function DieFace({ value }: { value: number }) {
  return (
    <div
      className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1.5 rounded-2xl border border-white/25 bg-gradient-to-br from-orange-400 to-pink-500 p-3 shadow-[inset_0_3px_8px_rgba(255,255,255,0.45),inset_0_-5px_12px_rgba(0,0,0,0.25)]"
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const active = PIP_LAYOUTS[value].some(
          ([r, c]) => r === row && c === col
        );
        return (
          <div key={i} className="flex items-center justify-center">
            {active && (
              <span className="h-3 w-3 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// A bouncing, wobbling roll (no 3D transforms) — a rapid face-flicker that
// decelerates and settles with a little "thud", instead of a spinning cube.
const TOTAL_TICKS = 18;

export function DiceRoller({
  value,
  onRoll,
  disabled,
}: {
  value: number | null;
  onRoll: (value: number) => void;
  disabled?: boolean;
}) {
  const [rolling, setRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState(value ?? 1);
  const [transform, setTransform] = useState({ y: 0, rotate: 0, scale: 1 });
  const timeoutRef = useRef<number | null>(null);

  function roll() {
    if (rolling || disabled) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    const final = 1 + Math.floor(Math.random() * 6);
    setRolling(true);

    let tick = 0;
    const step = () => {
      tick += 1;
      const progress = tick / TOTAL_TICKS;
      const isLast = tick >= TOTAL_TICKS;
      const faceValue = isLast ? final : 1 + Math.floor(Math.random() * 6);
      setDisplayValue(faceValue);

      const decay = 1 - progress;
      const bounce = Math.abs(Math.sin(progress * Math.PI * 5)) * 22 * decay;
      const wobble = (Math.random() - 0.5) * 50 * decay;

      setTransform({
        y: isLast ? 0 : -bounce,
        rotate: isLast ? 0 : wobble,
        scale: isLast ? 1.15 : 1 - decay * 0.05,
      });

      if (isLast) {
        setRolling(false);
        onRoll(final);
        window.setTimeout(
          () => setTransform({ y: 0, rotate: 0, scale: 1 }),
          160
        );
        return;
      }

      const delay = 45 + progress * progress * 150;
      timeoutRef.current = window.setTimeout(step, delay);
    };
    step();
  }

  const shadowScale = 1 - Math.min(Math.abs(transform.y) / 22, 1) * 0.4;

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={roll}
        disabled={disabled}
        aria-label="Würfeln"
        className={cn(
          "relative flex flex-col items-center outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none",
          !disabled && "cursor-pointer",
          disabled && "opacity-60"
        )}
      >
        <div
          style={{
            width: SIZE,
            height: SIZE,
            transform: `translateY(${transform.y}px) rotate(${transform.rotate}deg) scale(${transform.scale})`,
            transition: "transform 90ms ease-out",
          }}
        >
          <DieFace value={displayValue} />
        </div>
        <div
          className="mt-1 h-2.5 w-16 rounded-full bg-black/40 blur-[2px]"
          style={{
            transform: `scaleX(${shadowScale})`,
            opacity: 0.5 * shadowScale,
            transition: "transform 90ms ease-out, opacity 90ms ease-out",
          }}
        />
      </button>

      <Button
        type="button"
        size="lg"
        onClick={roll}
        disabled={disabled || rolling}
        className="text-base"
      >
        {rolling ? "Würfelt…" : value ? "Nochmal würfeln" : "PAR würfeln"}
      </Button>
    </div>
  );
}
