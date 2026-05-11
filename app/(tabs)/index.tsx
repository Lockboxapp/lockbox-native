import { StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppCard, AppScreen, Badge, SectionHeader } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const snapshot = [
  { label: 'Total Locked', value: '$1,860' },
  { label: 'Wallet', value: '$420' },
  { label: 'Connected Balance', value: '$2,145' },
  { label: 'Next Bill Due', value: '$740' },
];

const activity = [
  { title: '+$200 added to Bills box', meta: 'Today · 9:42 AM' },
  { title: '-$35 card spend at Shell', meta: 'Yesterday · 6:14 PM' },
  { title: '$75 moved from Wallet to Rent', meta: 'Apr 26 · 11:03 AM' },
];

export default function HomeScreen() {
  const t = useTheme();

  return (
    <AppScreen>
      <SectionHeader
        eyebrow="Good morning"
        title="Home"
        subtitle="Your money at a glance, with one clear next step."
        size="page"
      />

      <AppCard>
        <View style={styles.cardHead}>
          <Text style={[t.typography.title, { color: t.colors.text }]}>Money Snapshot</Text>
          <Badge label="Live" variant="success" />
        </View>
        <View style={styles.grid}>
          {snapshot.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={[t.typography.label, { color: t.colors.textMuted }]}>{stat.label}</Text>
              <Text style={[t.typography.stat, { color: t.colors.text }]}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard tone="accent">
        <Text style={[t.typography.eyebrow, { color: t.colors.accent }]}>The Banker</Text>
        <Text style={[t.typography.h2, { color: t.colors.text }]}>Bills is short $85</Text>
        <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
          Move money today to stay on track before Friday.
        </Text>
        <View style={styles.bankerActions}>
          <ActionButton title="Move $85" />
          <ActionButton title="Ask The Banker" variant="ghost" />
        </View>
      </AppCard>

      <View style={styles.activityWrap}>
        <SectionHeader title="Recent Activity" />
        <AppCard gap={0} padding={0}>
          {activity.map((item, idx) => (
            <View
              key={item.title}
              style={[
                styles.activityRow,
                {
                  paddingHorizontal: t.spacing.lg,
                  paddingVertical: t.spacing.md + 2,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: t.colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>{item.title}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: 2 }]}>
                  {item.meta}
                </Text>
              </View>
            </View>
          ))}
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
    columnGap: 12,
  },
  stat: {
    width: '47%',
    gap: 4,
  },
  bankerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  activityWrap: {
    gap: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
