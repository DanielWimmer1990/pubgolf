"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  suggestions: string[];
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
    const pool = query
      ? suggestions.filter(
          (s) => s.toLowerCase().includes(query) && s.toLowerCase() !== query
        )
      : suggestions;
    return pool.slice(0, 8);
  }, [value, suggestions]);

  // Only ever opens when the user explicitly asks for it (via the "browse"
  // button) — not on focus, so typing never gets ambushed by a list.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
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
          {filtered.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
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
