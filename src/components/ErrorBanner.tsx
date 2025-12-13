import React from "react";
import { Pressable, Text, View } from "react-native";
import { AlertCircle, X } from "lucide-react-native";

type Props = {
  message?: string | null;
  onDismiss?: () => void;
};

export function ErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null;

  return (
    <View className="self-start flex-row items-center px-1 py-1">
      <AlertCircle size={18} color="#c9b458" />
      <Text className="ml-2" style={{ color: "#c9b458", flexShrink: 1 }}>
        {message}
      </Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <X size={16} color="#c9b458" />
        </Pressable>
      ) : null}
    </View>
  );
}
