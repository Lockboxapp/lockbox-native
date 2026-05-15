import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  ActionButton,
  AppCard,
  AppScreen,
  Badge,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useCountdown } from '@/hooks/use-countdown';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type { ActivityItem, BankerNudge, HomeSummary } from '@/services/types';
import {
  formatCents,
  formatCentsSigned,
  formatCountdown,
  formatDateTime,
} from '@/utils/format';

export default function HomeScreen() {
  const t = useTheme();
  const [data, setData] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ctaSubmitting, setCtaSubmitting] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const summary = await api.home.summary();
      setData(summary);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load home data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const onCtaPress = useCallback(async () => {
    if (!data?.bankerNudge) return;
    const nudge = data.bankerNudge;
    if (nudge.ctaAction === 'open_chat') {
      router.push('/banker-chat');
      return;
    }
    if (nudge.ctaAction !== 'transfer') return;
    if (!data.walletBoxId || !nudge.ctaTargetBoxId || nudge.ctaAmountCents <= 0) {
      return;
    }
    setCtaSubmitting(true);
    try {
      await api.boxes.transfer(
        data.walletBoxId,
        nudge.ctaTargetBoxId,
        nudge.ctaAmountCents / 100,
      );
      await load('refresh');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not move money.');
    } finally {
      setCtaSubmitting(false);
    }
  }, [data, load]);

  return (
    <AppScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load('refresh')}
          tintColor={t.colors.accent}
        />
      }
    >
      <SectionHeader
        eyebrow="Good morning"
        title="Home"
        subtitle="Your money at a glance, with one clear next step."
        size="page"
      />

      {loading ? (
        <LoadingState caption="Loading your money…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load('initial')} />
      ) : data ? (
        <>
          <MoneySnapshot data={data} />

          {data.temporarilyUnlockedBoxes.map((b) => (
            <TemporaryUnlockBanner
              key={b.id}
              name={b.name}
              expiresAt={b.expiresAt}
              onExpire={() => load('refresh')}
            />
          ))}

          {data.pendingKeyholderRequestsCount > 0 ? (
            <RequestBanner
              tone="warning"
              icon="key"
              title={`${data.pendingKeyholderRequestsCount} approval ${
                data.pendingKeyholderRequestsCount === 1 ? 'request' : 'requests'
              } waiting`}
              subtitle="Review and approve or deny."
              ctaLabel="Review now"
              onPress={() => router.push('/keyholder-requests')}
            />
          ) : null}

          {data.pendingOwnerRequestsCount > 0 ? (
            <RequestBanner
              tone="subtle"
              icon="hourglass-outline"
              title={`${data.pendingOwnerRequestsCount} ${
                data.pendingOwnerRequestsCount === 1
                  ? 'request is'
                  : 'requests are'
              } pending keyholder approval`}
              subtitle="Track status from My Requests."
              ctaLabel="View status"
              onPress={() => router.push('/owner-requests')}
            />
          ) : null}

          {data.bankerNudge ? (
            <BankerNudgeCard
              nudge={data.bankerNudge}
              submitting={ctaSubmitting}
              disabled={
                ctaSubmitting ||
                (data.bankerNudge.ctaAction === 'transfer' &&
                  (!data.walletBoxId || !data.bankerNudge.ctaTargetBoxId))
              }
              onPress={onCtaPress}
            />
          ) : null}

          <RecentActivity activity={data.recentActivity} />
        </>
      ) : null}
    </AppScreen>
  );
}

