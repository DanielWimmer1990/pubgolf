"use client";

import { useState, type RefObject } from "react";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareResultsButton({
  targetRef,
  fileName,
}: {
  targetRef: RefObject<HTMLElement | null>;
  fileName: string;
}) {
  const [exporting, setExporting] = useState(false);

  async function exportPdf() {
    if (!targetRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#0b0714",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
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
        } catch {
          // user cancelled the share sheet — fall through to download
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
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
