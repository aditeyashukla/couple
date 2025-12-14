import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HelpCircle } from "lucide-react-native";

import { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { HowToPlayModal } from "../components/HowToPlayModal";
import { createGame, joinGame } from "../firebase/gameApi";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { ErrorBanner } from "../components/ErrorBanner";

type Props = NativeStackScreenProps<RootStackParamList, "Landing">;

export default function LandingScreen({ navigation }: Props) {
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [hideHowTo, setHideHowTo] = useState(false);

  useEffect(() => {
    (async () => {
      const savedCode = await AsyncStorage.getItem(STORAGE_KEYS.gameCode);
      const savedRole = await AsyncStorage.getItem(STORAGE_KEYS.playerRole);
      const hide = await AsyncStorage.getItem(STORAGE_KEYS.hideHowToPlay);

      const shouldHide = hide === "true";
      setHideHowTo(shouldHide);
      if (!shouldHide) setShowHowTo(true);

      if (savedCode && savedRole) {
        navigation.replace("Game", { gameCode: savedCode });
      }
    })();
  }, [navigation]);

  const onCreate = async () => {
    setErrorMessage(null);
    setCreating(true);
    try {
      const { gameCode, role } = await createGame();
      await AsyncStorage.setItem(STORAGE_KEYS.gameCode, gameCode);
      await AsyncStorage.setItem(STORAGE_KEYS.playerRole, role);
      navigation.navigate("Game", { gameCode });
    } catch (e: any) {
      setErrorMessage(e?.message ?? "Could not create game. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const onJoin = async () => {
    const code = joinCode.replace(/\D/g, "").slice(0, 4);
    setErrorMessage(null);

    if (code.length !== 4) {
      setErrorMessage("Enter a 4-digit game code.");
      return;
    }

    setJoining(true);
    try {
      const role = await joinGame(code);
      await AsyncStorage.setItem(STORAGE_KEYS.gameCode, code);
      await AsyncStorage.setItem(STORAGE_KEYS.playerRole, role);
      navigation.navigate("Game", { gameCode: code });
    } catch (e: any) {
      const msg = e?.message ?? "Could not join game. Try again.";
      setErrorMessage(msg);
      console.log("Could not join game", msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <View className="flex-1 bg-appBg px-6 pt-16">
      <HowToPlayModal
        visible={showHowTo}
        onClose={() => setShowHowTo(false)}
        defaultDontShowAgain={hideHowTo}
        onDontShowAgainChange={async (val) => {
          setHideHowTo(val);
          await AsyncStorage.setItem(STORAGE_KEYS.hideHowToPlay, val ? "true" : "false");
        }}
      />

      <View className="mb-10 items-center">
        <Text className="text-appText text-4xl font-dmsansBold tracking-widest text-center">COUPLE</Text>
        <Text className="text-appTextSecondary font-dmsans mt-2 text-base text-center">
          Cooperative Wordle — converge on the same 5‑letter word together.
        </Text>
      </View>

      <PrimaryButton title="Create Game" onPress={onCreate} loading={creating} />

      <View className="my-10">
        <Text className="text-appTextSecondary font-dmsans text-center">OR</Text>
      </View>

      <View className="bg-appSurface rounded-2xl p-4 border border-appBorder">
        <Text className="text-appTextSecondary font-dmsans mb-2">Join with code</Text>
        <TextInput
          value={joinCode}
          onChangeText={(t) => {
            if (errorMessage) setErrorMessage(null);
            setJoinCode(t.replace(/\D/g, "").slice(0, 4));
          }}
          placeholder="1234"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={4}
          className="text-appText text-2xl font-dmsansBold tracking-widest text-center py-3 border border-appBorder rounded-xl mb-4"
        />
        <PrimaryButton
          title="Join Game"
          onPress={onJoin}
          loading={joining}
          disabled={joinCode.length !== 4}
        />
      </View>

      {errorMessage ? (
        <View className="mt-6 mb-2">
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        </View>
      ) : null}

      <Pressable onPress={() => setShowHowTo(true)} className="mt-6 flex-row items-center justify-center">
        <HelpCircle size={18} color="#818384" />
        <Text className="text-appTextSecondary font-dmsans ml-2">How to Play</Text>
      </Pressable>

      <View className="mt-10 items-end">
        <Text className="text-appTextSecondary font-dmsans text-right">Made by Aditeya Shukla, 2025</Text>
      </View>
    </View>
  );
}
