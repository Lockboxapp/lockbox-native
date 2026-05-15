import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme as NavTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { darkTheme, lightTheme } from '@/constants/theme';
import { AuthProvider } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may have already been hidden — safe to ignore.
});

export const unstable_settings = {
  anchor: '(tabs)',
};

function buildNavTheme(isDark: boolean): NavTheme {
  const base = isDark ? DarkTheme : DefaultTheme;
  const t = isDark ? darkTheme : lightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: t.colors.accent,
      background: t.colors.background,
      card: t.colors.surface,
      text: t.colors.text,
      border: t.colors.border,
      notification: t.colors.accent,
    },
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={buildNavTheme(isDark)}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="banker-chat" options={{ headerShown: false }} />
          <Stack.Screen
            name="keyholder-requests"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="keyholder-request-detail"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="owner-requests"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="new-box"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="box-detail"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="deposit"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="transfer"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="request-unlock"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="change-protection"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="keyholders"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="new-keyholder"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </AuthProvider>
  );
}
