// ============================================================
// app/box-detail.tsx
//
// Single-box view. Receives `id` via useLocalSearchParams so
// future deep-links (e.g. notifications) can land here.
//
// Action buttons are derived from box state:
//   - Wallet                       → Deposit, Transfer
//   - Temporarily unlocked         → Deposit, Transfer (+ countdown)
//   - status LOCKED / UNLOCK_PENDING → Deposit, Request Unlock
//   - CREATED / FUNDING / UNLOCKED  → Deposit, Transfer, Lock,
//                                     Change protection
//
// All money values render via formatCents; floats never leave the
// API response.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ActionButton,
  AppCard,
  AppScreen,
  Badge,
  type BadgeVariant,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useCountdown } from '@/hooks/use-countdown';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type { BoxDetail, LockType } from '@/services/types';
import {
  formatCents,
  formatCountdown,
  formatDateTime,
  formatShortDate,
} from '@/utils/format';

const lockTypeLabel: Record<LockType, string> = {
  SOFT: 'Flexible',
  HARD: 'Fully Locked',
  KEYHOLDER: 'Keyholder',
};

const lockTypeVariant: Record<LockType, BadgeVariant> = {
  SOFT: 'flexible',
  HARD: 'locked',
  KEYHOLDER: 'keyholder',
};

export default function BoxDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [box, setBox] = useState<BoxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!id) {
        setError('Missing box id.');
        setLoading(false);
        return;
      }
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await api.boxes.detail(id);
        setBox(res);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load this box.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  const secondsRemaining = useCountdown(
    box?.temporaryUnlockExpiresAt ?? null,
    { onExpire: () => load('refresh') },
  );
  const tempUnlockedNow =
    !!box?.isTemporarilyUnlocked && secondsRemaining > 0;
  const tempUnlockRelocking =
    !!box?.isTemporarilyUnlocked && secondsRemaining <= 0;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: t.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScreenHeader
        title="Box"
        onBack={() => router.back()}
      />
      <AppScreen
        edges={['left', 'right']}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={t.colors.accent}
          />
        }
      >
        {loading ? (
          <LoadingState caption="Loading box…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load('initial')} />
        ) : !box ? null : (
          <>
            <SectionHeader
              eyebrow={statusEyebrow(box)}
              title={box.name}
              subtitle={subtitleLine(box)}
              size="page"
              trailing={
                tempUnlockedNow || tempUnlockRelocking ? (
                  <Badge label="Temporarily Unlocked" variant="warning" />
                ) : (
                  <Badge
                    label={lockTypeLabel[box.lockType]}
                    variant={lockTypeVariant[box.lockType]}
                  />
                )
              }
            />

            {tempUnlockedNow || tempUnlockRelocking ? (
              <AppCard tone="warning">
                <Text
                  style={[
                    t.typography.bodyStrong,
                    { color: t.colors.badge.warningText },
                  ]}
                >
                  {tempUnlockRelocking
                    ? 'Relocking…'
                    : `Relocks in ${formatCountdown(secondsRemaining)}`}
                </Text>
                <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                  Remaining funds will relock automatically when the timer ends.
                </Text>
              </AppCard>
            ) : null}

            <BalanceCard box={box} />
            <ActionsCard
              box={box}
              tempUnlockedNow={tempUnlockedNow}
              tempUnlockRelocking={tempUnlockRelocking}
            />
            <TransactionsCard box={box} />
          </>
        )}
      </AppScreen>
    </SafeAreaView>
  );
}

