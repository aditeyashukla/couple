import { ref, runTransaction } from "firebase/database";
import { db } from "./config";
import { generateGameCode } from "../utils/gameCode";
import { calculateFeedback } from "../utils/feedback";
import type { Game, PlayerRole, TurnData } from "../types/game";
import { MAX_WORD_REUSES_PER_PLAYER } from "../constants/gameRules";

const gameRef = (code: string) => ref(db, `games/${code}`);

const nowMs = () => Date.now();

const makePresence = (connected: boolean) => {
  const now = nowMs();
  return { connected, connectedAt: connected ? now : 0, lastSeen: connected ? now : 0 };
};

const buildInitialGame = (createdAt: number): Game => ({
  status: "waiting",
  createdAt,
  currentTurn: 1,
  playerA: makePresence(true),
  playerB: makePresence(false),
  turns: {},
  result: null,
  winningWord: null,
  completedAt: null,
});

export async function createGame(): Promise<{ gameCode: string; role: PlayerRole }> {
  const createdAt = nowMs();

  for (let attempt = 0; attempt < 25; attempt++) {
    const code = generateGameCode();

    const result = await runTransaction(
      gameRef(code),
      (current) => {
        if (current) return undefined; // abort if a game already exists
        return buildInitialGame(createdAt);
      },
      { applyLocally: false }
    );

    if (result.committed) {
      return { gameCode: code, role: "playerA" };
    }
  }

  throw new Error("Could not generate a unique game code. Try again.");
}

export async function joinGame(gameCode: string): Promise<PlayerRole> {
  const joinedAt = nowMs();

  let updated = false;
  let full = false;
  const result = await runTransaction(
    gameRef(gameCode),
    (current: any) => {
      updated = false;
      full = false;

      if (!current) {
        return current; // let server retry with fresh data if it exists
      }
      if (current.playerB?.connected) {
        full = true;
        return current; // no change if already full
      }

      const playerA = current.playerA ? { ...current.playerA, lastSeen: joinedAt } : makePresence(false);
      const playerB = { connected: true, connectedAt: joinedAt, lastSeen: joinedAt };
      updated = true;

      return {
        ...current,
        status: "active",
        playerA,
        playerB,
      };
    },
    { applyLocally: false }
  );

  const snapVal = result.snapshot.val();
  if (!result.snapshot.exists()) throw new Error("Game not found. Check the code and try again.");
  if (full && snapVal?.playerB?.connected) throw new Error("This game already has 2 players.");
  if (!result.committed || !updated || snapVal?.playerB?.connectedAt !== joinedAt) {
    throw new Error("Could not join game. Try again.");
  }

  return "playerB";
}

export async function submitWord(gameCode: string, player: PlayerRole, word: string): Promise<void> {
  const submittedAt = nowMs();
  const normalized = String(word || "").trim().toUpperCase();

  let inactive = false;
  let updated = false;
  let repeatLimitExceeded = false;
  const result = await runTransaction(
    gameRef(gameCode),
    (current: any) => {
      inactive = false;
      updated = false;
      repeatLimitExceeded = false;

      if (!current) {
        return current; // let server retry with fresh data if it exists
      }
      if (current.status !== "active") {
        inactive = true;
        return current;
      }

      const turnNum = Number(current.currentTurn ?? 1);
      if (!Number.isInteger(turnNum) || turnNum < 1 || turnNum > 10) return current;

      const turnKey = String(turnNum);
      const turns = { ...(current.turns ?? {}) };
      const existingTurn: TurnData | undefined = turns[turnKey];
      const turn: TurnData = {};
      if (existingTurn?.playerA) turn.playerA = { ...existingTurn.playerA };
      if (existingTurn?.playerB) turn.playerB = { ...existingTurn.playerB };

      const cleanPlayer = (p?: TurnData["playerA"]) => {
        if (!p) return undefined;
        const cleaned: TurnData["playerA"] = {
          word: p.word,
          submitted: p.submitted,
          submittedAt: p.submittedAt,
        };
        if (p.feedback) cleaned.feedback = p.feedback;
        return cleaned;
      };

      const alreadySubmitted = turn[player]?.submitted;
      if (alreadySubmitted) return current;

      const wordReuseCount = Object.values(current.turns ?? {}).reduce((count, t: any) => {
        const submission = t?.[player];
        if (!submission?.submitted) return count;
        const submittedWord = String(submission.word || "").trim().toUpperCase();
        return submittedWord === normalized ? count + 1 : count;
      }, 0);

      if (wordReuseCount >= MAX_WORD_REUSES_PER_PLAYER) {
        repeatLimitExceeded = true;
        return current;
      }

      turn[player] = {
        word: normalized,
        submitted: true,
        submittedAt,
      };
      updated = true;

      let status = current.status;
      let resultState = current.result ?? null;
      let winningWord = current.winningWord ?? null;
      let completedAt = current.completedAt ?? null;
      let currentTurn = current.currentTurn ?? 1;

      if (turn.playerA?.submitted && turn.playerB?.submitted) {
        const wordA = String(turn.playerA.word || "").toUpperCase();
        const wordB = String(turn.playerB.word || "").toUpperCase();

        turn.playerA = { ...turn.playerA, feedback: calculateFeedback(wordA, wordB) };
        turn.playerB = { ...turn.playerB, feedback: calculateFeedback(wordB, wordA) };

        if (wordA && wordA === wordB) {
          status = "completed";
          resultState = "win";
          winningWord = wordA;
          completedAt = submittedAt;
        } else if (turnNum >= 10) {
          status = "completed";
          resultState = "loss";
          winningWord = null;
          completedAt = submittedAt;
        } else {
          currentTurn = turnNum + 1;
        }
      }

      const sanitizedTurn: TurnData = {};
      const cleanA = cleanPlayer(turn.playerA);
      const cleanB = cleanPlayer(turn.playerB);
      if (cleanA) sanitizedTurn.playerA = cleanA;
      if (cleanB) sanitizedTurn.playerB = cleanB;
      turns[turnKey] = sanitizedTurn;

      return {
        ...current,
        status,
        result: resultState,
        winningWord,
        completedAt,
        currentTurn,
        turns,
      };
    },
    { applyLocally: false }
  );

  const snapVal = result.snapshot.val();
  if (!result.snapshot.exists()) throw new Error("Game not found. Check the code and try again.");
  if (repeatLimitExceeded) throw new Error(`You can only use the same word ${MAX_WORD_REUSES_PER_PLAYER} times in a game.`);
  if (!result.committed) throw new Error("Could not submit word. Try again.");
  if (!updated && inactive) throw new Error("Game is no longer active.");
}

export async function resetGame(gameCode: string): Promise<void> {
  const now = nowMs();

  const result = await runTransaction(
    gameRef(gameCode),
    (current: any) => {
      if (!current) {
        return current; // let server retry with fresh data if it exists
      }

      const playerA = current.playerA ? { ...current.playerA, lastSeen: now } : undefined;
      const playerB = current.playerB ? { ...current.playerB, lastSeen: now } : undefined;
      const hasB = !!playerB?.connected;

      return {
        ...current,
        status: hasB ? "active" : "waiting",
        currentTurn: 1,
        turns: {},
        result: null,
        winningWord: null,
        completedAt: null,
        playerA,
        playerB,
      };
    },
    { applyLocally: false }
  );

  if (!result.snapshot.exists()) throw new Error("Game not found. Check the code and try again.");
  if (!result.committed) throw new Error("Could not reset game. Try again.");
}
