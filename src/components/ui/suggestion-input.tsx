"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InfoButton } from "@/components/game/InfoButton";

export type Suggestion = { value: string; description?: string | null };

export function SuggestionInput({
  value,
  onChange,
  suggestions,
  browseLabel,
  id,
  placeholder,
  maxLength,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: Suggestion[];
  browseLabel: string;
  id?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    // Browsing is opt-in (via the button below) and should always offer
    // the full list — including the currently selected value — so
    // changing your mind after picking something doesn't leave you
    // staring at an apparently-empty (but still "open") list.
    if (!query) return suggestions;
    return suggestions.filter((s) => s.value.toLowerCase().includes(query));
  }, [value, suggestions]);

  // Only ever opens when the user explicitly asks for it (via the "browse"
  // button) — not on focus, so typing never gets ambushed by a list.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (containerRef.current?.contains(target)) return;
      // The "i" explanation dialog is rendered in a portal straight onto
      // <body>, so it's not inside containerRef in the DOM even though
      // it's logically part of this dropdown — don't treat clicks in it
      // (including its close button) as "clicked outside".
      if (
        target.closest(
          '[data-slot="dialog-overlay"], [data-slot="dialog-content"]'
        )
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const showList = open && filtered.length > 0;

  return (
    <div ref={containerRef} className="space-y-1.5">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
      >
        {open ? (
          <>
            <X className="h-3.5 w-3.5" />
            Liste schließen
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {browseLabel}
          </>
        )}
      </button>
      {showList && (
        <ul className="max-h-52 overflow-y-auto rounded-2xl border border-white/10 bg-popover p-1 text-popover-foreground shadow-inner">
          {filtered.map((suggestion, i) => (
            <li
              key={`${suggestion.value.toLowerCase()}-${i}`}
              className="flex items-center gap-1"
            >
              <button
                type="button"
                onClick={() => {
                  onChange(suggestion.value);
                  setOpen(false);
                }}
                className="flex-1 truncate rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-white/10 active:bg-white/15"
              >
                {suggestion.value}
              </button>
              {suggestion.description && (
                <InfoButton title={suggestion.value}>
                  {suggestion.description}
                </InfoButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
