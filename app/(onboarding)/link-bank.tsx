// ============================================================
// app/(onboarding)/link-bank.tsx — Screen 7
//
// Bank linking via the native Plaid Link sheet. The box already
// exists (Screen 5) — this screen funds it.
//
// Connect flow:
//   1. POST /api/plaid/create-link-token — short-lived Link token
//   2. Plaid Link sheet opens (react-native-plaid-link-sdk)
//   3. on success → POST /api/plaid/link-complete exchanges the
//      public token; server stores the access token
//
// Skipping is neutral, never guilt-framed — a skipped link is
// caught later by the dashboard funding nudge, not blocked here.
//
// NOTE: the Plaid endpoints do not yet exist on lockbox-ui. The
// screen is built to the documented contract; the connect path
// surfaces a real error and lets the user retry.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { create, open } from 'react-native-plaid-link-sdk';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/onboarding/FadeIn';
import { ActionButton } from '@/components/ui';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/services/analytics';
import { ApiError, api } from '@/services/api';

const TRUST_POINTS = [
  'Connect securely with Plaid — your credentials are never stored by LockBox.',
  "We won't move any money until you authorize it.",
  'Takes about 60 seconds.',
];

export default function LinkBankScreen() {
  const t = useTheme();
  const { state, patch, eventProps } = useOnboarding();

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const boxName = state.boxName || 'box';

  function onSkip() {
    patch({ bankLinkSkipped: true });
    track('bank_link_skipped', { ...eventProps() });
    // Persist the skip timestamp — fire-and-forget so the skip
    // stays instant even if the endpoint is unavailable.
    api.users
      .patch({ skippedBankLinkAt: new Date().toISOString() })
      .catch(() => {});
    router.push('/(onboarding)/locked-in');
  }

  async function onConnect() {
    if (connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const { linkToken } = await api.plaid.createLinkToken();
      create({ token: linkToken });
      open({
        onSuccess: async (success) => {
          try {
            await api.plaid.linkComplete({ publicToken: success.publicToken });
          } catch (e) {
            // Plaid Link succeeded but the token exchange failed —
            // the bank is not actually linked. Let the user retry.
            setError(
              e instanceof ApiError
                ? e.message
                : 'We connected to your bank but could not finish setup. Please try again.',
            );
            setConnecting(false);
            return;
          }
          patch({ bankLinked: true });
          track('bank_linked', { ...eventProps(), bankLinked: true });
          setConnecting(false);
          router.push('/(onboarding)/locked-in');
        },
        onExit: () => setConnecting(false),
      });
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "We couldn't start the bank connection. Please try again.",
      );
      setConnecting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={[styles.root, { paddingHorizontal: t.spacing.xl }]}>
        <View style={styles.hero}>
          <FadeIn delay={60}>
            <View
              style={[
                styles.bankBadge,
                { backgroundColor: t.colors.surfaceAccent },
              ]}
            >
              <Ionicons name="business" size={42} color={t.colors.accent} />
            </View>
          </FadeIn>

          <FadeIn delay={160}>
            <Text
              style={[t.typography.h1, styles.centerText, { color: t.colors.text }]}
            >
              Connect your bank to fund your {boxName}.
            </Text>
          </FadeIn>

          <FadeIn delay={240}>
            <Text
              style={[
                t.typography.body,
                styles.centerText,
                { color: t.colors.textMuted },
              ]}
            >
              Your {boxName} is set up. Now let&rsquo;s put real money in it.
            </Text>
          </FadeIn>

          <FadeIn delay={320} style={styles.trustCardWrap}>
            <View
              style={[
                styles.trustCard,
                {
                  backgroundColor: t.colors.surfaceSubtle,
                  borderRadius: t.radius.lg,
                  padding: t.spacing.lg,
                },
              ]}
            >
              {TRUST_POINTS.map((point) => (
                <View key={point} style={styles.trustRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={t.colors.accent}
                    style={styles.trustIcon}
                  />
                  <Text
                    style={[
                      t.typography.caption,
                      styles.trustText,
                      { color: t.colors.textMuted },
                    ]}
                  >
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          </FadeIn>
        </View>

        <FadeIn delay={400} style={styles.footer}>
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
            title="Connect my bank"
            onPress={onConnect}
            disabled={connecting}
            fullWidth
            trailing={
              connecting ? (
                <ActivityIndicator size="small" color={t.colors.onAccent} />
              ) : undefined
            }
          />
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.skipLink}
          >
            <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
              I&rsquo;ll do this later
            </Text>
          </Pressable>
        </FadeIn>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
    paddingBottom: 24,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  bankBadge: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 340,
  },
  trustCardWrap: {
    alignSelf: 'stretch',
  },
  trustCard: {
    gap: 10,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  trustIcon: {
    marginTop: 1,
  },
  trustText: {
    flex: 1,
  },
  footer: {
    gap: 14,
  },
  errorBox: {
    borderRadius: 12,
    padding: 12,
  },
  skipLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
});
