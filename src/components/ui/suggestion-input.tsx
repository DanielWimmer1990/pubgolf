"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export function SuggestionInput({
  value,
  onChange,
  suggestions,
  id,
  placeholder,
  maxLength,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  id?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    const pool = query
      ? suggestions.filter(
          (s) => s.toLowerCase().includes(query) && s.toLowerCase() !== query
        )
      : suggestions;
    return pool.slice(0, 8);
  }, [value, suggestions]);

  const showList = open && filtered.length > 0;

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
        autoComplete="off"
      />
      {showList && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-52 overflow-y-auto rounded-2xl border border-white/10 bg-popover p-1 text-popover-foreground shadow-xl">
          {filtered.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(suggestion);
                  setOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10 active:bg-white/15"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
