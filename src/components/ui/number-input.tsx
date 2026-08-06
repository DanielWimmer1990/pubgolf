"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

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
 * overwrite in one go, and uses inputMode=numeric with a pattern that
 * includes "-" since many mobile numeric keypads for type="number"
 * otherwise omit the minus key entirely.
 */
export function NumberInput({ value, onChange, ...props }: NumberInputProps) {
  const [raw, setRaw] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  // Resync the local text buffer when `value` changes from outside (e.g.
  // an external reset) without disrupting a lone "-" mid-composition — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (value !== prevValue) {
    setPrevValue(value);
    setRaw(String(value));
  }

  return (
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
      {...props}
    />
  );
}
