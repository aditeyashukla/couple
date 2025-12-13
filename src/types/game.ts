export type GameStatus = "waiting" | "active" | "completed";
export type PlayerRole = "playerA" | "playerB";
export type FeedbackColor = "green" | "yellow" | "grey";

export type TurnPlayerData = {
  word: string;
  feedback?: FeedbackColor[];
  submitted: boolean;
  submittedAt: number;
};

export type TurnData = {
  playerA?: TurnPlayerData;
  playerB?: TurnPlayerData;
};

export type PlayerPresence = {
  connected: boolean;
  connectedAt: number;
  lastSeen: number;
};

export type GameResult = "win" | "loss" | null;

export type Game = {
  status: GameStatus;
  createdAt: number;

  currentTurn: number; // 1-10
  playerA?: PlayerPresence;
  playerB?: PlayerPresence;

  turns?: Record<string, TurnData>;

  result?: GameResult;
  winningWord?: string | null;
  completedAt?: number | null;
};
