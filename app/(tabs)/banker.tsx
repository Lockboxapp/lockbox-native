import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard, AppScreen, Badge, SectionHeader } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const chat = [
  {
    role: 'banker' as const,
    text: "You’re close to covering Bills. Move $85 from Wallet today and you’re set through Friday.",
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

type InsightTone = 'success' | 'warning' | 'neutral';
type Insight = {
  label: string;
  value: string;
  note: string;
  tone: InsightTone;
  badge: string;
};

const insights: Insight[] = [
  { label: 'Income', value: '$3,200', note: 'Up $120 vs last month', tone: 'success', badge: 'On track' },
  { label: 'Locked', value: '$1,860', note: '58% of monthly income', tone: 'neutral', badge: 'Steady' },
  { label: 'Available', value: '$420', note: '$195 short of next bills', tone: 'warning', badge: 'Watch' },
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
        <SectionHeader title="Chat" trailing={<Badge label="Beta" variant="flexible" />} />
        <AppCard gap={t.spacing.sm}>
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
          <View
            style={[
              styles.input,
              {
                backgroundColor: t.colors.surfaceSubtle,
                borderColor: t.colors.border,
                marginTop: t.spacing.sm,
              },
            ]}
          >
            <Text style={[t.typography.body, { color: t.colors.textMuted, flex: 1 }]}>
              Ask The Banker anything…
            </Text>
            <View style={[styles.sendButton, { backgroundColor: t.colors.accent }]}>
              <Ionicons name="arrow-up" size={16} color={t.colors.onAccent} />
            </View>
          </View>
        </AppCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Insights" subtitle="A read on your money this month." />
        <AppCard gap={0} padding={0}>
          {insights.map((item, idx) => (
            <View
              key={item.label}
              style={[
                styles.insightRow,
                {
                  paddingHorizontal: t.spacing.lg,
                  paddingVertical: t.spacing.md + 2,
                  borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: t.colors.divider,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.label, { color: t.colors.textMuted }]}>{item.label}</Text>
                <Text style={[t.typography.stat, { color: t.colors.text, marginTop: 2 }]}>
                  {item.value}
                </Text>
                <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: 4 }]}>
                  {item.note}
                </Text>
              </View>
              <Badge label={item.badge} variant={item.tone} />
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
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