function BalanceCard({ box }: { box: BoxDetail }) {
  const t = useTheme();
  const pct =
    box.targetAmount && box.targetAmount > 0
      ? Math.min(1, box.balance / box.targetAmount)
      : 0;
  const pctLabel = Math.round(pct * 100);
  return (
    <AppCard>
      <Text style={[t.typography.eyebrow, { color: t.colors.textMuted }]}>
        Balance
      </Text>
      <Text style={[t.typography.display, { color: t.colors.text }]}>
        {formatCents(box.balance)}
      </Text>
      {box.targetAmount != null ? (
        <>
          <View style={styles.balanceMeta}>
            <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
              of {formatCents(box.targetAmount)}
            </Text>
            <Text style={[t.typography.bodyStrong, { color: t.colors.accent }]}>
              {pctLabel}%
            </Text>
          </View>
          <View
            style={[styles.progressTrack, { backgroundColor: t.colors.surfaceSubtle }]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${pctLabel}%`, backgroundColor: t.colors.accent },
              ]}
            />
          </View>
        </>
      ) : null}
      {box.lockUntil ? (
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          Target date · {formatShortDate(box.lockUntil)}
        </Text>
      ) : null}
    </AppCard>
  );
}

function ActionsCard({
  box,
  tempUnlockedNow,
  tempUnlockRelocking,
}: {
  box: BoxDetail;
  tempUnlockedNow: boolean;
  tempUnlockRelocking: boolean;
}) {
  if (box.isClosed) return null;

  const goDeposit = () =>
    router.push({
      pathname: '/deposit',
      params: { boxId: box.id, boxName: box.name },
    });
  const goTransfer = () =>
    router.push({
      pathname: '/transfer',
      params: { fromBoxId: box.id, fromBoxName: box.name },
    });
  const goRequestUnlock = () =>
    router.push({
      pathname: '/request-unlock',
      params: { boxId: box.id, boxName: box.name },
    });
  const goChangeProtection = () =>
    router.push({
      pathname: '/change-protection',
      params: { boxId: box.id },
    });

  const isLocked =
    !tempUnlockedNow &&
    !tempUnlockRelocking &&
    !box.isWallet &&
    (box.status === 'LOCKED' || box.status === 'UNLOCK_PENDING');

  if (box.isWallet) {
    return (
      <View style={styles.actionStack}>
        <ActionButton title="Deposit" onPress={goDeposit} fullWidth />
        <ActionButton
          title="Transfer to another box"
          variant="secondary"
          onPress={goTransfer}
          fullWidth
        />
      </View>
    );
  }
  if (isLocked) {
    return (
      <View style={styles.actionStack}>
        <ActionButton title="Deposit" onPress={goDeposit} fullWidth />
        <ActionButton
          title="Request unlock"
          variant="secondary"
          onPress={goRequestUnlock}
          fullWidth
        />
      </View>
    );
  }
  // Temporarily unlocked → Deposit + Transfer; no Lock/Change Protection
  // because the cron will relock + handoff §6 blocks protection changes.
  if (tempUnlockedNow || tempUnlockRelocking) {
    return (
      <View style={styles.actionStack}>
        <ActionButton title="Deposit" onPress={goDeposit} fullWidth />
        <ActionButton
          title="Transfer"
          variant="secondary"
          onPress={goTransfer}
          fullWidth
        />
      </View>
    );
  }
  // Default unlocked path (CREATED/FUNDING/UNLOCKED).
  return (
    <View style={styles.actionStack}>
      <ActionButton title="Deposit" onPress={goDeposit} fullWidth />
      <ActionButton
        title="Transfer"
        variant="secondary"
        onPress={goTransfer}
        fullWidth
      />
      <ActionButton
        title="Lock this box"
        variant="secondary"
        onPress={goChangeProtection}
        fullWidth
      />
      <ActionButton
        title="Change protection"
        variant="ghost"
        onPress={goChangeProtection}
        fullWidth
      />
    </View>
  );
}

function TransactionsCard({ box }: { box: BoxDetail }) {
  const t = useTheme();
  if (box.transactions.length === 0) {
    return (
      <View style={{ gap: 12 }}>
        <SectionHeader title="Recent activity" />
        <AppCard tone="subtle">
          <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
            No transactions yet. Deposit or transfer to get started.
          </Text>
        </AppCard>
      </View>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <SectionHeader title="Recent activity" />
      <AppCard gap={0} padding={0}>
        {box.transactions.map((tx, idx) => (
          <View
            key={tx.id}
            style={[
              styles.txRow,
              {
                paddingHorizontal: t.spacing.lg,
                paddingVertical: t.spacing.md + 2,
                borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: t.colors.divider,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                {tx.description || prettyType(tx.type)}
              </Text>
              <Text
                style={[
                  t.typography.caption,
                  { color: t.colors.textMuted, marginTop: 2 },
                ]}
              >
                {formatDateTime(tx.postedAt)}
              </Text>
            </View>
            <Text
              style={[
                t.typography.bodyStrong,
                { color: amountColor(t, tx.type) },
              ]}
            >
              {signedAmount(tx.type, tx.amountCents)}
            </Text>
          </View>
        ))}
      </AppCard>
    </View>
  );
}

function statusEyebrow(box: BoxDetail): string {
  if (box.isWallet) return 'Wallet';
  if (box.isTemporarilyUnlocked) return 'Temporary unlock';
  if (box.status === 'LOCKED') return 'Locked';
  if (box.status === 'UNLOCK_PENDING') return 'Pending review';
  if (box.status === 'UNLOCKED') return 'Unlocked';
  return 'Open';
}

function subtitleLine(box: BoxDetail): string {
  if (box.isWallet) return 'Liquid by design — always available.';
  switch (box.lockType) {
    case 'HARD':
      return 'Requires a written reason to unlock.';
    case 'KEYHOLDER':
      return 'A keyholder approves every unlock.';
    default:
      return 'Flexible — you can move money any time.';
  }
}

function prettyType(type: string): string {
  switch (type) {
    case 'DEPOSIT': return 'Deposit';
    case 'WITHDRAW':
    case 'WITHDRAWAL': return 'Withdrawal';
    case 'TRANSFER_IN': return 'Transfer in';
    case 'TRANSFER_OUT': return 'Transfer out';
    case 'TRANSFER': return 'Transfer';
    case 'CARD_SPEND': return 'Card spend';
    case 'LOCK': return 'Locked';
    case 'UNLOCK': return 'Unlocked';
    default: return type;
  }
}

function signedAmount(type: string, cents: number): string {
  if (type === 'DEPOSIT' || type === 'TRANSFER_IN') return `+${formatCents(cents)}`;
  if (
    type === 'WITHDRAW' ||
    type === 'WITHDRAWAL' ||
    type === 'CARD_SPEND' ||
    type === 'TRANSFER_OUT'
  ) {
    return `−${formatCents(cents)}`;
  }
  return formatCents(cents);
}

function amountColor(t: ReturnType<typeof useTheme>, type: string): string {
  if (type === 'DEPOSIT' || type === 'TRANSFER_IN') return t.colors.accent;
  if (
    type === 'WITHDRAW' ||
    type === 'WITHDRAWAL' ||
    type === 'CARD_SPEND' ||
    type === 'TRANSFER_OUT'
  ) {
    return t.colors.text;
  }
  return t.colors.textMuted;
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: t.colors.divider,
          paddingHorizontal: t.spacing.xl,
          paddingVertical: t.spacing.md,
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={22} color={t.colors.text} />
        <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>Back</Text>
      </Pressable>
      <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
        {title}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerSpacer: { width: 60 },
  balanceMeta: {
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
  actionStack: {
    gap: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
