import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
};

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: Props) {
  const isDisabled = !!disabled || !!loading;
  const bg = variant === "primary" ? "bg-pairGreen" : "bg-appBorder";
  const opacity = isDisabled ? "opacity-50" : "opacity-100";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`w-full rounded-xl py-3 items-center justify-center ${bg} ${opacity}`}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-appText font-semibold text-base">{title}</Text>
      )}
    </Pressable>
  );
}
