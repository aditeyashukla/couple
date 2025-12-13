import { useEffect, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase/config";
import type { Game } from "../types/game";

export function useGame(gameCode: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSnapshotRef = useRef<Game | null>(null);

  useEffect(() => {
    let mounted = true;
    const gameRef = ref(db, `games/${gameCode}`);
    setLoading((prev) => (prev ? prev : !lastSnapshotRef.current));

    const unsubscribe = onValue(
      gameRef,
      (snap) => {
        if (!mounted) return;
        const next = snap.exists() ? (snap.val() as Game) : null;
        lastSnapshotRef.current = next;
        setGame(next);
        setLoading(false);
      },
      (err) => {
        console.warn(err);
        if (!mounted) return;
        // Keep rendering the last good state instead of flickering to loading/null.
        setGame(lastSnapshotRef.current);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [gameCode]);

  return { game, loading };
}
