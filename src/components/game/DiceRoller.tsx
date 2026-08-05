"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

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

  function roll() {
    if (rolling || disabled) return;
    setRolling(true);

    let ticks = 0;
    const interval = setInterval(() => {
      setDisplayValue(1 + Math.floor(Math.random() * 6));
      ticks++;
      if (ticks >= 10) {
        clearInterval(interval);
        const final = 1 + Math.floor(Math.random() * 6);
        setDisplayValue(final);
        setRolling(false);
        onRoll(final);
      }
    }, 80);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        type="button"
        onClick={roll}
        disabled={disabled}
        animate={rolling ? { rotate: [0, 15, -15, 10, -10, 0] } : {}}
        transition={{ duration: 0.08, repeat: rolling ? Infinity : 0 }}
        className={cn(
          "flex h-24 w-24 items-center justify-center rounded-2xl border-2 text-6xl leading-none",
          disabled ? "opacity-60" : "cursor-pointer hover:bg-accent"
        )}
      >
        {DICE_FACES[(value ?? displayValue) - 1]}
      </motion.button>
      <Button type="button" variant="outline" onClick={roll} disabled={disabled}>
        {value ? "Nochmal würfeln" : "PAR würfeln"}
      </Button>
    </div>
  );
}
