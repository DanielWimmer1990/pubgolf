"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const MAX_SIZE_MB = 5;

export function HeaderImageUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Bitte ein Bild auswählen.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Bild darf maximal ${MAX_SIZE_MB} MB groß sein.`);
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("game-headers")
      .upload(path, file, { upsert: false });
    setUploading(false);

    if (error) {
      console.error(error);
      toast.error("Bild-Upload fehlgeschlagen.");
      return;
    }

    const { data } = supabase.storage.from("game-headers").getPublicUrl(path);
    onChange(data.publicUrl);
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Header-Bild"
          className="h-32 w-full object-cover"
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
          aria-label="Bild entfernen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2 border-primary/40 text-base"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <ImagePlus className="h-4 w-4 text-primary" />
        {uploading ? "Lädt hoch…" : "Header-Bild hochladen (optional)"}
      </Button>
    </>
  );
}
