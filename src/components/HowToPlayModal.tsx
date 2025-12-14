import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { X } from "lucide-react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  defaultDontShowAgain?: boolean;
  onDontShowAgainChange?: (val: boolean) => void;
};

export function HowToPlayModal({
  visible,
  onClose,
  defaultDontShowAgain = false,
  onDontShowAgainChange,
}: Props) {
  const [dontShow, setDontShow] = useState(defaultDontShowAgain);

  useEffect(() => {
    setDontShow(defaultDontShowAgain);
  }, [defaultDontShowAgain, visible]);

  const toggle = () => {
    const next = !dontShow;
    setDontShow(next);
    onDontShowAgainChange?.(next);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-appSurface rounded-t-3xl px-6 pt-6 pb-10 border-t border-appBorder">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-appText text-xl font-dmsansBold">How to Play couple</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color="#ffffff" />
            </Pressable>
          </View>

          <Text className="text-appTextSecondary font-dmsans mb-4">
            Two players guess at the same time. You can’t see each other’s words — only the feedback that compares them.
            Your goal is to submit the same 5‑letter word within 10 turns.
          </Text>

          <View className="mb-4">
            <Text className="text-appText font-dmsansBold mb-2">Rules</Text>
            <Text className="text-appTextSecondary font-dmsans mb-1">🔁 You can only reuse the same word up to 3 times in a game.</Text>
          </View>

          <View className="mb-4">
            <Text className="text-appText font-dmsansBold mb-2">Feedback colors</Text>
            <Text className="text-appTextSecondary font-dmsans mb-1">🟩 Green — letter matches at the same position</Text>
            <Text className="text-appTextSecondary font-dmsans mb-1">🟨 Yellow — letter exists in both, different positions</Text>
            <Text className="text-appTextSecondary font-dmsans mb-1">⬜ Grey — letter is only in one word</Text>
          </View>

          <View className="mb-6">
            <Text className="text-appText font-dmsansBold mb-2">Win / Lose</Text>
            <Text className="text-appTextSecondary font-dmsans mb-1">🎉 Win — both submit the same word</Text>
            <Text className="text-appTextSecondary font-dmsans mb-1">😔 Lose — 10 turns without matching</Text>
          </View>

          <Pressable onPress={toggle} className="flex-row items-center mb-6">
            <View
              className={`w-6 h-6 rounded-md border border-appBorder mr-3 items-center justify-center ${
                dontShow ? "bg-pairGreen" : "bg-transparent"
              }`}
            >
              {dontShow ? <Text className="text-appText font-dmsansBold">✓</Text> : null}
            </View>
            <Text className="text-appTextSecondary font-dmsans">Don’t show this again</Text>
          </Pressable>

          <Pressable onPress={onClose} className="bg-pairGreen rounded-xl py-3 items-center">
            <Text className="text-appText font-dmsansBold text-base">Start Playing</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
