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

export type PenaltyType = {
  id: string;
  name: string;
  points: number;
  icon: string;
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
  header_image_url: string | null;
  default_drink: string | null;
  default_rule_points: number;
  default_minigame_points_winner: number;
  default_minigame_points_loser: number;
  show_final_presentation: boolean;
  show_live_leaderboard: boolean;
  hide_leaderboard_final_round: boolean;
  penalty_types: PenaltyType[];
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
  minigame_description: string | null;
  is_final_round: boolean;
  draft_rule_text: string | null;
  draft_rule_points: number | null;
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
  description: string | null;
};

export type RuleViolation = {
  id: string;
  created_at: string;
  game_id: string;
  rule_id: string;
  round_id: string | null;
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

export type PointAdjustment = {
  id: string;
  created_at: string;
  game_id: string;
  round_id: string;
  player_id: string;
  label: string;
  points: number;
  created_by_player_id: string;
};

export type RuleTemplate = {
  id: string;
  created_at: string;
  text: string;
  description: string | null;
};

export type MinigameTemplate = {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
};
