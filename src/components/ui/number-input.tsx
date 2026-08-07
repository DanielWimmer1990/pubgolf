"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: number;
  onChange: (value: number) => void;
};

/**
 * Integer input that keeps the typed text local (so a lone "-" while
 * composing a negative number doesn't get reverted by the controlled
 * value), selects everything on focus so the numeric keypad can
 * overwrite in one go, and has a dedicated sign-toggle button — many
 * mobile numeric keypads (esp. Android/Gboard for inputMode=numeric)
 * simply have no "-" key at all, so typing a negative number isn't
 * reliably possible without one.
 */
export function NumberInput({
  value,
  onChange,
  className,
  ...props
}: NumberInputProps) {
  const [raw, setRaw] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  // Resync the local text buffer when `value` changes from outside (e.g.
  // an external reset) without disrupting a lone "-" mid-composition — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (value !== prevValue) {
    setPrevValue(value);
    setRaw(String(value));
  }

  function toggleSign() {
    const next = -value;
    setPrevValue(next);
    setRaw(String(next));
    onChange(next);
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={toggleSign}
        aria-label="Vorzeichen umkehren"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 text-sm text-muted-foreground hover:bg-white/10"
      >
        ±
      </button>
      <Input
        type="text"
        inputMode="numeric"
        pattern="-?[0-9]*"
        value={raw}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const next = e.target.value;
          if (!/^-?[0-9]*$/.test(next)) return;
          setRaw(next);
          if (next !== "" && next !== "-") {
            onChange(Number(next));
          }
        }}
        onBlur={() => {
          if (raw === "" || raw === "-") setRaw(String(value));
        }}
        className={cn(className)}
        {...props}
      />
    </div>
  );
}
