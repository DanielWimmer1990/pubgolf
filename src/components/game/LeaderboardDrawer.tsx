"use client";

import { Trophy } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Leaderboard } from "@/components/game/Leaderboard";

export function LeaderboardDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Trophy className="h-4 w-4" />
          Rangliste
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Rangliste</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[55vh] overflow-y-auto px-4 pb-4">
          <Leaderboard compact />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Schließen</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
