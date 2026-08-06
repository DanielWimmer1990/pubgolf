"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZE = 84; // px, cube edge length
const HALF = SIZE / 2;

// Opposite faces sum to 7, like a real die. Each entry is the canonical
// rotation (mod 360) that brings that face to point at the camera.
const FACE_TARGET_ROTATION: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: 0, y: -90 },
  5: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
};

const FACE_STATIC_TRANSFORM: Record<number, string> = {
  1: `translateZ(${HALF}px)`,
  6: `rotateY(180deg) translateZ(${HALF}px)`,
  2: `rotateY(90deg) translateZ(${HALF}px)`,
  5: `rotateY(-90deg) translateZ(${HALF}px)`,
  3: `rotateX(90deg) translateZ(${HALF}px)`,
  4: `rotateX(-90deg) translateZ(${HALF}px)`,
};

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

// Shortest forward (non-negative) distance from `from` to an angle
// congruent with `to`, so rotation only ever accumulates and never has to
// snap backwards (which read as a jarring second "roll").
function forwardDelta(from: number, to: number): number {
  const diff = ((to - from) % 360 + 360) % 360;
  return diff;
}

function DieFace({ value }: { value: number }) {
  return (
    <div
      className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1 rounded-xl border border-white/25 bg-gradient-to-br from-orange-400 to-pink-500 p-2.5 shadow-[inset_0_2px_6px_rgba(255,255,255,0.4),inset_0_-4px_10px_rgba(0,0,0,0.25)]"
      style={{ backfaceVisibility: "hidden" }}
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
              <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  const [rotation, setRotation] = useState({ rotateX: -20, rotateY: 30 });

  function roll() {
    if (rolling || disabled) return;
    const final = 1 + Math.floor(Math.random() * 6);
    const target = FACE_TARGET_ROTATION[final];
    const spins = 3 + Math.floor(Math.random() * 2);

    setRolling(true);
    setRotation((prev) => ({
      rotateX: prev.rotateX + forwardDelta(prev.rotateX, target.x) + 360 * spins,
      rotateY: prev.rotateY + forwardDelta(prev.rotateY, target.y) + 360 * spins,
    }));

    window.setTimeout(() => {
      setRolling(false);
      onRoll(final);
    }, 2000);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={roll}
        disabled={disabled}
        aria-label="Würfeln"
        className={cn(
          "relative outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none",
          !disabled && "cursor-pointer",
          disabled && "opacity-60"
        )}
        style={{ perspective: 500 }}
      >
        <div
          className="relative"
          style={{
            width: SIZE,
            height: SIZE,
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg)`,
            transition: rolling
              ? "transform 2s cubic-bezier(0.16, 0.85, 0.24, 1)"
              : "transform 0.4s ease-out",
          }}
        >
          {([1, 2, 3, 4, 5, 6] as const).map((face) => (
            <div
              key={face}
              className="absolute inset-0"
              style={{
                transform: FACE_STATIC_TRANSFORM[face],
                backfaceVisibility: "hidden",
              }}
            >
              <DieFace value={face} />
            </div>
          ))}
        </div>
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
