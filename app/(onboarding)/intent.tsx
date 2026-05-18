// ============================================================
// app/(onboarding)/intent.tsx — Screen 2
//
// Single-select intent. The choice seeds the first box's name
// (held in OnboardingContext — no API call here).
// ============================================================

import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/onboarding/FadeIn';
import { IntentCard } from '@/components/onboarding/IntentCard';
import { ActionButton } from '@/components/ui';
import {
  boxNameForIntent,
  useOnboarding,
  type OnboardingIntent,
} from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';

type IntentOption = {
  key: OnboardingIntent;
  emoji: string;
  label: string;
  description: string;
};

const OPTIONS: IntentOption[] = [
  {
    key: 'rent',
    emoji: '🏠',
    label: 'Rent',
    description: "Make sure it's always there before the 1st",
  },
  {
    key: 'bills',
    emoji: '🧾',
    label: 'Bills',
    description: 'Keep utilities, insurance, and subscriptions covered',
  },
  {
    key: 'savings',
    emoji: '💰',
    label: 'Savings',
    description: "Build something you won't touch",
  },
  {
    key: 'control',
    emoji: '🎯',
    label: 'Just want more control',
    description: 'Stop spending money you meant to keep',
  },
];

export default function IntentScreen() {
  const t = useTheme();
  const { state, patch } = useOnboarding();

  function select(intent: OnboardingIntent) {
    patch({ intent, boxName: boxNameForIntent(intent) });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={[styles.body, { paddingHorizontal: t.spacing.xl }]}>
        <FadeIn delay={40}>
          <Text style={[t.typography.h1, { color: t.colors.text }]}>
            What do you need to make sure is always covered?
          </Text>
          <Text
            style={[
              t.typography.body,
              { color: t.colors.textMuted, marginTop: t.spacing.sm },
            ]}
          >
            We&rsquo;ll set up your first box around this.
          </Text>
        </FadeIn>

        <FlatList
          style={styles.list}
          data={OPTIONS}
          keyExtractor={(o) => o.key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeIn delay={120 + index * 70}>
              <IntentCard
                emoji={item.emoji}
                label={item.label}
                description={item.description}
                selected={state.intent === item.key}
                onPress={() => select(item.key)}
              />
            </FadeIn>
          )}
        />

        <ActionButton
          title="Continue"
          onPress={() => router.push('/(onboarding)/signup')}
          disabled={state.intent == null}
          fullWidth
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
});
