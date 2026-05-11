import { StyleSheet, Text, View } from 'react-native';

import { AppCard, AppScreen, Badge, type BadgeVariant, SectionHeader } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const summary = [
  { label: 'Total Protected', value: '$1,860' },
  { label: 'Amount Needed', value: '$195' },
  { label: 'Box Count', value: '6' },
];

const calendar = [
  { date: 'Apr 28', name: 'Rent', status: 'Funded', variant: 'success' as const },
  { date: 'Apr 30', name: 'Bills', status: 'Partial', variant: 'warning' as const },
  { date: 'May 02', name: 'Utilities', status: 'Underfunded', variant: 'danger' as const },
];

type ProtectionType = 'Flexible' | 'Fully Locked' | 'Keyholder';

const boxes: { name: string; type: ProtectionType; progress: number; amount: string; target: string }[] = [
  { name: 'Bills', type: 'Flexible', progress: 0.82, amount: '$615', target: '$750' },
  { name: 'Rent', type: 'Fully Locked', progress: 1, amount: '$1,200', target: '$1,200' },
  { name: 'Emergency', type: 'Keyholder', progress: 0.54, amount: '$540', target: '$1,000' },
];

const protectionVariant: Record<ProtectionType, BadgeVariant> = {
  Flexible: 'flexible',
  'Fully Locked': 'locked',
  Keyholder: 'keyholder',
};

export default function BoxesScreen() {
  const t = useTheme();

  return (
    <AppScreen>
      <SectionHeader
        eyebrow="Your protection"
        title="Boxes"
        subtitle="Protect and plan your money by box."
        size="page"
      />

      <AppCard>
        <Text style={[t.typography.title, { color: t.colors.text }]}>Summary</Text>
        <View style={styles.summaryRow}>
          {summary.map((stat) => (
            <View key={stat.label} style={styles.summaryStat}>
              <Text style={[t.typography.label, { color: t.colors.textMuted }]}>{stat.label}</Text>
              <Text style={[t.typography.stat, { color: t.colors.text }]}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </AppCard>

      <View style={styles.section}>
        <SectionHeader title="Payment Calendar" />
        <AppCard gap={0} padding={0}>
          {calendar.map((item, idx) => (
            <View
              key={`${item.date}-${item.name}`}
              style={[
                styles.calendarRow,
                {
                  paddingHorizontal: t.spacing.lg,
                  paddingVertical: t.spacing.md + 2,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: t.colors.border,
                },
              ]}
            >
              <View style={styles.calendarDate}>
                <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                  {item.date.split(' ')[0]}
                </Text>
                <Text style={[t.typography.h2, { color: t.colors.text }]}>
                  {item.date.split(' ')[1]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>{item.name}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: 2 }]}>
                  Auto-pay
                </Text>
              </View>
              <Badge label={item.status} variant={item.variant} />
            </View>
          ))}
        </AppCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Your Boxes" />
        {boxes.map((box) => (
          <AppCard key={box.name}>
            <View style={styles.boxHeader}>
              <Text style={[t.typography.h2, { color: t.colors.text }]}>{box.name}</Text>
              <Badge label={box.type} variant={protectionVariant[box.type]} />
            </View>
            <View style={styles.boxMeta}>
              <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                {box.amount} of {box.target}
              </Text>
              <Text style={[t.typography.bodyStrong, { color: t.colors.accent }]}>
                {Math.round(box.progress * 100)}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: t.colors.surfaceSubtle }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(box.progress * 100)}%`,
                    backgroundColor: t.colors.accent,
                  },
                ]}
              />
            </View>
          </AppCard>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
    columnGap: 12,
  },
  summaryStat: {
    flexBasis: '30%',
    flexGrow: 1,
    gap: 4,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  calendarDate: {
    width: 48,
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boxMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
