import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type { Box } from '@/services/types';
import { formatCents, formatShortDate } from '@/utils/format';

type CalendarStatus = 'success' | 'warning' | 'danger';

type CalendarItem = {
  id: string;
  name: string;
  lockUntil: Date;
  amountLabel: string;
  status: string;
  variant: CalendarStatus;
};

const protectionLabel: Record<Box['lockType'], string> = {
  SOFT: 'Flexible',
  HARD: 'Fully Locked',
  KEYHOLDER: 'Keyholder',
};

const protectionVariant: Record<Box['lockType'], BadgeVariant> = {
  SOFT: 'flexible',
  HARD: 'locked',
  KEYHOLDER: 'keyholder',
};

export default function BoxesScreen() {
  const t = useTheme();
  const [boxes, setBoxes] = useState<Box[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositTarget, setDepositTarget] = useState<Box | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const list = await api.boxes.list();
      setBoxes(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your boxes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const nonWallet = useMemo(
    () => (boxes ?? []).filter((b) => !b.isWallet),
    [boxes],
  );

  const summary = useMemo(() => deriveSummary(nonWallet), [nonWallet]);
  const calendar = useMemo(() => deriveCalendar(nonWallet), [nonWallet]);

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
        eyebrow="Your protection"
        title="Boxes"
        subtitle="Protect and plan your money by box."
        size="page"
      />

      {loading ? (
        <LoadingState caption="Loading your boxes…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load('initial')} />
      ) : (
        <>
          <AppCard>
            <Text style={[t.typography.title, { color: t.colors.text }]}>
              Summary
            </Text>
            <View style={styles.summaryRow}>
              <SummaryStat label="Total protected" cents={summary.totalProtected} />
              <SummaryStat
                label="Amount needed"
                cents={summary.amountNeeded}
                emphasize={summary.amountNeeded > 0}
              />
              <SummaryStat label="Box count" raw={`${summary.boxCount}`} />
            </View>
          </AppCard>

          <View style={styles.section}>
            <SectionHeader title="Payment calendar" />
            {calendar.length === 0 ? (
              <AppCard tone="subtle">
                <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                  No upcoming payments. Add a target date to a box to schedule one.
                </Text>
              </AppCard>
            ) : (
              <AppCard gap={0} padding={0}>
                {calendar.map((item, idx) => (
                  <CalendarRow key={item.id} item={item} isFirst={idx === 0} />
                ))}
              </AppCard>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Your boxes" />
            {nonWallet.length === 0 ? (
              <AppCard tone="subtle">
                <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                  You don&rsquo;t have any boxes yet. Create one on lockboxfinance.com
                  and it&rsquo;ll appear here.
                </Text>
              </AppCard>
            ) : (
              nonWallet.map((box) => (
                <BoxRow
                  key={box.id}
                  box={box}
                  onDeposit={() => setDepositTarget(box)}
                />
              ))
            )}
          </View>
        </>
      )}

      <DepositSheet
        box={depositTarget}
        onClose={() => setDepositTarget(null)}
        onSuccess={() => {
          setDepositTarget(null);
          load('refresh');
        }}
      />
    </AppScreen>
  );
}

function SummaryStat({
  label,
  cents,
  raw,
  emphasize,
}: {
  label: string;
  cents?: number;
  raw?: string;
  emphasize?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={styles.summaryStat}>
      <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[
          t.typography.stat,
          {
            color: emphasize ? t.colors.badge.warningText : t.colors.text,
            marginTop: 4,
          },
        ]}
      >
        {raw ?? formatCents(cents ?? 0)}
      </Text>
    </View>
  );
}

function CalendarRow({ item, isFirst }: { item: CalendarItem; isFirst: boolean }) {
  const t = useTheme();
  const [month, day] = formatShortDate(item.lockUntil.toISOString()).split(' ');
  return (
    <View
      style={[
        styles.calendarRow,
        {
          paddingHorizontal: t.spacing.lg,
          paddingVertical: t.spacing.md + 2,
          borderTopWidth: isFirst ? 0 : StyleSheet.hairlineWidth,
          borderTopColor: t.colors.divider,
        },
      ]}
    >
      <View
        style={[
          styles.calendarDate,
          {
            backgroundColor: chipBg(t, item.variant),
            borderColor: chipBg(t, item.variant),
          },
        ]}
      >
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          {month ? month.toUpperCase() : ''}
        </Text>
        <Text style={[t.typography.h2, { color: t.colors.text }]}>{day ?? ''}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
          {item.name}
        </Text>
        <Text
          style={[
            t.typography.caption,
            { color: t.colors.textMuted, marginTop: 2 },
          ]}
        >
          {item.amountLabel}
        </Text>
      </View>
      <Badge label={item.status} variant={item.variant} />
    </View>
  );
}

function chipBg(t: ReturnType<typeof useTheme>, variant: CalendarStatus): string {
  if (variant === 'success') return t.colors.badge.successBg;
  if (variant === 'warning') return t.colors.badge.warningBg;
  return t.colors.badge.dangerBg;
}

function BoxRow({ box, onDeposit }: { box: Box; onDeposit: () => void }) {
  const t = useTheme();
  const progress = box.targetAmount && box.targetAmount > 0
    ? Math.min(1, box.balance / box.targetAmount)
    : 0;
  const pct = Math.round(progress * 100);
  const lockedNote = box.lockType === 'HARD' ? 'Locked until your target date.'
    : box.lockType === 'KEYHOLDER' ? 'Requires keyholder to unlock.'
    : 'Flexible — you can move money any time.';
  const nextLine = box.lockUntil
    ? `Target ${formatShortDate(box.lockUntil)} · ${lockedNote}`
    : lockedNote;
  return (
    <AppCard>
      <View style={styles.boxHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.h2, { color: t.colors.text }]}>{box.name}</Text>
          <Text
            style={[
              t.typography.caption,
              { color: t.colors.textMuted, marginTop: 2 },
            ]}
          >
            {nextLine}
          </Text>
        </View>
        <Badge
          label={protectionLabel[box.lockType]}
          variant={protectionVariant[box.lockType]}
        />
      </View>
      <View style={styles.boxMeta}>
        <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
          {formatCents(box.balance)}
          {box.targetAmount != null ? ` of ${formatCents(box.targetAmount)}` : ''}
        </Text>
        {box.targetAmount != null ? (
          <Text style={[t.typography.bodyStrong, { color: t.colors.accent }]}>
            {pct}%
          </Text>
        ) : null}
      </View>
      {box.targetAmount != null ? (
        <View
          style={[styles.progressTrack, { backgroundColor: t.colors.surfaceSubtle }]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${pct}%`, backgroundColor: t.colors.accent },
            ]}
          />
        </View>
      ) : null}
      <View style={styles.boxActions}>
        <ActionButton title="+ Deposit" variant="secondary" onPress={onDeposit} />
      </View>
    </AppCard>
  );
}

function DepositSheet({
  box,
  onClose,
  onSuccess,
}: {
  box: Box | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTheme();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when the box changes (opening for a different box).
  useEffect(() => {
    setAmount('');
    setError(null);
  }, [box?.id]);

  const numericAmount = Number.parseFloat(amount);
  const canSubmit =
    !!box && !submitting && Number.isFinite(numericAmount) && numericAmount >= 1;

  async function submit() {
    if (!box || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.boxes.deposit(box.id, numericAmount);
      onSuccess();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not deposit.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={box != null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              padding: t.spacing.xl,
              gap: t.spacing.md,
              borderTopLeftRadius: t.radius.xxl,
              borderTopRightRadius: t.radius.xxl,
            },
          ]}
        >
          <View style={styles.handle} />
          <Text style={[t.typography.eyebrow, { color: t.colors.accent }]}>
            Deposit
          </Text>
          <Text style={[t.typography.h2, { color: t.colors.text }]}>
            Add money to {box?.name ?? 'this box'}
          </Text>
          <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
            Funds land directly in this box. The Wallet stays untouched.
          </Text>
          <View
            style={[
              styles.amountWrap,
              {
                backgroundColor: t.colors.surfaceSubtle,
                borderColor: t.colors.border,
              },
            ]}
          >
            <Text style={[t.typography.h1, { color: t.colors.textMuted }]}>$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={t.colors.textMuted}
              keyboardType="decimal-pad"
              inputMode="decimal"
              style={[
                t.typography.display,
                styles.amountInput,
                { color: t.colors.text },
              ]}
            />
          </View>
          {error ? (
            <Text style={[t.typography.body, { color: t.colors.badge.dangerText }]}>
              {error}
            </Text>
          ) : null}
          <View style={styles.sheetActions}>
            <ActionButton title="Cancel" variant="ghost" onPress={onClose} />
            <ActionButton
              title={submitting ? 'Depositing…' : 'Deposit'}
              onPress={submit}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function deriveSummary(boxes: Box[]) {
  const totalProtected = boxes.reduce((s, b) => s + b.lockedAmount, 0);
  const amountNeeded = boxes.reduce((s, b) => {
    if (b.targetAmount == null) return s;
    return s + Math.max(0, b.targetAmount - b.balance);
  }, 0);
  return { totalProtected, amountNeeded, boxCount: boxes.length };
}

function deriveCalendar(boxes: Box[]): CalendarItem[] {
  const now = Date.now();
  return boxes
    .filter((b) => b.lockUntil != null && new Date(b.lockUntil).getTime() > now)
    .map((b) => {
      const lockUntil = new Date(b.lockUntil!);
      const target = b.targetAmount ?? 0;
      let status: string;
      let variant: CalendarStatus;
      if (target > 0 && b.balance >= target) {
        status = 'Funded';
        variant = 'success';
      } else if (b.balance > 0) {
        status = 'Partial';
        variant = 'warning';
      } else {
        status = 'Underfunded';
        variant = 'danger';
      }
      const amountLabel = target > 0
        ? `${formatCents(b.balance)} / ${formatCents(target)}`
        : formatCents(b.balance);
      return { id: b.id, name: b.name, lockUntil, status, variant, amountLabel };
    })
    .sort((a, b) => a.lockUntil.getTime() - b.lockUntil.getTime());
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
  boxActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderWidth: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(127,127,127,0.4)',
    marginBottom: 4,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 0,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
