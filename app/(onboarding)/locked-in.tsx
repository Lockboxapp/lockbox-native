// ============================================================
// app/(onboarding)/locked-in.tsx — Screen 8
//
// The delight moment. The one inverted screen: forest-green
// full-bleed, cream text. A lock animates shut on mount, the
// box is confirmed, and a single CTA leaves onboarding.
//
// No upsell, no tour, no notification prompt — one action only.
//
// On mount: POST /api/onboarding/complete and PostHog
// `onboarding_completed`. The CTA uses router.replace so the
// user cannot navigate back into the funnel.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { FadeIn } from '@/components/onboarding/FadeIn';
import {
  emojiForIntent,
  useOnboarding,
  type OnboardingLockType,
} from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/services/analytics';
import { api } from '@/services/api';

// Translucent layers for the inverted screen. Fixed brand tones
// (not theme-mode dependent) — Screen 8 looks the same in light
// and dark, so they live here rather than in the palette.
const CARD_SURFACE = 'rgba(255,255,255,0.09)';
const HAIRLINE = 'rgba(247,243,235,0.20)';
const MUTED_CREAM = 'rgba(247,243,235,0.74)';

const LOCK_LABEL: Record<OnboardingLockType, string> = {
  SOFT: 'Flexible protection',
  HARD: 'Serious protection',
  KEYHOLDER: 'Accountable protection',
};

const LOCK_BODY: Record<OnboardingLockType, string> = {
  SOFT: 'Your money is protected. You set the rules.',
  HARD: "Your money is locked. That's exactly the point.",
  KEYHOLDER:
    'Your money is protected. Your keyholder keeps you accountable.',
};

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
});

export default function LockedInScreen() {
  const t = useTheme();
  const { state, eventProps } = useOnboarding();

  const [locked, setLocked] = useState(false);
  const scale = useSharedValue(0.6);

  // Fire completion once. eventProps is stable on this screen
  // (no state changes after mount), so this runs a single time.
  useEffect(() => {
    api.onboarding.complete().catch(() => {});
    track('onboarding_completed', { ...eventProps() });
  }, [eventProps]);

  // Lock snaps shut on mount: grow in, overshoot, settle. The
  // glyph swaps open → closed at the overshoot for the "click".
  useEffect(() => {
    scale.value = withSequence(
      withTiming(1, { duration: 260 }),
      withSpring(1.16, { damping: 5, stiffness: 150 }),
      withSpring(1, { damping: 9 }),
    );
    const id = setTimeout(() => setLocked(true), 300);
    return () => clearTimeout(id);
  }, [scale]);

  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const boxName = state.boxName || 'Your box';
  const emoji = emojiForIntent(state.intent);
  const amountLabel =
    state.amount != null ? `$${state.amount.toLocaleString('en-US')}` : null;
  const lockType = state.lockType;
  const dateLabel = state.targetDate
    ? `By ${dateFmt.format(state.targetDate)}`
    : null;
  const metaLine = lockType
    ? LOCK_LABEL[lockType] + (dateLabel ? `  ·  ${dateLabel}` : '')
    : dateLabel;
  const bodyCopy = lockType ? LOCK_BODY[lockType] : null;

  function onFinish() {
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.fill, { backgroundColor: t.palette.forest }]}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={[styles.content, { paddingHorizontal: t.spacing.xl }]}>
          <View style={styles.hero}>
            <Animated.View
              style={[
                lockStyle,
                styles.lockBadge,
                { backgroundColor: t.palette.cream },
              ]}
            >
              <Ionicons
                name={locked ? 'lock-closed' : 'lock-open'}
                size={44}
                color={t.palette.forest}
              />
            </Animated.View>

            <FadeIn delay={260}>
              <Text style={[t.typography.display, styles.centerText, { color: t.palette.cream }]}>
                You&rsquo;re locked in.
              </Text>
            </FadeIn>

            <FadeIn delay={340}>
              <Text style={[t.typography.body, styles.centerText, { color: MUTED_CREAM }]}>
                {boxName} is ready.
              </Text>
            </FadeIn>

            <FadeIn delay={420} style={styles.cardWrap}>
              <View style={[styles.card, { borderRadius: t.radius.xl }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>{emoji}</Text>
                  <Text style={[t.typography.h2, { color: t.palette.cream }]}>
                    {boxName}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: t.palette.forestTintLight },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: t.palette.forestDeep },
                      ]}
                    />
                    <Text
                      style={[
                        t.typography.eyebrow,
                        { color: t.palette.forestDeep },
                      ]}
                    >
                      Active
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: HAIRLINE }]} />

                {amountLabel ? (
                  <Text style={[styles.amount, { color: t.palette.cream, fontFamily: t.fontFamily.mono }]}>
                    {amountLabel}
                  </Text>
                ) : null}
                {metaLine ? (
                  <Text style={[t.typography.caption, { color: MUTED_CREAM }]}>
                    {metaLine}
                  </Text>
                ) : null}
              </View>
            </FadeIn>

            {bodyCopy ? (
              <FadeIn delay={500}>
                <Text style={[t.typography.body, styles.centerText, { color: MUTED_CREAM }]}>
                  {bodyCopy}
                </Text>
              </FadeIn>
            ) : null}
          </View>

          <FadeIn delay={580} style={styles.footer}>
            <Pressable
              onPress={onFinish}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: t.palette.cream,
                  borderRadius: t.radius.lg,
                },
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Text style={[t.typography.bodyStrong, { color: t.palette.forest }]}>
                Go to my dashboard
              </Text>
            </Pressable>

            {state.kycSkipped ? (
              <NudgeLink
                label="Verify your identity to unlock full features"
                onPress={onFinish}
              />
            ) : null}
            {state.bankLinkSkipped ? (
              <NudgeLink
                label="Connect your bank to fund your box"
                onPress={onFinish}
              />
            ) : null}
          </FadeIn>
        </View>
      </SafeAreaView>
    </View>
  );
}

function NudgeLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      style={styles.nudge}
    >
      <Text style={[t.typography.label, { color: MUTED_CREAM }]}>{label}</Text>
      <Ionicons name="arrow-forward" size={14} color={MUTED_CREAM} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 24,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  lockBadge: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 330,
  },
  cardWrap: {
    alignSelf: 'stretch',
  },
  card: {
    backgroundColor: CARD_SURFACE,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  cardHeader: {
    alignItems: 'center',
    gap: 8,
  },
  cardEmoji: {
    fontSize: 34,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  cardDivider: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  amount: {
    fontSize: 34,
    letterSpacing: -0.5,
  },
  footer: {
    gap: 14,
  },
  cta: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 2,
  },
});
