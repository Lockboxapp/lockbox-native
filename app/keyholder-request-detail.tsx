// ============================================================
// app/keyholder-request-detail.tsx
//
// Single-request detail view with approve / deny actions. Deeply
// linkable: accepts `id` via useLocalSearchParams so a future
// push notification can land directly here.
//
// Lock enforcement and approval business rules live entirely on
// the server — the screen renders the server's verdict and never
// re-decides whether a request is approvable.
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
  Badge,
  type BadgeVariant,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type {
  KeyholderApproveResponse,
  KeyholderDenyResponse,
  KeyholderRequestDetail,
  LockType,
} from '@/services/types';
import { formatCents, formatDateTime } from '@/utils/format';

const lockTypeLabel: Record<LockType, string> = {
  SOFT: 'Flexible',
  HARD: 'Fully locked',
  KEYHOLDER: 'Keyholder',
};

const lockTypeBadgeVariant: Record<LockType, BadgeVariant> = {
  SOFT: 'flexible',
  HARD: 'locked',
  KEYHOLDER: 'keyholder',
};

type Result =
  | { kind: 'approved'; data: KeyholderApproveResponse }
  | { kind: 'denied'; data: KeyholderDenyResponse };

export default function KeyholderRequestDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<KeyholderRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denying, setDenying] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'deny' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing request id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.keyholder.requestDetail(id);
      setDetail(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load this request.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove() {
    if (!id || submitting) return;
    setSubmitting('approve');
    setActionError(null);
    try {
      const data = await api.keyholder.approve(id);
      setResult({ kind: 'approved', data });
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not approve.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeny() {
    if (!id || submitting) return;
    setSubmitting('deny');
    setActionError(null);
    try {
      const data = await api.keyholder.deny(id, denyReason.trim() || undefined);
      setResult({ kind: 'denied', data });
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not deny.');
    } finally {
      setSubmitting(null);
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
        <ScreenHeader title="Request" onBack={() => router.back()} />
        <AppScreen edges={['left', 'right']}>
          {loading ? (
            <LoadingState caption="Loading request…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => load()} />
          ) : !detail ? null : result ? (
            <ResultCard
              result={result}
              onDone={() => router.replace('/keyholder-requests')}
            />
          ) : (
            <>
              <SectionHeader
                eyebrow={
                  detail.requestType === 'TRANSFER'
                    ? 'Transfer request'
                    : 'Early unlock request'
                }
                title={detail.box.name}
                subtitle={detail.owner.name ?? detail.owner.email ?? 'Unknown sender'}
                size="page"
              />

              <AppCard>
                <View style={styles.headRow}>
                  <Badge
                    label={lockTypeLabel[detail.box.lockType]}
                    variant={lockTypeBadgeVariant[detail.box.lockType]}
                  />
                  <Badge label={detail.status} variant="neutral" />
                </View>
                {detail.requestType === 'TRANSFER' &&
                detail.transferAmountCents != null ? (
                  <DetailRow
                    label="Amount"
                    value={formatCents(detail.transferAmountCents)}
                    emphasize
                  />
                ) : null}
                {detail.requestType === 'TRANSFER' && detail.destinationBoxName ? (
                  <DetailRow
                    label="Destination"
                    value={detail.destinationBoxName}
                  />
                ) : null}
                <DetailRow
                  label="Box balance"
                  value={formatCents(detail.box.balanceCents)}
                />
                <DetailRow
                  label="Requested"
                  value={formatDateTime(detail.requestedAt)}
                />
                {detail.box.lockUntil ? (
                  <DetailRow
                    label="Target date"
                    value={formatDateTime(detail.box.lockUntil)}
                  />
                ) : null}
              </AppCard>

              {detail.reason ? (
                <AppCard tone="subtle">
                  <Text style={[t.typography.eyebrow, { color: t.colors.textMuted }]}>
                    Their reason
                  </Text>
                  <Text style={[t.typography.body, { color: t.colors.text }]}>
                    “{detail.reason}”
                  </Text>
                </AppCard>
              ) : null}

              {detail.reflection ? (
                <AppCard tone="subtle">
                  <Text style={[t.typography.eyebrow, { color: t.colors.textMuted }]}>
                    Their reflection
                  </Text>
                  <Text style={[t.typography.body, { color: t.colors.text }]}>
                    {detail.reflection}
                  </Text>
                </AppCard>
              ) : null}

              {denying ? (
                <AppCard tone="warning">
                  <Text style={[t.typography.title, { color: t.colors.text }]}>
                    Add a reason (optional)
                  </Text>
                  <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                    The sender will see this. A short, kind explanation helps
                    them decide what to do next.
                  </Text>
                  <TextInput
                    value={denyReason}
                    onChangeText={setDenyReason}
                    placeholder="Why are you denying this?"
                    placeholderTextColor={t.colors.textMuted}
                    multiline
                    style={[
                      styles.denyInput,
                      t.typography.body,
                      {
                        color: t.colors.text,
                        backgroundColor: t.colors.surface,
                        borderColor: t.colors.border,
                      },
                    ]}
                  />
                  {actionError ? (
                    <Text
                      style={[
                        t.typography.body,
                        { color: t.colors.badge.dangerText },
                      ]}
                    >
                      {actionError}
                    </Text>
                  ) : null}
                  <View style={styles.denyButtons}>
                    <ActionButton
                      title="Cancel"
                      variant="ghost"
                      onPress={() => {
                        setDenying(false);
                        setDenyReason('');
                        setActionError(null);
                      }}
                      disabled={submitting === 'deny'}
                    />
                    <ActionButton
                      title={submitting === 'deny' ? 'Denying…' : 'Confirm deny'}
                      onPress={handleDeny}
                      disabled={submitting !== null}
                    />
                  </View>
                </AppCard>
              ) : (
                <>
                  {actionError ? (
                    <AppCard tone="subtle">
                      <Text
                        style={[
                          t.typography.body,
                          { color: t.colors.badge.dangerText },
                        ]}
                      >
                        {actionError}
                      </Text>
                    </AppCard>
                  ) : null}
                  <View style={styles.actions}>
                    <ActionButton
                      title={submitting === 'approve' ? 'Approving…' : 'Approve'}
                      onPress={handleApprove}
                      disabled={submitting !== null}
                      fullWidth
                    />
                    <ActionButton
                      title="Deny"
                      variant="secondary"
                      onPress={() => {
                        setDenying(true);
                        setActionError(null);
                      }}
                      disabled={submitting !== null}
                      fullWidth
                    />
                  </View>
                </>
              )}
            </>
          )}
        </AppScreen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[
          emphasize ? t.typography.stat : t.typography.bodyStrong,
          { color: t.colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ResultCard({ result, onDone }: { result: Result; onDone: () => void }) {
  const t = useTheme();
  if (result.kind === 'approved') {
    const { data } = result;
    const headline = data.pendingUserAcceptance
      ? 'Approved — awaiting their acceptance'
      : 'Approved';
    const body = data.pendingUserAcceptance
      ? `The sender still has to accept the transfer to ${
          data.destinationBoxName ?? 'the destination'
        } before the money moves.`
      : `${data.boxName} is now unlocked or transferred as requested.`;
    return (
      <AppCard tone="accent">
        <View style={styles.resultRow}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: t.colors.badge.successBg },
            ]}
          >
            <Ionicons
              name="checkmark"
              size={22}
              color={t.colors.badge.successText}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[t.typography.h2, { color: t.colors.text }]}>
              {headline}
            </Text>
            <Text
              style={[
                t.typography.body,
                { color: t.colors.textMuted, marginTop: 2 },
              ]}
            >
              {body}
            </Text>
          </View>
        </View>
        <ActionButton title="Back to queue" onPress={onDone} fullWidth />
      </AppCard>
    );
  }

  return (
    <AppCard tone="warning">
      <View style={styles.resultRow}>
        <View
          style={[
            styles.resultIcon,
            { backgroundColor: t.colors.badge.dangerBg },
          ]}
        >
          <Ionicons name="close" size={22} color={t.colors.badge.dangerText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.h2, { color: t.colors.text }]}>Denied</Text>
          <Text
            style={[
              t.typography.body,
              { color: t.colors.textMuted, marginTop: 2 },
            ]}
          >
            {result.data.boxName} stays locked. The sender cannot re-request until{' '}
            {formatDateTime(result.data.cooldownUntil)}.
          </Text>
        </View>
      </View>
      <ActionButton
        title="Back to queue"
        variant="secondary"
        onPress={onDone}
        fullWidth
      />
    </AppCard>
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
  safe: {
    flex: 1,
  },
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
  headerSpacer: {
    width: 60,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  denyInput: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  denyButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
