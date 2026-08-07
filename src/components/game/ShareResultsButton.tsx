"use client";

import { useState, type RefObject } from "react";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareResultsButton({
  pagesRef,
  fileName,
}: {
  pagesRef: RefObject<HTMLElement | null>;
  fileName: string;
}) {
  const [exporting, setExporting] = useState(false);

  async function exportPdf() {
    if (!pagesRef.current) return;
    setExporting(true);
    try {
      const pageEls = Array.from(
        pagesRef.current.querySelectorAll<HTMLElement>("[data-export-page]")
      );
      if (pageEls.length === 0) return;

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      let pdf: InstanceType<typeof jsPDF> | null = null;
      for (const pageEl of pageEls) {
        const canvas = await html2canvas(pageEl, {
          backgroundColor: "#0b0714",
          scale: 2,
        });
        const imgData = canvas.toDataURL("image/png");
        if (!pdf) {
          pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [canvas.width, canvas.height],
          });
        } else {
          pdf.addPage([canvas.width, canvas.height], "landscape");
        }
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      }
      if (!pdf) return;

      const blob = pdf.output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Pubgolf Ergebnis",
            text: "Unser Pubgolf-Ergebnis!",
          });
          return;
        } catch (shareErr) {
          // AbortError = user closed the share sheet on purpose, nothing to do.
          // Anything else (e.g. lost user-activation after the async capture,
          // which mobile browsers are strict about) should fall through to
          // the plain download below instead of silently doing nothing.
          if (
            shareErr instanceof DOMException &&
            shareErr.name === "AbortError"
          ) {
            return;
          }
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF heruntergeladen!");
    } catch (err) {
      console.error(err);
      toast.error("PDF konnte nicht erstellt werden.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full gap-2 border-primary/40 text-base"
      onClick={exportPdf}
      disabled={exporting}
    >
      <Share2 className="h-4 w-4" />
      {exporting ? "Erstelle PDF…" : "Als PDF teilen"}
    </Button>
  );
}
