import { ImageResponse } from "next/og";
import { supabase } from "@/lib/supabase";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pubgolf-Einladung";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = code.toUpperCase();

  const { data: game } = await supabase
    .from("games")
    .select("name")
    .eq("code", normalizedCode)
    .maybeSingle();

  const gameName = game?.name ?? "Pubgolf-Runde";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          backgroundColor: "#0b0714",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(249,115,22,0.35), transparent 55%), radial-gradient(circle at 80% 30%, rgba(236,72,153,0.3), transparent 55%), radial-gradient(circle at 50% 90%, rgba(168,85,247,0.35), transparent 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 120 }}>⛳🍺</div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            maxWidth: 960,
            justifyContent: "center",
          }}
        >
          {gameName}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 40px",
            borderRadius: 999,
            border: "3px solid rgba(249,115,22,0.7)",
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", fontSize: 40, color: "rgba(255,255,255,0.6)" }}>
            Code
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: 8,
              color: "#fb923c",
            }}
          >
            {normalizedCode}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.75)" }}>
          Von Bar zu Bar, PAR für PAR
        </div>
      </div>
    ),
    { ...size }
  );
}
