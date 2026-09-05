import React, { useEffect, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "./src/context/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import { ProfileProvider } from "./src/context/ProfileContext";
import { UserPreferencesProvider } from "./src/context/UserPreferencesContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { SubscriptionProvider } from "./src/context/SubscriptionContext";
import { PlusPaywallHost } from "./src/components/plus";
import { RootNavigator } from "./src/navigation/RootNavigator";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <UserPreferencesProvider>
          <SubscriptionProvider>
            <NotificationProvider>
              <RootNavigator />
              <PlusPaywallHost />
            </NotificationProvider>
          </SubscriptionProvider>
        </UserPreferencesProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.loading, { backgroundColor: "#F4EFE6" }]}>
        <ActivityIndicator size="large" color="#C45C26" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
