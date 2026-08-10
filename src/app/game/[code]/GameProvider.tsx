"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getStoredIdentity } from "@/lib/deviceIdentity";
import { trackRecentGame } from "@/lib/recentGames";
import type {
  Game,
  Player,
  Round,
  RoundDrink,
  Rule,
  RuleViolation,
  MinigameResult,
  PointAdjustment,
} from "@/types/database";

type TableName =
  | "games"
  | "players"
  | "rounds"
  | "round_drinks"
  | "rules"
  | "rule_violations"
  | "minigame_results"
  | "point_adjustments";

type State = {
  loading: boolean;
  notFound: boolean;
  loadError: boolean;
  game: Game | null;
  players: Player[];
  rounds: Round[];
  roundDrinks: RoundDrink[];
  rules: Rule[];
  ruleViolations: RuleViolation[];
  minigameResults: MinigameResult[];
  pointAdjustments: PointAdjustment[];
};

type Action =
  | { type: "SET_NOT_FOUND" }
  | { type: "SET_LOAD_ERROR" }
  | {
      type: "SET_INITIAL";
      payload: Omit<State, "loading" | "notFound" | "loadError">;
    }
  | { type: "UPSERT_ROW"; table: TableName; row: Record<string, unknown> }
  | { type: "DELETE_ROW"; table: TableName; id: string };

const TABLE_TO_STATE_KEY: Record<TableName, keyof State> = {
  games: "game",
  players: "players",
  rounds: "rounds",
  round_drinks: "roundDrinks",
  rules: "rules",
  rule_violations: "ruleViolations",
  minigame_results: "minigameResults",
  point_adjustments: "pointAdjustments",
};

function upsertInList<T extends { id: string }>(list: T[], row: T): T[] {
  const idx = list.findIndex((item) => item.id === row.id);
  if (idx === -1) return [...list, row];
  const next = [...list];
  next[idx] = row;
  return next;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_NOT_FOUND":
      return { ...state, loading: false, notFound: true };
    case "SET_LOAD_ERROR":
      return { ...state, loading: false, loadError: true };
    case "SET_INITIAL":
      return {
        ...state,
        ...action.payload,
        loading: false,
        notFound: false,
        loadError: false,
      };
    case "UPSERT_ROW": {
      if (action.table === "games") {
        return { ...state, game: action.row as unknown as Game };
      }
      const key = TABLE_TO_STATE_KEY[action.table] as Exclude<
        keyof State,
        "game" | "loading" | "notFound" | "loadError"
      >;
      return {
        ...state,
        [key]: upsertInList(
          state[key] as { id: string }[],
          action.row as { id: string }
        ),
      };
    }
    case "DELETE_ROW": {
      if (action.table === "games") return state;
      const key = TABLE_TO_STATE_KEY[action.table] as Exclude<
        keyof State,
        "game" | "loading" | "notFound" | "loadError"
      >;
      return {
        ...state,
        [key]: (state[key] as { id: string }[]).filter(
          (item) => item.id !== action.id
        ),
      };
    }
    default:
      return state;
  }
}

const initialState: State = {
  loading: true,
  notFound: false,
  loadError: false,
  game: null,
  players: [],
  rounds: [],
  roundDrinks: [],
  rules: [],
  ruleViolations: [],
  minigameResults: [],
  pointAdjustments: [],
};

export type LeaderboardEntry = {
  player: Player;
  total: number;
};