function MoneySnapshot({ data }: { data: HomeSummary }) {
  const t = useTheme();
  const deltaCents = data.totalLockedDeltaCents;
  const hasDelta = deltaCents !== 0;
  return (
    <AppCard>
      <View style={styles.snapshotHead}>
        <Text style={[t.typography.eyebrow, { color: t.colors.textMuted }]}>
          Total locked
        </Text>
        <Badge label="Live" variant="success" />
      </View>
      <Text style={[t.typography.display, { color: t.colors.text }]}>
        {formatCents(data.totalLockedCents)}
      </Text>
      <Text
        style={[
          t.typography.caption,
          {
            color: hasDelta
              ? deltaCents > 0
                ? t.colors.accent
                : t.colors.badge.dangerText
              : t.colors.textMuted,
          },
        ]}
      >
        {hasDelta
          ? `${deltaCents > 0 ? '▲' : '▼'} ${formatCentsSigned(deltaCents)} vs. last month`
          : 'Tracking starts this month.'}
      </Text>
      <View style={[styles.divider, { backgroundColor: t.colors.divider }]} />
      <View style={styles.secondaryRow}>
        <SecondaryStat label="Wallet" cents={data.walletBalanceCents} />
        <SecondaryStat label="Connected" cents={data.connectedBalanceCents} />
        <SecondaryStat
          label="Next bill"
          cents={data.nextBill?.amountCents ?? 0}
          empty={!data.nextBill}
        />
      </View>
    </AppCard>
  );
}

