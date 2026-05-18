// ============================================================
// app/(onboarding)/lock.tsx — Screen 5
//
// Lock-type selection. This is the ONLY screen that creates the
// box: intent, amount, target date, and name were all held in
// OnboardingContext so a single POST /api/boxes fires here with
// the full picture — no orphan boxes with no lock type.
//
// On "Lock it in":
//   1. POST /api/boxes               — creates the box, returns id
//   2. PostHog `box_created`         — enriched onboarding props
//   3. POST /api/onboarding/analytics — fire-and-forget funnel sync
//
// NOTE: /api/onboarding/analytics does not yet exist on
// lockbox-ui. It is fired fire-and-forget so a 404 never blocks
// the funnel; it starts succeeding once the backend sprint lands.
// ============================================================

import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/onboarding/FadeIn';
import {
  LockTypeCard,
  type LockAccordion,
} from '@/components/onboarding/LockTypeCard';
import { ActionButton } from '@/components/ui';
import { useOnboarding, type OnboardingLockType } from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/services/analytics';
import { ApiError, api } from '@/services/api';

type LockOption = {
  lockType: OnboardingLockType;
  title: string;
  description: string;
  caveat: string;
  accordions: LockAccordion[];
  mostEffective?: boolean;
};

const LOCK_OPTIONS: LockOption[] = [
  {
    lockType: 'SOFT',
    title: 'Flexible protection',
    description:
      'You can move money out when you need to. Best for goals you want to stay honest about — but life happens.',
    caveat: 'Easiest to override. Relies on your discipline.',
    accordions: [
      {
        question: 'What happens if I need the money?',
        answer:
          'You can withdraw anytime. No approval needed. No waiting period.',
      },
    ],
  },
  {
    lockType: 'HARD',
    title: 'Serious protection',
    description:
      'Money stays locked until your target date — unless you intentionally choose to unlock it. No impulse access.',
    caveat: "Harder to undo. That's the point.",
    mostEffective: true,
    accordions: [
      {
        question: 'What happens if I need the money?',
        answer:
          'You can request an unlock, but it requires deliberate action — not a single tap. That friction is intentional.',
      },
      {
        question: 'Can I change this later?',
        answer: 'Yes, from your box settings. But it takes effort by design.',
      },
    ],
  },
  {
    lockType: 'KEYHOLDER',
    title: 'Accountable protection',
    description:
      "Someone you trust must approve any early withdrawal. They don't control your money — they just hold the key.",
    caveat: 'You can invite your keyholder in the next step.',
    accordions: [
      {
        question: 'How does a keyholder work?',
        answer:
          'You invite someone by phone or email. They get notified if you request early access. Their approval is required before anything moves.',
      },
      {
        question: 'What authority does my keyholder have?',
        answer:
          "None over your money directly. They can only approve or deny your unlock requests. That's it.",
      },
    ],
  },
];

export default function LockScreen() {
  const t = useTheme();
  const { state, patch, eventProps, secondsSinceSignup } = useOnboarding();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLockItIn() {
    if (submitting) return;

    // The box already exists — the user swiped back from a later
    // screen. Don't create a second one; just move forward.
    if (state.boxId != null) {
      router.push('/(onboarding)/verify');
      return;
    }

    const lockType = state.lockType;
    if (lockType == null) return;

    setSubmitting(true);
    setError(null);
    try {
      const box = await api.boxes.create({
        name: state.boxName || 'My Box',
        lockType,
        targetAmountCents:
          state.amount != null ? Math.round(state.amount * 100) : undefined,
        targetDate: state.targetDate
          ? state.targetDate.toISOString()
          : undefined,
      });
      patch({ boxId: box.id });

      track('box_created', { ...eventProps(), boxId: box.id });

      // Funnel analytics — fire-and-forget. A failure (or the
      // endpoint not existing yet) must never block the user.
      api.onboarding
        .analytics({
          onboardingIntent: state.intent,
          lockTypeSelected: lockType,
          targetDateSet: state.targetDate != null,
          onboardingSource: 'organic',
          onboardingVersion: 'v2',
          timeToReachLockScreen: secondsSinceSignup(),
        })
        .catch(() => {});

      setSubmitting(false);
      // Every lock type proceeds to identity verification. The
      // KEYHOLDER invitation flow is a later screen — not in scope
      // for this sprint's eight-screen funnel.
      router.push('/(onboarding)/verify');
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "We couldn't create your box. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={[styles.body, { paddingHorizontal: t.spacing.xl }]}>
        <FadeIn delay={40}>
          <Text style={[t.typography.h1, { color: t.colors.text }]}>
            How do you want to protect it?
          </Text>
          <Text
            style={[
              t.typography.body,
              { color: t.colors.textMuted, marginTop: t.spacing.sm },
            ]}
          >
            This is how LockBox helps protect your commitment.
          </Text>
        </FadeIn>

        <FlatList
          style={styles.list}
          data={LOCK_OPTIONS}
          keyExtractor={(o) => o.lockType}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeIn delay={120 + index * 70}>
              <LockTypeCard
                lockType={item.lockType}
                title={item.title}
                description={item.description}
                caveat={item.caveat}
                accordions={item.accordions}
                mostEffective={item.mostEffective}
                selected={state.lockType === item.lockType}
                onSelect={() => patch({ lockType: item.lockType })}
              />
            </FadeIn>
          )}
        />

        {error ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: t.colors.badge.dangerBg },
            ]}
          >
            <Text
              style={[t.typography.body, { color: t.colors.badge.dangerText }]}
            >
              {error}
            </Text>
          </View>
        ) : null}

        <ActionButton
          title="Lock it in"
          onPress={onLockItIn}
          disabled={state.lockType == null || submitting}
          fullWidth
          trailing={
            submitting ? (
              <ActivityIndicator size="small" color={t.colors.onAccent} />
            ) : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 8,
  },
  errorBox: {
    borderRadius: 12,
    padding: 12,
  },
});
