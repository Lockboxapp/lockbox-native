import { StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppCard, AppScreen, Badge, SectionHeader } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const chat = [
  {
    role: 'banker' as const,
    text: "You're close to covering Bills. Move $85 from Wallet today and you're set through Friday.",
  },
  {
    role: 'user' as const,
    text: 'What should I fund first?',
  },
  {
    role: 'banker' as const,
    text: 'Rent is auto-locked through May 1. Prioritize Utilities — it auto-pays on the 2nd.',
  },
];

const insights = [
  { label: 'Income', value: '$3,200', tone: 'success' as const },
  { label: 'Locked', value: '$1,860', tone: 'neutral' as const },
  { label: 'Available', value: '$420', tone: 'warning' as const },
];

export default function BankerScreen() {
  const t = useTheme();

  return (
    <AppScreen>
      <SectionHeader
        eyebrow="Your sidekick"
        title="The Banker"
        subtitle="Talk through decisions or review your financial signals."
        size="page"
      />

      <View style={styles.section}>
        <SectionHeader
          title="Chat"
          trailing={<Badge label="Beta" variant="flexible" />}
        />
        <AppCard>
          {chat.map((msg, idx) => {
            const isBanker = msg.role === 'banker';
            return (
              <View
                key={idx}
                style={[
                  styles.bubble,
                  {
                    alignSelf: isBanker ? 'flex-start' : 'flex-end',
                    backgroundColor: isBanker ? t.colors.surfaceAccent : t.colors.accent,
                    borderColor: isBanker ? t.colors.accentSoft : t.colors.accent,
                    borderTopLeftRadius: isBanker ? 4 : t.radius.lg,
                    borderTopRightRadius: isBanker ? t.radius.lg : 4,
                    borderBottomLeftRadius: t.radius.lg,
                    borderBottomRightRadius: t.radius.lg,
                  },
                ]}
              >
                <Text
                  style={[
                    t.typography.body,
                    { color: isBanker ? t.colors.text : t.colors.onAccent },
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            );
          })}
          <View style={styles.chatActions}>
            <ActionButton title="Open chat" fullWidth />
          </View>
        </AppCard>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Insights"
          subtitle="A read on your money this month."
        />
        <AppCard gap={0} padding={0}>
          {insights.map((item, idx) => (
            <View
              key={item.label}
              style={[
                styles.insightRow,
                {
                  paddingHorizontal: t.spacing.lg,
                  paddingVertical: t.spacing.md + 2,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: t.colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.label, { color: t.colors.textMuted }]}>{item.label}</Text>
                <Text style={[t.typography.stat, { color: t.colors.text, marginTop: 2 }]}>
                  {item.value}
                </Text>
              </View>
              <Badge label={item.tone === 'success' ? 'On track' : item.tone === 'warning' ? 'Watch' : 'Steady'} variant={item.tone} />
            </View>
          ))}
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  chatActions: {
    marginTop: 4,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
