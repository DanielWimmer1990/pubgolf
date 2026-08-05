import { supabase } from "@/lib/supabase";

// No 0/O/1/I to avoid ambiguity when players read the code aloud or off a screen.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 6;

export function generateGameCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/** Generates a code and retries on the rare unique-constraint collision. */
export async function generateUniqueGameCode(maxAttempts = 5): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateGameCode();
    const { data } = await supabase
      .from("games")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Konnte keinen freien Spielcode generieren.");
}

export function normalizeGameCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