type GameContextValue = State & {
  code: string;
  players: Player[]; // sorted by turn_order
  currentRound: Round | null;
  activePlayer: Player | null;
  leaderboard: LeaderboardEntry[];
  myPlayer: Player | null;
  isActivePlayer: boolean;
  isHost: boolean;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      try {
        await loadImpl();
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        dispatch({ type: "SET_LOAD_ERROR" });
      }
    }

    async function loadImpl() {
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (cancelled) return;
      if (gameError) throw gameError;
      if (!game) {
        dispatch({ type: "SET_NOT_FOUND" });
        return;
      }
      trackRecentGame(code, (game as Game).name);

      const gameId = game.id;
      const [
        { data: players },
        { data: rounds },
        { data: roundDrinks },
        { data: rules },
        { data: ruleViolations },
        { data: minigameResults },
        { data: pointAdjustments },
      ] = await Promise.all([
        supabase.from("players").select("*").eq("game_id", gameId),
        supabase.from("rounds").select("*").eq("game_id", gameId),
        supabase.from("round_drinks").select("*").eq("game_id", gameId),
        supabase.from("rules").select("*").eq("game_id", gameId),
        supabase.from("rule_violations").select("*").eq("game_id", gameId),
        supabase.from("minigame_results").select("*").eq("game_id", gameId),
        supabase.from("point_adjustments").select("*").eq("game_id", gameId),
      ]);

      if (cancelled) return;

      dispatch({
        type: "SET_INITIAL",
        payload: {
          game: game as Game,
          players: (players ?? []) as Player[],
          rounds: (rounds ?? []) as Round[],
          roundDrinks: (roundDrinks ?? []) as RoundDrink[],
          rules: (rules ?? []) as Rule[],
          ruleViolations: (ruleViolations ?? []) as RuleViolation[],
          minigameResults: (minigameResults ?? []) as MinigameResult[],
          pointAdjustments: (pointAdjustments ?? []) as PointAdjustment[],
        },
      });

      channel = supabase.channel(`game:${gameId}`);

      const handle =
        (table: TableName) =>
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (oldRow.id) dispatch({ type: "DELETE_ROW", table, id: oldRow.id });
            return;
          }
          dispatch({ type: "UPSERT_ROW", table, row: payload.new });
        };

      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameId}`,
          },
          handle("games")
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `game_id=eq.${gameId}`,
          },
          handle("players")
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rounds",
            filter: `game_id=eq.${gameId}`,
          },
          handle("rounds")
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "round_drinks",
            filter: `game_id=eq.${gameId}`,
          },
          handle("round_drinks")
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rules",
            filter: `game_id=eq.${gameId}`,
          },
          handle("rules")
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rule_violations",
            filter: `game_id=eq.${gameId}`,
          },
          handle("rule_violations")
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "minigame_results",
            filter: `game_id=eq.${gameId}`,
          },
          handle("minigame_results")
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "point_adjustments",
            filter: `game_id=eq.${gameId}`,
          },
          handle("point_adjustments")
        )
        .subscribe();
    }

    load();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [code]);

  const value = useMemo<GameContextValue>(() => {
    const players = [...state.players].sort(
      (a, b) => a.turn_order - b.turn_order
    );
    const currentRound =
      state.rounds.find(
        (r) => r.round_number === state.game?.current_round_number
      ) ?? null;
    const activePlayer =
      players.find((p) => p.id === currentRound?.active_player_id) ?? null;

    const totals = new Map<string, number>();
    for (const p of players) totals.set(p.id, 0);
    for (const rd of state.roundDrinks) {
      if (rd.points == null) continue;
      totals.set(rd.player_id, (totals.get(rd.player_id) ?? 0) + rd.points);
    }
    for (const rv of state.ruleViolations) {
      totals.set(
        rv.violator_player_id,
        (totals.get(rv.violator_player_id) ?? 0) + rv.points_applied
      );
    }
    for (const mr of state.minigameResults) {
      totals.set(
        mr.player_id,
        (totals.get(mr.player_id) ?? 0) + mr.points_applied
      );
    }
    for (const pa of state.pointAdjustments) {
      totals.set(pa.player_id, (totals.get(pa.player_id) ?? 0) + pa.points);
    }
    // Golf-style scoring: lowest total wins (Gutpunkte/minus is the good
    // direction, Strafpunkte/plus is the bad direction — see pointsLabel.ts).
    const leaderboard: LeaderboardEntry[] = players
      .map((player) => ({ player, total: totals.get(player.id) ?? 0 }))
      .sort((a, b) => a.total - b.total);

    const { playerId } = getStoredIdentity(code);
    const myPlayer = players.find((p) => p.id === playerId) ?? null;
    const isActivePlayer = !!myPlayer && myPlayer.id === activePlayer?.id;
    const isHost = !!myPlayer?.is_host;

    return {
      ...state,
      code,
      players,
      currentRound,
      activePlayer,
      leaderboard,
      myPlayer,
      isActivePlayer,
      isHost,
    };
  }, [state, code]);

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
