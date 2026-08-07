"use client";

import { useState, type RefObject } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
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
      <Download className="h-4 w-4" />
      {exporting ? "Erstelle PDF…" : "PDF herunterladen"}
    </Button>
  );
}
