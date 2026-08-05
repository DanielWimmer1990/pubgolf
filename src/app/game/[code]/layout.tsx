"use client";

import { useParams } from "next/navigation";
import { GameProvider } from "./GameProvider";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();

  return <GameProvider code={code}>{children}</GameProvider>;
}
