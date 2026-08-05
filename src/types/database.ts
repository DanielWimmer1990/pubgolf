export type GameStatus = "lobby" | "in_progress" | "finished";
export type RoundStatus = "setup" | "active" | "done";
export type MinigameOutcome = "winner" | "loser" | "neutral";

export type ScoringRow = {
  diff: number; // sips - par
  points: number;
};

export type ScoringTable = {
  rows: ScoringRow[];
};

export type Game = {
  id: string;
  created_at: string;
  code: string;
  name: string | null;
  status: GameStatus;
  scoring_table: ScoringTable;
  current_round_number: number;
  started_at: string | null;
  finished_at: string | null;
};

export type Player = {
  id: string;
  created_at: string;
  game_id: string;
  device_token: string;
  name: string;
  color: string;
  avatar_emoji: string | null;
  turn_order: number;
  is_host: boolean;
};

export type Round = {
  id: string;
  created_at: string;
  game_id: string;
  round_number: number;
  active_player_id: string;
  bar_name: string | null;
  drink_description: string | null;
  par: number | null;
  status: RoundStatus;
  minigame_name: string | null;
  minigame_points_winner: number | null;
  minigame_points_loser: number | null;
};

export type RoundDrink = {
  id: string;
  round_id: string;
  game_id: string;
  player_id: string;
  sips: number | null;
  points: number | null;
  reported_at: string | null;
};

export type Rule = {
  id: string;
  created_at: string;
  game_id: string;
  round_id: string;
  created_by_player_id: string;
  text: string;
  violation_points: number;
};

export type RuleViolation = {
  id: string;
  created_at: string;
  game_id: string;
  rule_id: string;
  violator_player_id: string;
  reported_by_player_id: string;
  points_applied: number;
};

export type MinigameResult = {
  id: string;
  created_at: string;
  game_id: string;
  round_id: string;
  player_id: string;
  outcome: MinigameOutcome;
  points_applied: number;
  recorded_by_player_id: string;
};