function SecondaryStat({
  label,
  cents,
  empty,
}: {
  label: string;
  cents: number;
  empty?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={styles.secondaryStat}>
      <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[
          t.typography.bodyStrong,
          { color: empty ? t.colors.textMuted : t.colors.text, marginTop: 2 },
        ]}
      >
        {empty ? '—' : formatCents(cents)}
      </Text>
    </View>
  );
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TemporaryUnlockBanner({
  name,
  expiresAt,
  onExpire,
}: {
  name: string;
  expiresAt: string;
  onExpire: () => void;
}) {
  const t = useTheme();
  const secondsRemaining = useCountdown(expiresAt, { onExpire });
  const isRelocking = secondsRemaining <= 0;
  return (
    <AppCard tone="warning">
      <View style={styles.bannerRow}>
        <View
          style={[styles.bannerIcon, { backgroundColor: t.colors.badge.warningBg }]}
        >
          <Ionicons name="time-outline" size={18} color={t.colors.badge.warningText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
            {name} is temporarily unlocked
          </Text>
          <Text
            style={[
              t.typography.caption,
              { color: t.colors.textMuted, marginTop: 2 },
            ]}
          >
            {isRelocking
              ? 'Relocking…'
              : `Relocks in ${formatCountdown(secondsRemaining)} · Remaining funds relock automatically`}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

function RequestBanner({
  tone,
  icon,
  title,
  subtitle,
  ctaLabel,
  onPress,
}: {
  tone: 'warning' | 'subtle';
  icon: IoniconName;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  const t = useTheme();
  const iconBgColor =
    tone === 'warning' ? t.colors.badge.warningBg : t.colors.surfaceSubtle;
  const iconFgColor =
    tone === 'warning' ? t.colors.badge.warningText : t.colors.text;
  return (
    <AppCard tone={tone}>
      <View style={styles.bannerRow}>
        <View
          style={[styles.bannerIcon, { backgroundColor: iconBgColor }]}
        >
          <Ionicons name={icon} size={18} color={iconFgColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
            {title}
          </Text>
          <Text
            style={[
              t.typography.caption,
              { color: t.colors.textMuted, marginTop: 2 },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.bannerActions}>
        <ActionButton
          title={ctaLabel}
          variant={tone === 'warning' ? 'primary' : 'secondary'}
          onPress={onPress}
        />
      </View>
    </AppCard>
  );
}

function BankerNudgeCard({
  nudge,
  submitting,
  disabled,
  onPress,
}: {
  nudge: NonNullable<BankerNudge>;
  submitting: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <AppCard tone="accent">
      <Text style={[t.typography.eyebrow, { color: t.colors.accent }]}>
        The Banker
      </Text>
      <Text style={[t.typography.h1, { color: t.colors.text }]}>
        {nudge.headline}
      </Text>
      <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
        {nudge.body}
      </Text>
      <View style={styles.bankerActions}>
        <ActionButton
          title={submitting ? 'Working…' : nudge.ctaLabel}
          onPress={onPress}
          disabled={disabled}
        />
        <ActionButton
          title="Ask The Banker"
          variant="ghost"
          onPress={() => router.push('/banker-chat')}
        />
      </View>
    </AppCard>
  );
}

function RecentActivity({ activity }: { activity: ActivityItem[] }) {
  const t = useTheme();
  if (activity.length === 0) {
    return (
      <View style={styles.activityWrap}>
        <SectionHeader title="Recent activity" />
        <AppCard tone="subtle">
          <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
            No recent activity yet. Lock your first dollar to start tracking.
          </Text>
        </AppCard>
      </View>
    );
  }

  return (
    <View style={styles.activityWrap}>
      <SectionHeader title="Recent activity" />
      <AppCard gap={0} padding={0}>
        {activity.map((item, idx) => {
          const direction = classifyDirection(item.type);
          return (
            <View
              key={item.id}
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
                  { backgroundColor: iconBg(t, direction) },
                ]}
              >
                <Ionicons
                  name={iconName(direction)}
                  size={14}
                  color={iconFg(t, direction)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                  {item.description || prettyType(item.type)}
                </Text>
                <Text
                  style={[
                    t.typography.caption,
                    { color: t.colors.textMuted, marginTop: 2 },
                  ]}
                >
                  {formatDateTime(item.postedAt)}
                  {item.box ? ` · ${item.box.name}` : ''}
                </Text>
              </View>
              <Text
                style={[
                  t.typography.bodyStrong,
                  { color: amountColor(t, direction) },
                ]}
              >
                {formatActivityAmount(direction, item.amountCents)}
              </Text>
            </View>
          );
        })}
      </AppCard>
    </View>
  );
}

type Direction = 'in' | 'out' | 'move';

function classifyDirection(type: string): Direction {
  switch (type) {
    case 'DEPOSIT':
    case 'TRANSFER_IN':
      return 'in';
    case 'WITHDRAW':
    case 'WITHDRAWAL':
    case 'CARD_SPEND':
    case 'TRANSFER_OUT':
      return 'out';
    default:
      return 'move';
  }
}

function prettyType(type: string): string {
  switch (type) {
    case 'DEPOSIT':
      return 'Deposit';
    case 'WITHDRAW':
    case 'WITHDRAWAL':
      return 'Withdrawal';
    case 'TRANSFER_IN':
      return 'Transfer in';
    case 'TRANSFER_OUT':
      return 'Transfer out';
    case 'TRANSFER':
      return 'Transfer';
    case 'CARD_SPEND':
      return 'Card spend';
    case 'LOCK':
      return 'Locked';
    case 'UNLOCK':
      return 'Unlocked';
    default:
      return type;
  }
}

function iconName(direction: Direction): React.ComponentProps<typeof Ionicons>['name'] {
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

function iconBg(t: ReturnType<typeof useTheme>, direction: Direction) {
  if (direction === 'in') return t.colors.badge.successBg;
  if (direction === 'out') return t.colors.badge.dangerBg;
  return t.colors.badge.neutralBg;
}

function iconFg(t: ReturnType<typeof useTheme>, direction: Direction) {
  if (direction === 'in') return t.colors.badge.successText;
  if (direction === 'out') return t.colors.badge.dangerText;
  return t.colors.badge.neutralText;
}

function amountColor(t: ReturnType<typeof useTheme>, direction: Direction) {
  if (direction === 'in') return t.colors.accent;
  if (direction === 'out') return t.colors.text;
  return t.colors.textMuted;
}

function formatActivityAmount(direction: Direction, cents: number): string {
  if (direction === 'in') return `+${formatCents(cents)}`;
  if (direction === 'out') return `−${formatCents(cents)}`;
  return formatCents(cents);
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
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
});
