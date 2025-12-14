import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Copy, PlusCircle, RotateCcw } from "lucide-react-native";

import { RootStackParamList } from "../navigation/types";
import { useGame } from "../hooks/useGame";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { MAX_WORD_REUSES_PER_PLAYER } from "../constants/gameRules";
import type { PlayerRole } from "../types/game";
import { sanitizeWordInput, validateWord } from "../utils/wordValidation";
import { joinGame, resetGame, submitWord } from "../firebase/gameApi";
import { TurnRow } from "../components/TurnRow";
import { PrimaryButton } from "../components/PrimaryButton";
import { ErrorBanner } from "../components/ErrorBanner";

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

export default function GameScreen({ route, navigation }: Props) {
  const { gameCode } = route.params;
  const { game, loading } = useGame(gameCode);

  const [role, setRole] = useState<PlayerRole | null>(null);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.gameCode, gameCode);
      const savedRole = (await AsyncStorage.getItem(STORAGE_KEYS.playerRole)) as PlayerRole | null;

      if (savedRole === "playerA" || savedRole === "playerB") {
        setRole(savedRole);
        return;
      }

      // If someone landed here without a saved role, try to join as playerB
      try {
        const r = await joinGame(gameCode);
        await AsyncStorage.setItem(STORAGE_KEYS.playerRole, r);
        setRole(r);
      } catch (e: any) {
        const msg = e?.message ?? "Could not join game. Try again.";
        console.log("Could not join", msg);
        setErrorMessage(msg);
      }
    })();
  }, [gameCode]);

  const opponentRole = role === "playerA" ? "playerB" : "playerA";

  const currentTurnKey = String(game?.currentTurn ?? 1);
  const myTurnData = role && game?.turns?.[currentTurnKey]?.[role];
  const oppTurnData = role && game?.turns?.[currentTurnKey]?.[opponentRole];

  const mySubmitted = !!myTurnData?.submitted;
  const oppSubmitted = !!oppTurnData?.submitted;

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [game?.currentTurn, game?.turns]);

  const countWordUsesByMe = (candidate: string) => {
    if (!role || !game?.turns) return 0;
    const normalized = candidate.toUpperCase();
    return Object.values(game.turns).reduce((count, turn) => {
      const submission = turn?.[role];
      if (!submission?.submitted) return count;
      const submittedWord = String(submission.word || "").toUpperCase();
      return submittedWord === normalized ? count + 1 : count;
    }, 0);
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(gameCode);
    Alert.alert("Copied", `Game code ${gameCode} copied to clipboard.`);
  };

  const onNewGame = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.gameCode, STORAGE_KEYS.playerRole]);
    navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
  };

  const onSubmit = async () => {
    if (!role || !game) {
      setErrorMessage("Still setting up the game. Try again in a moment.");
      return;
    }
    const cleaned = sanitizeWordInput(word);
    setErrorMessage(null);

    if (!validateWord(cleaned)) {
      setErrorMessage("Not a valid 5-letter word. Try another!");
      return;
    }

    const previousUses = countWordUsesByMe(cleaned);
    if (previousUses >= MAX_WORD_REUSES_PER_PLAYER) {
      setErrorMessage(`You can only use the same word ${MAX_WORD_REUSES_PER_PLAYER} times in a game.`);
      return;
    }

    setBusy(true);
    try {
      await submitWord(gameCode, role, cleaned);
      setWord("");
      setErrorMessage(null);
    } catch (e: any) {
      const msg = e?.message ?? "Could not submit word. Try again.";
      console.log("Could not submit", msg);
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  };

  const onPlayAgain = async () => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await resetGame(gameCode);
      setWord("");
    } catch (e: any) {
      const msg = e?.message ?? "Could not reset game. Try again.";
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  };

  const statusText = useMemo(() => {
    if (!game) return "";
    if (game.status === "waiting") return "Waiting for opponent…";
    if (game.status === "completed") return "Game completed";
    if (!role) return "Loading your role…";
    if (!mySubmitted) return "Your turn — enter a word";
    if (mySubmitted && !oppSubmitted) return "Waiting for opponent…";
    return "Both submitted — processing…";
  }, [game, role, mySubmitted, oppSubmitted]);

  if (loading && !game) {
    return (
      <View className="flex-1 bg-appBg items-center justify-center">
        <Text className="text-appTextSecondary font-dmsans">Loading…</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View className="flex-1 bg-appBg px-6 pt-16">
        <Text className="text-appText text-xl font-dmsansBold mb-2">Game not found</Text>
        <Text className="text-appTextSecondary font-dmsans mb-6">That code doesn’t exist (or was deleted).</Text>
        {errorMessage ? (
          <View className="mb-6">
            <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </View>
        ) : null}
        <PrimaryButton title="Back to Home" onPress={onNewGame} />
      </View>
    );
  }

  // WAITING
  if (game.status === "waiting") {
    return (
      <View className="flex-1 bg-appBg px-6 pt-16">
        <Text className="text-appText text-2xl font-dmsansBold mb-1">Waiting for opponent</Text>
        <Text className="text-appTextSecondary font-dmsans mb-8">Share this code with your friend:</Text>

        <Pressable onPress={copyCode} className="bg-appSurface border border-appBorder rounded-2xl py-6 items-center">
          <Text className="text-appText text-5xl font-dmsansBold tracking-widest">{gameCode}</Text>
          <View className="flex-row items-center mt-3">
            <Copy size={18} color="#818384" />
            <Text className="text-appTextSecondary font-dmsans ml-2">Tap to copy</Text>
          </View>
        </Pressable>

        <View className="mt-10 bg-appSurface border border-appBorder rounded-2xl p-4">
          <Text className="text-appTextSecondary font-dmsans">You are</Text>
          <Text className="text-appText text-xl font-dmsansBold mt-1">{role ? (role === "playerA" ? "Player A" : "Player B") : "…"}</Text>
          <Text className="text-appTextSecondary font-dmsans mt-2">The game starts automatically when Player B joins.</Text>
        </View>

        <View className="mt-auto mb-10">
          {errorMessage ? (
            <View>
              <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
            </View>
          ) : null}
          <Pressable onPress={onNewGame} className="mt-4 items-center">
            <Text className="text-appTextSecondary font-dmsans">Leave & start over</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const turns = Array.from({ length: Math.min(game.currentTurn, 10) }, (_, i) => i + 1);
  const canType = !!role && game.status === "active" && !mySubmitted && !busy;
  const cleanedWord = sanitizeWordInput(word);
  const readyToSubmit = cleanedWord.length === 5 && canType;

  // COMPLETED
  if (game.status === "completed") {
    return (
      <View className="flex-1 bg-appBg px-4 pt-14">
        <Text className="text-appText text-3xl font-dmsansBold text-center">
          {game.result === "win" ? "🎉 YOU WIN!" : "😔 GAME OVER"}
        </Text>

        <Text className="text-appTextSecondary font-dmsans text-center mt-2 mb-6">
          {game.result === "win"
            ? `Both found: ${game.winningWord ?? ""} in ${game.currentTurn} turns`
            : "You ran out of turns (10/10) without matching."}
        </Text>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          {turns.map((n) => (
            <TurnRow
              key={n}
              turnNumber={n}
              turn={game.turns?.[String(n)]}
              yourRole={role ?? "playerA"}
              gameEnded
            />
          ))}
        </ScrollView>

        {errorMessage ? (
          <View className="mb-4">
            <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </View>
        ) : null}

        <View className="pb-10">
          <View className="flex-row">
            <Pressable
              onPress={onPlayAgain}
              className={`flex-1 bg-pairGreen rounded-xl py-3 flex-row items-center justify-center ${busy ? "opacity-50" : "opacity-100"}`}
              disabled={busy}
            >
              <RotateCcw size={18} color="#ffffff" />
              <Text className="text-appText font-dmsansBold ml-2">Play Again</Text>
            </Pressable>

            <View className="w-3" />

            <Pressable
              onPress={onNewGame}
              className={`flex-1 bg-appBorder rounded-xl py-3 flex-row items-center justify-center ${busy ? "opacity-50" : "opacity-100"}`}
              disabled={busy}
            >
              <PlusCircle size={18} color="#ffffff" />
              <Text className="text-appText font-dmsansBold ml-2">New Game</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ACTIVE
  return (
    <KeyboardAvoidingView className="flex-1 bg-appBg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="px-4 pt-12 pb-3 border-b border-appBorder bg-appSurface">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={copyCode} className="flex-row items-center">
            <Text className="text-appText font-dmsansBold tracking-widest mr-2">{gameCode}</Text>
            <Copy size={16} color="#818384" />
          </Pressable>
          <Text className="text-appTextSecondary font-dmsansBold">Turn {game.currentTurn}/10</Text>
        </View>
        <Text className="text-appTextSecondary font-dmsans mt-1">
          You are {role ? (role === "playerA" ? "Player A" : "Player B") : "…"}
        </Text>
      </View>

      <View className="px-4 py-3">
        <Text className="text-appTextSecondary font-dmsans">{statusText}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 18 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {turns.map((n) => (
          <TurnRow
            key={n}
            turnNumber={n}
            turn={game.turns?.[String(n)]}
            yourRole={role ?? "playerA"}
            gameEnded={false}
          />
        ))}
      </ScrollView>

      <View className="px-4 pb-10 pt-3 border-t border-appBorder bg-appSurface">
        <View className="flex-row items-center">
          <TextInput
            value={word}
            onChangeText={(t) => {
              if (errorMessage) setErrorMessage(null);
              setWord(sanitizeWordInput(t));
            }}
            editable={canType}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={5}
            placeholder="ENTER WORD"
            placeholderTextColor="#666"
            className={`flex-1 bg-appBg border border-appBorder rounded-xl px-4 py-3 text-appText font-dmsansBold tracking-widest text-lg ${canType ? "" : "opacity-50"}`}
          />
          <Pressable
            onPress={onSubmit}
            disabled={!readyToSubmit}
            className={`ml-3 px-4 py-3 rounded-xl ${readyToSubmit ? "bg-pairGreen" : "bg-appBorder opacity-50"}`}
          >
            <Text className="text-appText font-dmsansBold">Submit</Text>
          </Pressable>
        </View>

        <Pressable onPress={onNewGame} className="mt-4 items-center">
          <Text className="text-appTextSecondary font-dmsans">Leave game</Text>
        </Pressable>

        {errorMessage ? (
          <View className="mt-3">
            <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
