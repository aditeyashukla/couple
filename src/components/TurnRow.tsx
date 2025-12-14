import React from "react";
import { Text, View } from "react-native";
import { Check, Clock } from "lucide-react-native";
import type { PlayerRole, TurnData } from "../types/game";
import { FeedbackBoxes } from "./FeedbackBoxes";

type Props = {
  turnNumber: number;
  turn?: TurnData;
  yourRole: PlayerRole;
  gameEnded: boolean;
};

export function TurnRow({ turnNumber, turn, yourRole, gameEnded }: Props) {
  const oppRole: PlayerRole = yourRole === "playerA" ? "playerB" : "playerA";
  const your = turn?.[yourRole];
  const opp = turn?.[oppRole];
  const oppSubmitted = !!opp?.submitted;

  return (
    <View className="mb-5">
      <Text className="text-appTextSecondary font-dmsansBold mb-2">Turn {turnNumber}</Text>

      <View className="flex-row items-center mb-2">
        <Text className="text-appTextSecondary font-dmsansBold w-14">YOU:</Text>
        <FeedbackBoxes word={your?.word} feedback={your?.feedback} />
      </View>

      <View className="flex-row items-center">
        <Text className="text-appTextSecondary font-dmsansBold w-14">THEM:</Text>

        {gameEnded ? (
          <FeedbackBoxes word={opp?.word} feedback={opp?.feedback} />
        ) : (
          <>
          <View>
            <FeedbackBoxes hidden placeholderChar={oppSubmitted ? "?" : ""} />
            <View className="mt-2 flex-row items-center">
              {oppSubmitted ? (
                <>
                  <Check size={16} color="#28a745" />
                  <Text className="text-appTextSecondary font-dmsans ml-1">Submitted</Text>
                </>
              ) : (
                <>
                  <Clock size={16} color="#ffc107" />
                  <Text className="text-appTextSecondary font-dmsans ml-1">Waiting…</Text>
                </>
              )}
            </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
