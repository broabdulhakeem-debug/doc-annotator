import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DocumentsProvider } from "@/context/DocumentsContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <DocumentsProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <Stack
                  screenOptions={{
                    headerStyle: { backgroundColor: Colors.light.headerBackground },
                    headerTintColor: Colors.light.headerText,
                    headerTitleStyle: {
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 17,
                    },
                    headerBackTitle: "Back",
                    contentStyle: { backgroundColor: Colors.light.background },
                  }}
                >
                  <Stack.Screen
                    name="index"
                    options={{
                      title: "Documents",
                      headerLargeTitle: true,
                      headerLargeTitleStyle: {
                        fontFamily: "Inter_700Bold",
                        color: Colors.light.headerText,
                      },
                    }}
                  />
                  <Stack.Screen
                    name="document/[id]"
                    options={{
                      title: "",
                      headerTransparent: true,
                      headerBlurEffect: "dark",
                    }}
                  />
                  <Stack.Screen
                    name="new-document"
                    options={{
                      presentation: "formSheet",
                      sheetAllowedDetents: [0.4],
                      sheetGrabberVisible: true,
                      title: "New Document",
                      headerShown: false,
                    }}
                  />
                </Stack>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </DocumentsProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
