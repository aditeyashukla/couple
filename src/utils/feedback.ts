import type { FeedbackColor } from "../types/game";

// Wordle-style duplicate-safe feedback for "myWord vs theirWord"
export function calculateFeedback(myWord: string, theirWord: string): FeedbackColor[] {
  const my = myWord.toUpperCase().split("");
  const theirs = theirWord.toUpperCase().split("");

  const feedback: FeedbackColor[] = Array(5).fill("grey");
  const remaining: Record<string, number> = {};

  // Pass 1: greens + count remaining letters in theirs
  for (let i = 0; i < 5; i++) {
    if (my[i] === theirs[i]) {
      feedback[i] = "green";
    } else {
      const l = theirs[i];
      remaining[l] = (remaining[l] ?? 0) + 1;
    }
  }

  // Pass 2: yellows (consume remaining counts)
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === "green") continue;
    const l = my[i];
    if ((remaining[l] ?? 0) > 0) {
      feedback[i] = "yellow";
      remaining[l] -= 1;
    }
  }

  return feedback;
}
