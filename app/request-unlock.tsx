// ============================================================
// app/request-unlock.tsx
//
// Owner submits an unlock or transfer request to ONE chosen
// keyholder (board rule). Drives off
// GET /api/boxes/:id/keyholder-status which tells us:
//   - the assigned ACTIVE keyholders we can pick from
//   - whether a 24-hour cooldown is currently blocking new
//     requests (server-stamped after deny or expiry)
//
// The screen renders a clear "one keyholder, 24h cooldown if
// it doesn't land" warning per the board's plain-English
// requirement, and blocks the form entirely when the cooldown
// is live.
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
import { useCountdown } from '@/hooks/use-countdown';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type { KeyholderStatus, UnlockRequestType } from '@/services/types';
import { formatCountdown } from '@/utils/format';

export default function RequestUnlockScreen() {
  const t = useTheme();
  const { boxId, boxName } = useLocalSearchParams<{
    boxId: string;
    boxName?: string;
  }>();
  const [status, setStatus] = useState<KeyholderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<UnlockRequestType>('UNLOCK');
  const [reason, setReason] = useState('');
  const [selectedKeyholderId, setSelectedKeyholderId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!boxId) {
      setError('Missing box id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.boxes.keyholderStatus(boxId);
      setStatus(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load status.');
    } finally {
      setLoading(false);
    }
  }, [boxId]);

  useEffect(() => {
    load();
  }, [load]);

  // Live countdowns for the active request + cooldown. When they
  // hit zero we refetch so the screen flips state automatically.
  const activeRequestSeconds = useCountdown(
    status?.activeRequest?.expiresAt ?? null,
    { onExpire: load },
  );
  const cooldownSeconds = useCountdown(status?.cooldownEndsAt ?? null, {
    onExpire: load,
  });

  const canSubmit =
    !!boxId &&
    !!status &&
    !status.hasActiveRequest &&
    !status.cooldownActive &&
    reason.trim().length > 0 &&
    selectedKeyholderId != null &&
    !submitting;

  async function onSubmit() {
    if (!canSubmit || !boxId || !selectedKeyholderId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.boxes.requestUnlock({
        boxId,
        requestType,
        reason: reason.trim(),
        keyholderRelationshipId: selectedKeyholderId,
      });
      router.back();
    } catch (e) {
      setSubmitError(
        e instanceof ApiError ? e.message : 'Could not send request.',
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
        <ScreenHeader title="Request unlock" onBack={() => router.back()} />
        <AppScreen edges={['left', 'right']}>
          {loading ? (
            <LoadingState caption="Checking keyholder status…" />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : !status ? null : (
            <>
              <SectionHeader
                eyebrow="Request unlock"
                title={boxName ?? 'Ask a keyholder'}
                subtitle="One request at a time. One keyholder per request."
                size="page"
              />

              {status.hasActiveRequest ? (
                <AppCard tone="warning">
                  <Text style={[t.typography.title, { color: t.colors.text }]}>
                    A request is already waiting
                  </Text>
                  <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                    {status.activeRequest?.keyholder
                      ? `${status.activeRequest.keyholder.name ?? status.activeRequest.keyholder.email} hasn’t responded yet.`
                      : 'Your keyholder hasn’t responded yet.'}
                  </Text>
                  {activeRequestSeconds > 0 ? (
                    <Text
                      style={[
                        t.typography.bodyStrong,
                        { color: t.colors.badge.warningText },
                      ]}
                    >
                      Expires in {formatCountdown(activeRequestSeconds)}
                    </Text>
                  ) : (
                    <Text
                      style={[
                        t.typography.bodyStrong,
                        { color: t.colors.badge.warningText },
                      ]}
                    >
                      Expiring now…
                    </Text>
                  )}
                </AppCard>
              ) : status.cooldownActive ? (
                <AppCard tone="warning">
                  <Text style={[t.typography.title, { color: t.colors.text }]}>
                    You need to wait before sending another request
                  </Text>
                  <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                    The cooldown after a denied or expired request keeps the
                    friction real. You can ask a different keyholder after the
                    timer ends.
                  </Text>
                  <Text
                    style={[
                      t.typography.bodyStrong,
                      { color: t.colors.badge.warningText },
                    ]}
                  >
                    Available in {formatCountdown(cooldownSeconds)}
                  </Text>
                </AppCard>
              ) : status.assignedKeyholders.length === 0 ? (
                <AppCard tone="warning">
                  <Text style={[t.typography.title, { color: t.colors.text }]}>
                    No keyholder on this box
                  </Text>
                  <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                    Add a keyholder to this box before requesting an unlock.
                  </Text>
                </AppCard>
              ) : (
                <>
                  <AppCard tone="subtle">
                    <Text style={[t.typography.eyebrow, { color: t.colors.accent }]}>
                      One choice, real friction
                    </Text>
                    <Text style={[t.typography.body, { color: t.colors.text }]}>
                      Choose one keyholder. If this request is denied or expires,
                      you’ll need to wait 24 hours before asking a different
                      keyholder.
                    </Text>
                  </AppCard>

                  <RequestTypeRow
                    value={requestType}
                    onChange={setRequestType}
                  />

                  <View style={styles.field}>
                    <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
                      Why do you need access?
                    </Text>
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="A short, honest reason — they’ll see this."
                      placeholderTextColor={t.colors.textMuted}
                      multiline
                      style={[
                        styles.reasonInput,
                        t.typography.body,
                        {
                          color: t.colors.text,
                          backgroundColor: t.colors.surface,
                          borderColor: t.colors.border,
                        },
                      ]}
                    />
                  </View>

                  <SectionHeader title="Pick a keyholder" />
                  <View style={{ gap: 12 }}>
                    {status.assignedKeyholders.map((k) => {
                      const selected = k.id === selectedKeyholderId;
                      return (
                        <Pressable
                          key={k.id}
                          onPress={() => setSelectedKeyholderId(k.id)}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                        >
                          <AppCard tone={selected ? 'accent' : 'default'}>
                            <View style={styles.rowBetween}>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    t.typography.bodyStrong,
                                    { color: t.colors.text },
                                  ]}
                                >
                                  {k.name ?? k.email}
                                </Text>
                                <Text
                                  style={[
                                    t.typography.caption,
                                    { color: t.colors.textMuted, marginTop: 2 },
                                  ]}
                                >
                                  {k.email} · {k.scopeType === 'ALL' ? 'All boxes' : 'Selected boxes'}
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

                  {submitError ? (
                    <AppCard tone="warning">
                      <Text
                        style={[
                          t.typography.body,
                          { color: t.colors.badge.dangerText },
                        ]}
                      >
                        {submitError}
                      </Text>
                    </AppCard>
                  ) : null}

                  <ActionButton
                    title={submitting ? 'Sending…' : 'Send request'}
                    onPress={onSubmit}
                    disabled={!canSubmit}
                    fullWidth
                  />
                </>
              )}
            </>
          )}
        </AppScreen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RequestTypeRow({
  value,
  onChange,
}: {
  value: UnlockRequestType;
  onChange: (v: UnlockRequestType) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.toggleRow}>
      {(['UNLOCK', 'TRANSFER'] as UnlockRequestType[]).map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.toggleChip,
              {
                backgroundColor: selected
                  ? t.colors.accent
                  : t.colors.surfaceSubtle,
                borderColor: selected ? t.colors.accent : t.colors.border,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text
              style={[
                t.typography.bodyStrong,
                { color: selected ? t.colors.onAccent : t.colors.text },
              ]}
            >
              {opt === 'UNLOCK' ? 'Unlock box' : 'Transfer funds'}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
  field: {
    gap: 6,
  },
  reasonInput: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
