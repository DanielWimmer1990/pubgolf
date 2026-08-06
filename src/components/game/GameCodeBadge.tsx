"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  async function share() {
    const url = `${window.location.origin}/game/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pubgolf",
          text: `Tritt meinem Pubgolf-Spiel bei! Code: ${code}`,
          url,
        });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      copyLink();
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      {qrDataUrl && (
        <div className="rounded-2xl bg-white p-2 shadow-[0_0_30px_-8px] shadow-primary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR-Code zum Spiel" className="h-36 w-36" />
        </div>
      )}
      <button
        type="button"
        onClick={copyLink}
        className="font-heading text-4xl font-bold tracking-[0.25em] text-center bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent"
      >
        {code}
      </button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 border-primary/40"
        onClick={share}
      >
        <Share2 className="h-3.5 w-3.5" />
        Einladung teilen
      </Button>
    </div>
  );
}
