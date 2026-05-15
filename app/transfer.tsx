// ============================================================
// app/transfer.tsx
//
// Move money from one box to another. Destination picker + amount
// input + balance sanity-check. Server enforces all lock rules.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { Box } from '@/services/types';
import { formatCents } from '@/utils/format';

export default function TransferScreen() {
  const t = useTheme();
  const { fromBoxId, fromBoxName } = useLocalSearchParams<{
    fromBoxId: string;
    fromBoxName?: string;
  }>();
  const [boxes, setBoxes] = useState<Box[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destBoxId, setDestBoxId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!fromBoxId) {
      setError('Missing source box id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.boxes.list();
      setBoxes(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load boxes.');
    } finally {
      setLoading(false);
    }
  }, [fromBoxId]);

  useEffect(() => {
    load();
  }, [load]);

  const sourceBox = useMemo(
    () => boxes?.find((b) => b.id === fromBoxId) ?? null,
    [boxes, fromBoxId],
  );

  // Available destinations: any of the user's boxes except the source
  // and any closed boxes. Server is the final authority on whether the
  // transfer is allowed — this filter is just UI tidiness.
  const destinations = useMemo(
    () =>
      (boxes ?? []).filter(
        (b) => b.id !== fromBoxId && !b.isClosed,
      ),
    [boxes, fromBoxId],
  );

  const destBox = destinations.find((b) => b.id === destBoxId) ?? null;

  const numeric = Number.parseFloat(amount);
  const valid = Number.isFinite(numeric) && numeric >= 1;
  const canSubmit =
    valid &&
    destBoxId != null &&
    !submitting &&
    !!fromBoxId;

  async function onSubmit() {
    if (!canSubmit || !fromBoxId || !destBoxId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.boxes.transfer(fromBoxId, destBoxId, numeric);
      router.back();
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : 'Could not transfer.');
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
        <ScreenHeader title="Transfer" onBack={() => router.back()} />
        <AppScreen edges={['left', 'right']}>
          {loading ? (
            <LoadingState caption="Loading boxes…" />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <>
              <SectionHeader
                eyebrow="Transfer"
                title={`From ${fromBoxName ?? 'this box'}`}
                subtitle="Move money to another of your boxes. Server enforces lock rules."
                size="page"
              />

              <AppCard tone="subtle">
                <View style={styles.snapshotRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                      Source balance
                    </Text>
                    <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                      {sourceBox != null ? formatCents(sourceBox.balance) : '—'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                      Destination
                    </Text>
                    <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                      {destBox != null ? formatCents(destBox.balance) : '—'}
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

              <SectionHeader title="Send to" />
              {destinations.length === 0 ? (
                <AppCard tone="subtle">
                  <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                    You don’t have another box to send to yet.
                  </Text>
                </AppCard>
              ) : (
                <View style={{ gap: 12 }}>
                  {destinations.map((b) => {
                    const selected = b.id === destBoxId;
                    return (
                      <Pressable
                        key={b.id}
                        onPress={() => setDestBoxId(b.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                      >
                        <AppCard tone={selected ? 'accent' : 'default'}>
                          <View style={styles.rowBetween}>
                            <View style={{ flex: 1 }}>
                              <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                                {b.name}
                              </Text>
                              <Text
                                style={[
                                  t.typography.caption,
                                  { color: t.colors.textMuted, marginTop: 2 },
                                ]}
                              >
                                {formatCents(b.balance)} · {b.lockType.toLowerCase()}
                              </Text>
                            </View>
                            {selected ? (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={t.colors.accent}
                              />
                            ) : null}
                          </View>
                        </AppCard>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {submitError ? (
                <AppCard tone="warning">
                  <Text style={[t.typography.body, { color: t.colors.badge.dangerText }]}>
                    {submitError}
                  </Text>
                </AppCard>
              ) : null}

              <ActionButton
                title={submitting ? 'Transferring…' : 'Transfer'}
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
