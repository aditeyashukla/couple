import React from "react";
import { Text, View } from "react-native";
import type { FeedbackColor } from "../types/game";

type Props = {
  word?: string;
  feedback?: FeedbackColor[];
  hidden?: boolean;
  placeholderChar?: string;
};

export function FeedbackBoxes({ word = "", feedback, hidden = false, placeholderChar }: Props) {
  const letters = word.toUpperCase().padEnd(5).slice(0, 5).split("");
  const placeholder = placeholderChar ? placeholderChar.slice(0, 1).toUpperCase() : "";

  return (
    <View className="flex-row">
      {Array.from({ length: 5 }, (_, i) => {
        const f = feedback?.[i];
        const colorClass =
          f === "green"
            ? "bg-pairGreen border-pairGreen"
            : f === "yellow"
            ? "bg-pairYellow border-pairYellow"
            : f === "grey"
            ? "bg-pairGrey border-pairGrey"
            : "bg-transparent border-appBorder";

        return (
          <View
            key={i}
            className={`w-11 h-11 mr-2 border-2 rounded-md items-center justify-center ${colorClass}`}
          >
            <Text className="text-appText font-bold text-lg">
              {hidden ? placeholder : letters[i]?.trim() ?? ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
