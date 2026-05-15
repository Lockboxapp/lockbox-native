// ============================================================
// app/deposit.tsx
//
// Single-amount deposit into a box. Board rule: "Deposit must
// stay dead simple — one of the cleanest flows in the app."
//
// - Amount input
// - Quick chips ($25 / $50 / $100 / $250)
// - Wallet balance context (informational only — server enforces)
// - Submit → api.boxes.deposit(...). On success, back-navigate.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ActionButton,
  AppCard,
  AppScreen,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import { formatCents } from '@/utils/format';

const QUICK_AMOUNTS = [25, 50, 100, 250];

export default function DepositScreen() {
  const t = useTheme();
  const { boxId, boxName } = useLocalSearchParams<{
    boxId: string;
    boxName?: string;
  }>();
  const [walletBalanceCents, setWalletBalanceCents] = useState<number | null>(
    null,
  );
  const [boxBalanceCents, setBoxBalanceCents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!boxId) {
      setLoadError('Missing box id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [summary, detail] = await Promise.all([
        api.home.summary(),
        api.boxes.detail(boxId),
      ]);
      setWalletBalanceCents(summary.walletBalanceCents);
      setBoxBalanceCents(detail.balance);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.message : 'Could not load deposit info.',
      );
    } finally {
      setLoading(false);
    }
  }, [boxId]);

  useEffect(() => {
    load();
  }, [load]);

  const numeric = Number.parseFloat(amount);
  const valid = Number.isFinite(numeric) && numeric >= 1;
  const canSubmit = valid && !submitting && !!boxId;

  async function onSubmit() {
    if (!canSubmit || !boxId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.boxes.deposit(boxId, numeric);
      router.back();
    } catch (e) {
      setSubmitError(
        e instanceof ApiError ? e.message : 'Could not deposit.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: t.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="Deposit" onBack={() => router.back()} />
        <AppScreen edges={['left', 'right']}>
          {loading ? (
            <LoadingState caption="Loading…" />
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={load} />
          ) : (
            <>
              <SectionHeader
                eyebrow="Deposit"
                title={boxName ?? 'Add money'}
                subtitle="Money lands in this box immediately."
                size="page"
              />

              <AppCard tone="subtle">
                <View style={styles.snapshotRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                      Wallet
                    </Text>
                    <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                      {walletBalanceCents != null
                        ? formatCents(walletBalanceCents)
                        : '—'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                      Box balance
                    </Text>
                    <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                      {boxBalanceCents != null
                        ? formatCents(boxBalanceCents)
                        : '—'}
                    </Text>
                  </View>
                </View>
              </AppCard>

              <View
                style={[
                  styles.amountWrap,
                  {
                    backgroundColor: t.colors.surface,
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
                  autoFocus
                  style={[
                    t.typography.display,
                    styles.amountInput,
                    { color: t.colors.text },
                  ]}
                />
              </View>

              <View style={styles.chipsRow}>
                {QUICK_AMOUNTS.map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => setAmount(String(q))}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: t.colors.surfaceSubtle,
                        borderColor: t.colors.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                      ${q}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {submitError ? (
                <AppCard tone="warning">
                  <Text style={[t.typography.body, { color: t.colors.badge.dangerText }]}>
                    {submitError}
                  </Text>
                </AppCard>
              ) : null}

              <ActionButton
                title={submitting ? 'Depositing…' : 'Deposit'}
                onPress={onSubmit}
                disabled={!canSubmit}
                fullWidth
              />
            </>
          )}
        </AppScreen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
});
