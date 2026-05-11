// ============================================================
// app/banker-chat.tsx
//
// Placeholder full-screen Banker chat. The LLM is not wired in
// Sprint 2 — this screen exists so the tab CTAs ("Open chat" /
// "Ask The Banker") have somewhere to land instead of dead-ending.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, AppCard, Badge } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export default function BankerChatScreen() {
  const t = useTheme();
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: t.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={[styles.header, { borderBottomColor: t.colors.divider }]}>
        <Ionicons.Button
          name="chevron-back"
          backgroundColor="transparent"
          color={t.colors.text}
          iconStyle={styles.headerIcon}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        >
          <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
            Back
          </Text>
        </Ionicons.Button>
      </View>

      <View style={[styles.body, { padding: t.spacing.xl }]}>
        <View style={styles.hero}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: t.colors.surfaceAccent },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={28}
              color={t.colors.accent}
            />
          </View>
          <Text style={[t.typography.eyebrow, { color: t.colors.accent }]}>
            The Banker
          </Text>
          <Text style={[t.typography.display, { color: t.colors.text }]}>
            Chat is coming soon
          </Text>
          <Text
            style={[
              t.typography.body,
              { color: t.colors.textMuted, textAlign: 'center' },
            ]}
          >
            The Banker will help you decide what to fund, when to move money,
            and what to leave alone. We&rsquo;re wiring up the conversation
            now — your insights below are already live.
          </Text>
          <Badge label="Beta — coming soon" variant="flexible" />
        </View>

        <AppCard tone="accent">
          <Text style={[t.typography.title, { color: t.colors.text }]}>
            What chat will do
          </Text>
          <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
            • Walk you through specific money moves before you make them.{'\n'}
            • Ask whether you really need the full amount or just a transfer.{'\n'}
            • Coach you when a target date is approaching and a box is short.
          </Text>
        </AppCard>

        <View style={{ marginTop: 'auto' }}>
          <ActionButton title="Back to home" onPress={() => router.back()} fullWidth />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIcon: {
    marginRight: 4,
  },
  body: {
    flex: 1,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
