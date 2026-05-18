// ============================================================
// app/(onboarding)/welcome.tsx — Screen 1
//
// One idea: your money is safe from yourself. No carousel, no
// feature list. A large padlock, a serif headline, one CTA.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FadeIn } from '@/components/onboarding/FadeIn';
import { ActionButton } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export default function WelcomeScreen() {
  const t = useTheme();
  return (
    <View style={[styles.root, { paddingHorizontal: t.spacing.xl }]}>
      <View style={styles.hero}>
        <FadeIn delay={60}>
          <View
            style={[
              styles.lockBadge,
              { backgroundColor: t.colors.surfaceAccent },
            ]}
          >
            <Ionicons name="lock-closed" size={44} color={t.colors.accent} />
          </View>
        </FadeIn>

        <FadeIn delay={160}>
          <Text style={[t.typography.display, styles.headline, { color: t.colors.text }]}>
            Your money is safe here. From yourself.
          </Text>
        </FadeIn>

        <FadeIn delay={240}>
          <Text style={[t.typography.body, styles.subtext, { color: t.colors.textMuted }]}>
            LockBox helps you lock money away so it&rsquo;s there when it
            matters — rent, bills, emergencies. Not just saved. Locked.
          </Text>
        </FadeIn>
      </View>

      <FadeIn delay={320} style={styles.footer}>
        <ActionButton
          title="Get started"
          onPress={() => router.push('/(onboarding)/intent')}
          fullWidth
        />
        <Text
          style={[
            t.typography.caption,
            styles.trustLine,
            { color: t.colors.textMuted },
          ]}
        >
          Bank-level security. No hidden fees. Your money stays yours.
        </Text>
        <Pressable
          onPress={() => router.push('/login')}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.signinLink}
        >
          <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
            Already have an account?{' '}
            <Text style={{ color: t.colors.accent, fontFamily: t.fontFamily.sansSemiBold }}>
              Sign in
            </Text>
          </Text>
        </Pressable>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingBottom: 24,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  lockBadge: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    textAlign: 'center',
  },
  subtext: {
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    gap: 14,
  },
  trustLine: {
    textAlign: 'center',
  },
  signinLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
});
