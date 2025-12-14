import "./global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {  } from '@expo-google-fonts/dm-sans'
import { useFonts, DMSans_400Regular, DMSans_700Bold } from "@expo-google-fonts/dm-sans";

import LandingScreen from "./src/screens/LandingScreen";
import GameScreen from "./src/screens/GameScreen";
import type { RootStackParamList } from "./src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const APP_TITLE = "Couple - a cooperative Wordle";

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#121213",
    card: "#1a1a1b",
    text: "#ffffff",
    border: "#3a3a3c",
    primary: "#6aaa64",
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_700Bold,
  });
  if (fontError) {
    console.warn("Failed to load DM Sans fonts; using system fallback.", fontError);
  }
  void fontsLoaded;

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={navTheme}
        documentTitle={{
          formatter: () => APP_TITLE,
        }}
      >
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false, title: APP_TITLE }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
