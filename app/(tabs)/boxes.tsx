import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard, AppScreen, Badge, type BadgeVariant, SectionHeader } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const summary = [
  { label: 'Total protected', value: '$1,860' },
  { label: 'Amount needed', value: '$195', emphasize: true },
  { label: 'Box count', value: '6' },
];

type CalendarStatus = 'success' | 'warning' | 'danger';
type CalendarItem = {
  date: string;
  name: string;
  amount: string;
  status: string;
  variant: CalendarStatus;
};

const calendar: CalendarItem[] = [
  { date: 'Apr 28', name: 'Rent', amount: '$1,200', status: 'Funded', variant: 'success' },
  { date: 'Apr 30', name: 'Bills', amount: '$615 / $750', status: 'Partial', variant: 'warning' },
  { date: 'May 02', name: 'Utilities', amount: '$95 / $180', status: 'Underfunded', variant: 'danger' },
];

type ProtectionType = 'Flexible' | 'Fully Locked' | 'Keyholder';

const boxes: {
  name: string;
  type: ProtectionType;
  progress: number;
  amount: string;
  target: string;
  nextNote: string;
}[] = [
  {
    name: 'Bills',
    type: 'Flexible',
    progress: 0.82,
    amount: '$615',
    target: '$750',
    nextNote: 'Next pay-in May 1',
  },
  {
    name: 'Rent',
    type: 'Fully Locked',
    progress: 1,
    amount: '$1,200',
    target: '$1,200',
    nextNote: 'Locked until May 1',
  },
  {
    name: 'Emergency',
    type: 'Keyholder',
    progress: 0.54,
    amount: '$540',
    target: '$1,000',
    nextNote: 'Requires keyholder to unlock',
  },
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
              <Text
                style={[
                  t.typography.stat,
                  {
                    color: stat.emphasize ? t.colors.badge.warningText : t.colors.text,
                    marginTop: 4,
                  },
                ]}
              >
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </AppCard>

      <View style={styles.section}>
        <SectionHeader title="Payment calendar" />
        <AppCard gap={0} padding={0}>
          {calendar.map((item, idx) => {
            const [month, day] = item.date.split(' ');
            return (
              <View
                key={`${item.date}-${item.name}`}
                style={[
                  styles.calendarRow,
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
                    styles.calendarDate,
                    {
                      backgroundColor: calendarChipBg(t, item.variant),
                      borderColor: calendarChipBorder(t, item.variant),
                    },
                  ]}
                >
                  <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                    {month.toUpperCase()}
                  </Text>
                  <Text style={[t.typography.h2, { color: t.colors.text }]}>{day}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>{item.name}</Text>
                  <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: 2 }]}>
                    {item.amount}
                  </Text>
                </View>
                <Badge label={item.status} variant={item.variant} />
              </View>
            );
          })}
        </AppCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Your boxes" />
        {boxes.map((box) => (
          <AppCard key={box.name}>
            <View style={styles.boxHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.h2, { color: t.colors.text }]}>{box.name}</Text>
                <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: 2 }]}>
                  {box.nextNote}
                </Text>
              </View>
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
            {box.type === 'Fully Locked' ? (
              <View style={styles.boxFooter}>
                <Ionicons name="lock-closed" size={12} color={t.colors.textMuted} />
                <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                  Money can’t be moved until the lock expires.
                </Text>
              </View>
            ) : null}
          </AppCard>
        ))}
      </View>
    </AppScreen>
  );
}

function calendarChipBg(t: ReturnType<typeof useTheme>, variant: CalendarStatus): string {
  if (variant === 'success') return t.colors.badge.successBg;
  if (variant === 'warning') return t.colors.badge.warningBg;
  return t.colors.badge.dangerBg;
}

function calendarChipBorder(t: ReturnType<typeof useTheme>, variant: CalendarStatus): string {
  if (variant === 'success') return t.colors.badge.successBg;
  if (variant === 'warning') return t.colors.badge.warningBg;
  return t.colors.badge.dangerBg;
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
    gap: 2,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  calendarDate: {
    width: 52,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
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
  boxFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
});
