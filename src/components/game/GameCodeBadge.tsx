"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";

export function GameCodeBadge({ code }: { code: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/game/${code}`;
    QRCode.toDataURL(url, { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [code]);

  async function copyLink() {
    const url = `${window.location.origin}/game/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link kopiert!");
    } catch {
      toast.error("Konnte Link nicht kopieren.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border p-4">
      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrDataUrl}
          alt="QR-Code zum Spiel"
          className="h-40 w-40"
        />
      )}
      <button
        type="button"
        onClick={copyLink}
        className="text-3xl font-bold tracking-[0.3em] text-center"
      >
        {code}
      </button>
      <p className="text-xs text-muted-foreground">
        Code oder QR mit der Gruppe teilen
      </p>
    </div>
  );
}
