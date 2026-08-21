"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { supabase } from "@/lib/supabase";

type Idea = { name: string; description: string | null };

/** Lets guests browse the full curated rule/minigame library ahead of
 * time, so they've got ideas ready once it's their turn. Read-only —
 * nothing here gets picked or submitted. */
export function IdeaLibraryDialog() {
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<Idea[]>([]);
  const [minigames, setMinigames] = useState<Idea[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    Promise.all([
      supabase.from("rule_templates").select("text, description").order("text"),
      supabase
        .from("minigame_templates")
        .select("name, description")
        .order("name"),
    ]).then(([rulesRes, minigamesRes]) => {
      setRules(
        (rulesRes.data ?? []).map((r) => ({
          name: r.text,
          description: r.description,
        }))
      );
      setMinigames(
        (minigamesRes.data ?? []).map((m) => ({
          name: m.name,
          description: m.description,
        }))
      );
      setLoaded(true);
    });
  }, [open, loaded]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Lightbulb className="h-4 w-4" />
          Ideen
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Ideen für Regeln & Minispiele</DrawerTitle>
          <DrawerDescription>
            Zum Durchlesen, falls du dir schon mal überlegen willst, was du
            bei deiner Runde vorschlägst.
          </DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[55vh] space-y-5 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Regeln ({rules.length})
            </p>
            <ul className="space-y-1.5">
              {rules.map((idea) => (
                <li
                  key={idea.name}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <p className="text-sm font-semibold">{idea.name}</p>
                  {idea.description && (
                    <p className="text-xs text-muted-foreground">
                      {idea.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Minispiele ({minigames.length})
            </p>
            <ul className="space-y-1.5">
              {minigames.map((idea) => (
                <li
                  key={idea.name}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <p className="text-sm font-semibold">{idea.name}</p>
                  {idea.description && (
                    <p className="text-xs text-muted-foreground">
                      {idea.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
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
