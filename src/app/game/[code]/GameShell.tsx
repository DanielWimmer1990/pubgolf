"use client";

import { GameProvider } from "./GameProvider";

export function GameShell({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  return <GameProvider code={code}>{children}</GameProvider>;
}
