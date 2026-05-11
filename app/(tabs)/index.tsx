import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppCard, AppScreen, Badge, SectionHeader } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const secondaryStats = [
  { label: 'Wallet', value: '$420' },
  { label: 'Connected', value: '$2,145' },
  { label: 'Next bill due', value: '$740' },
];

type Activity = { title: string; meta: string; amount: string; direction: 'in' | 'out' | 'move' };

const activity: Activity[] = [
  { title: 'Added to Bills', meta: 'Today · 9:42 AM', amount: '+$200', direction: 'in' },
  { title: 'Card spend · Shell', meta: 'Yesterday · 6:14 PM', amount: '−$35', direction: 'out' },
  { title: 'Wallet → Rent', meta: 'Apr 26 · 11:03 AM', amount: '$75', direction: 'move' },
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
        <View style={styles.snapshotHead}>
          <Text style={[t.typography.eyebrow, { color: t.colors.textMuted }]}>Total locked</Text>
          <Badge label="Live" variant="success" />
        </View>
        <Text style={[t.typography.display, { color: t.colors.text }]}>$1,860</Text>
        <Text style={[t.typography.caption, { color: t.colors.accent }]}>
          ▲ $120 vs. last month
        </Text>
        <View style={[styles.divider, { backgroundColor: t.colors.divider }]} />
        <View style={styles.secondaryRow}>
          {secondaryStats.map((stat) => (
            <View key={stat.label} style={styles.secondaryStat}>
              <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>{stat.label}</Text>
              <Text style={[t.typography.bodyStrong, { color: t.colors.text, marginTop: 2 }]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard tone="accent">
        <Text style={[t.typography.eyebrow, { color: t.colors.accent }]}>The Banker</Text>
        <Text style={[t.typography.h1, { color: t.colors.text }]}>Bills is short $85</Text>
        <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
          Move money today to stay on track before Friday.
        </Text>
        <View style={styles.bankerActions}>
          <ActionButton title="Move $85" />
          <ActionButton title="Ask The Banker" variant="ghost" />
        </View>
      </AppCard>

      <View style={styles.activityWrap}>
        <SectionHeader title="Recent activity" />
        <AppCard gap={0} padding={0}>
          {activity.map((item, idx) => (
            <View
              key={item.title}
              style={[
                styles.activityRow,
                {
                  paddingHorizontal: t.spacing.lg,
                  paddingVertical: t.spacing.md + 2,
                  borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: t.colors.divider,
                },
              ]}
            >
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: iconBg(t, item.direction) },
                ]}
              >
                <Ionicons name={iconName(item.direction)} size={14} color={iconFg(t, item.direction)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>{item.title}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: 2 }]}>
                  {item.meta}
                </Text>
              </View>
              <Text style={[t.typography.bodyStrong, { color: amountColor(t, item.direction) }]}>
                {item.amount}
              </Text>
            </View>
          ))}
        </AppCard>
      </View>
    </AppScreen>
  );
}

function iconName(direction: Activity['direction']): React.ComponentProps<typeof Ionicons>['name'] {
  switch (direction) {
    case 'in':
      return 'arrow-down';
    case 'out':
      return 'arrow-up';
    case 'move':
    default:
      return 'swap-horizontal';
  }
}

function iconBg(t: ReturnType<typeof useTheme>, direction: Activity['direction']) {
  if (direction === 'in') return t.colors.badge.successBg;
  if (direction === 'out') return t.colors.badge.dangerBg;
  return t.colors.badge.neutralBg;
}

function iconFg(t: ReturnType<typeof useTheme>, direction: Activity['direction']) {
  if (direction === 'in') return t.colors.badge.successText;
  if (direction === 'out') return t.colors.badge.dangerText;
  return t.colors.badge.neutralText;
}

function amountColor(t: ReturnType<typeof useTheme>, direction: Activity['direction']) {
  if (direction === 'in') return t.colors.accent;
  if (direction === 'out') return t.colors.text;
  return t.colors.textMuted;
}

const styles = StyleSheet.create({
  snapshotHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryStat: {
    flex: 1,
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
    gap: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
