// ============================================================
// app/owner-requests.tsx
//
// Read-only view of the owner's own unlock + transfer requests
// and their current status. Sprint 3 — no cancel button.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
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
  OwnerRequestSummary,
  UnlockRequestStatus,
} from '@/services/types';
import { formatCents, formatDateTime } from '@/utils/format';

const statusLabel: Record<UnlockRequestStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DENIED: 'Denied',
  EXPIRED: 'Expired',
  PENDING_USER_ACCEPTANCE: 'Needs you to accept',
  CANCELLED_BY_USER: 'Cancelled',
  FAILED: 'Failed',
};

const statusVariant: Record<UnlockRequestStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  DENIED: 'danger',
  EXPIRED: 'neutral',
  PENDING_USER_ACCEPTANCE: 'warning',
  CANCELLED_BY_USER: 'neutral',
  FAILED: 'danger',
};

export default function OwnerRequestsScreen() {
  const t = useTheme();
  const [requests, setRequests] = useState<OwnerRequestSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.owner.requests();
      setRequests(res.requests);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Could not load your requests.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: t.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScreenHeader title="My requests" onBack={() => router.back()} />
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
        <SectionHeader
          eyebrow="Status"
          title="Your unlock requests"
          subtitle="What you've asked your keyholders to approve, and how each landed."
          size="page"
        />

        {loading ? (
          <LoadingState caption="Loading requests…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load('initial')} />
        ) : !requests || requests.length === 0 ? (
          <AppCard tone="subtle">
            <Text style={[t.typography.title, { color: t.colors.text }]}>
              No requests yet
            </Text>
            <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
              When you ask to unlock or transfer money from a keyholder box, it
              will show up here.
            </Text>
          </AppCard>
        ) : (
          <View style={styles.list}>
            {requests.map((req) => (
              <OwnerRow key={req.id} request={req} />
            ))}
          </View>
        )}
      </AppScreen>
    </SafeAreaView>
  );
}

function OwnerRow({ request }: { request: OwnerRequestSummary }) {
  const t = useTheme();
  const isTransfer = request.requestType === 'TRANSFER';
  const headline = isTransfer ? 'Transfer request' : 'Early unlock request';
  const amount =
    isTransfer && request.transferAmountCents != null
      ? formatCents(request.transferAmountCents)
      : null;
  const status = request.status;
  const variant = statusVariant[status] ?? 'neutral';
  const label = statusLabel[status] ?? status;
  const keyholderLine = request.keyholder
    ? `Sent to ${request.keyholder.name ?? request.keyholder.email}`
    : 'No keyholder on file';
  const resolvedLine =
    status === 'DENIED' && request.cooldownUntil
      ? `Can re-request after ${formatDateTime(request.cooldownUntil)}`
      : request.resolvedAt
        ? `${label} ${formatDateTime(request.resolvedAt)}`
        : null;

  return (
    <AppCard>
      <View style={styles.rowHead}>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.eyebrow, { color: t.colors.textMuted }]}>
            {headline}
          </Text>
          <Text
            style={[t.typography.h2, { color: t.colors.text, marginTop: 4 }]}
          >
            {request.box.name}
          </Text>
        </View>
        <Badge label={label} variant={variant} />
      </View>
      {amount ? (
        <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
          {amount}
          {request.destinationBoxName ? ` → ${request.destinationBoxName}` : ''}
        </Text>
      ) : null}
      {request.reason ? (
        <Text style={[t.typography.body, { color: t.colors.text }]}>
          “{request.reason}”
        </Text>
      ) : null}
      <View style={styles.rowFooter}>
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          {keyholderLine}
        </Text>
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          Sent {formatDateTime(request.requestedAt)}
        </Text>
      </View>
      {resolvedLine ? (
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          {resolvedLine}
        </Text>
      ) : null}
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
  list: {
    gap: 12,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
});
