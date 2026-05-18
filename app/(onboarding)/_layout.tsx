// ============================================================
// app/(onboarding)/_layout.tsx
//
// Onboarding shell. Wraps the funnel in OnboardingProvider,
// paints the themed background, and renders a shared header
// (LockBox wordmark + ProgressDots). No tab navigation.
//
// Two screens opt out of the shared header:
//   - welcome    — logo only, no dots (spec Screen 1)
//   - locked-in  — inverted forest-green full-bleed (spec Screen 8)
// ============================================================

import { Stack, usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { OnboardingProvider } from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';

// Dotted steps, in funnel order. Welcome + locked-in are absent
// by design — neither shows a progress indicator.
const STEP_ORDER = [
  'intent',
  'signup',
  'protect',
  'lock',
  'verify',
  'link-bank',
] as const;

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <OnboardingShell />
    </OnboardingProvider>
  );
}

function OnboardingShell() {
  const t = useTheme();
  const pathname = usePathname();
  const route = pathname.split('/').filter(Boolean).pop() ?? 'welcome';

  const isLockedIn = route === 'locked-in';
  const isWelcome = route === 'welcome';
  const stepIndex = STEP_ORDER.indexOf(route as (typeof STEP_ORDER)[number]);

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      {/* locked-in paints its own inverted full-bleed screen. */}
      {!isLockedIn ? (
        <SafeAreaView edges={['top']}>
          <View style={[styles.header, { paddingHorizontal: t.spacing.xl }]}>
            <Text
              style={[
                t.typography.title,
                { color: t.colors.text, fontFamily: t.fontFamily.serif },
              ]}
            >
              LockBox
            </Text>
            {!isWelcome && stepIndex >= 0 ? (
              <View style={{ marginTop: t.spacing.md }}>
                <ProgressDots current={stepIndex + 1} total={STEP_ORDER.length} />
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      ) : null}

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.colors.background },
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="intent" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="protect" />
        <Stack.Screen name="lock" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="link-bank" />
        <Stack.Screen name="locked-in" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 8,
  },
});
