import { WORDS_5 } from "../data/words5";

/**
 * Set true when you swap in your real ~2000+ word list.
 * Kept false by default so you can test gameplay immediately.
 */
const STRICT_DICTIONARY = true;

const WORD_SET = new Set(WORDS_5.map((w) => w.toUpperCase()));

export function sanitizeWordInput(input: string): string {
  return input.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5);
}

export function validateWord(word: string): boolean {
  const w = word.toUpperCase();
  if (!/^[A-Z]{5}$/.test(w)) return false;
  if (!STRICT_DICTIONARY) return true;
  return WORD_SET.has(w);
}
