import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { GameShell } from "./GameShell";

const DESCRIPTION_TEMPLATES = (gameName: string | null) => [
  `${gameName ?? "Eine Pubgolf-Runde"} ruft — Bar für Bar, Schluck für Schluck. Bist du dabei?`,
  `Würfel liegen bereit. ${gameName ?? "Die Runde"} startet, sobald du beitrittst.`,
  `PAR ist nur eine Empfehlung. Tritt bei und misch mit bei ${gameName ?? "dieser Runde"}.`,
  `Live-Rangliste, Strafpunkte, Chaos garantiert — ${gameName ?? "die Runde"} wartet auf dich.`,
];

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const normalizedCode = code.toUpperCase();

  const { data: game } = await supabase
    .from("games")
    .select("name")
    .eq("code", normalizedCode)
    .maybeSingle();

  const gameName = game?.name ?? null;
  const title = gameName ? `${gameName} · Pubgolf` : `Pubgolf-Runde ${normalizedCode}`;
  const description = pick(DESCRIPTION_TEMPLATES(gameName));

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function GameLayout({
  params,
  children,
}: {
  params: Promise<{ code: string }>;
  children: React.ReactNode;
}) {
  const { code } = await params;
  return <GameShell code={code.toUpperCase()}>{children}</GameShell>;
}
