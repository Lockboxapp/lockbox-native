// ============================================================
// app/keyholder-requests.tsx
//
// Full-screen list of pending unlock/transfer requests where the
// signed-in user is the keyholder. Tapping a row navigates to
// the detail screen (where approve / deny lives).
//
// Reachable from the Home keyholder banner and the Account
// "Keyholders" row.
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
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type { KeyholderRequestSummary } from '@/services/types';
import { formatCents, formatDateTime } from '@/utils/format';

export default function KeyholderRequestsScreen() {
  const t = useTheme();
  const [requests, setRequests] = useState<KeyholderRequestSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.keyholder.requests();
      setRequests(res.requests);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Could not load keyholder requests.',
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
      <ScreenHeader title="Keyholder requests" onBack={() => router.back()} />
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
          eyebrow="Approval queue"
          title="Pending requests"
          subtitle="Review each request before approving. You can also deny with an optional reason."
          size="page"
        />

        {loading ? (
          <LoadingState caption="Loading requests…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load('initial')} />
        ) : !requests || requests.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.list}>
            {requests.map((req) => (
              <RequestRow
                key={req.id}
                request={req}
                onPress={() =>
                  router.push({
                    pathname: '/keyholder-request-detail',
                    params: { id: req.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </AppScreen>
    </SafeAreaView>
  );
}

function EmptyState() {
  const t = useTheme();
  return (
    <AppCard tone="subtle">
      <View style={styles.emptyRow}>
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: t.colors.badge.successBg },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={20}
            color={t.colors.badge.successText}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.title, { color: t.colors.text }]}>
            No pending requests
          </Text>
          <Text
            style={[
              t.typography.body,
              { color: t.colors.textMuted, marginTop: 2 },
            ]}
          >
            You&rsquo;re all caught up. We&rsquo;ll let you know when something new comes in.
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

function RequestRow({
  request,
  onPress,
}: {
  request: KeyholderRequestSummary;
  onPress: () => void;
}) {
  const t = useTheme();
  const isTransfer = request.requestType === 'TRANSFER';
  const headline = isTransfer ? 'Transfer request' : 'Early unlock request';
  const amountLine =
    isTransfer && request.transferAmountCents != null
      ? formatCents(request.transferAmountCents)
      : null;
  const ownerLine = request.owner.name ?? request.owner.email ?? 'Unknown sender';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <AppCard tone="warning">
        <View style={styles.rowHead}>
          <View style={{ flex: 1 }}>
            <Text style={[t.typography.eyebrow, { color: t.colors.badge.warningText }]}>
              {headline}
            </Text>
            <Text
              style={[
                t.typography.h2,
                { color: t.colors.text, marginTop: 4 },
              ]}
            >
              {request.box.name}
            </Text>
          </View>
          <Badge
            label={isTransfer ? 'Transfer' : 'Unlock'}
            variant={isTransfer ? 'flexible' : 'warning'}
          />
        </View>
        {amountLine ? (
          <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
            {amountLine}
          </Text>
        ) : null}
        {request.reason ? (
          <Text style={[t.typography.body, { color: t.colors.text }]}>
            “{request.reason}”
          </Text>
        ) : null}
        <View style={styles.rowFooter}>
          <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
            From {ownerLine}
          </Text>
          <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
            {formatDateTime(request.requestedAt)}
          </Text>
        </View>
      </AppCard>
    </Pressable>
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
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
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
