// ============================================================
// app/new-keyholder.tsx
//
// Invite a trusted person to be a keyholder. Two modes:
//   - ALL: they can approve unlocks on any KEYHOLDER box you own
//   - SELECTED: they cover specific boxes (multi-select)
//
// On submit:
//   - POST /api/keyholders with { email, scopeType, boxIds? }
//   - Server-side validation: self-invite blocked, dup blocked
//   - Resend handles the invite email
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import type { Box, KeyholderScope } from '@/services/types';

export default function NewKeyholderScreen() {
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [scope, setScope] = useState<KeyholderScope>('ALL');
  const [boxes, setBoxes] = useState<Box[] | null>(null);
  const [boxesLoading, setBoxesLoading] = useState(false);
  const [boxesError, setBoxesError] = useState<string | null>(null);
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadBoxes = useCallback(async () => {
    setBoxesLoading(true);
    setBoxesError(null);
    try {
      const res = await api.boxes.list();
      setBoxes(res.filter((b) => !b.isWallet && !b.isClosed));
    } catch (e) {
      setBoxesError(e instanceof ApiError ? e.message : 'Could not load boxes.');
    } finally {
      setBoxesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (scope === 'SELECTED' && boxes === null) {
      loadBoxes();
    }
  }, [scope, boxes, loadBoxes]);

  function toggleBox(id: string) {
    setSelectedBoxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const canSubmit =
    emailValid &&
    !submitting &&
    (scope === 'ALL' || selectedBoxIds.size > 0);

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.keyholders.invite({
        email: email.trim().toLowerCase(),
        name: name.trim() || undefined,
        scopeType: scope,
        boxIds:
          scope === 'SELECTED' ? Array.from(selectedBoxIds) : undefined,
      });
      setSuccess(true);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : 'Could not send invite.');
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
        <ScreenHeader title="Add keyholder" onBack={() => router.back()} />
        <AppScreen edges={['left', 'right']}>
          {success ? (
            <SuccessCard onDone={() => router.back()} email={email.trim()} />
          ) : (
            <>
              <SectionHeader
                eyebrow="New keyholder"
                title="Invite by email"
                subtitle="They’ll get an email with a one-time link. Until they accept, they show up as Pending on your Keyholders screen."
                size="page"
              />

              <View style={styles.field}>
                <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
                  Their email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="friend@example.com"
                  placeholderTextColor={t.colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  inputMode="email"
                  style={[
                    styles.input,
                    t.typography.body,
                    {
                      color: t.colors.text,
                      backgroundColor: t.colors.surface,
                      borderColor: t.colors.border,
                    },
                  ]}
                />
              </View>

              <View style={styles.field}>
                <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
                  Their name (optional)
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Alex"
                  placeholderTextColor={t.colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    t.typography.body,
                    {
                      color: t.colors.text,
                      backgroundColor: t.colors.surface,
                      borderColor: t.colors.border,
                    },
                  ]}
                />
              </View>

              <SectionHeader title="What can they protect?" />
              <View style={{ gap: 12 }}>
                <ScopeCard
                  selected={scope === 'ALL'}
                  title="All my KEYHOLDER boxes"
                  blurb="They can approve unlocks for any box you protect with KEYHOLDER, now or later."
                  onPress={() => setScope('ALL')}
                />
                <ScopeCard
                  selected={scope === 'SELECTED'}
                  title="Selected boxes only"
                  blurb="Pick exactly which boxes they cover. You can add or remove boxes later."
                  onPress={() => setScope('SELECTED')}
                />
              </View>

              {scope === 'SELECTED' ? (
                <BoxPicker
                  boxes={boxes}
                  loading={boxesLoading}
                  error={boxesError}
                  reload={loadBoxes}
                  selected={selectedBoxIds}
                  onToggle={toggleBox}
                />
              ) : null}

              {submitError ? (
                <AppCard tone="warning">
                  <Text style={[t.typography.body, { color: t.colors.badge.dangerText }]}>
                    {submitError}
                  </Text>
                </AppCard>
              ) : null}

              <ActionButton
                title={submitting ? 'Sending invite…' : 'Send invite'}
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

function ScopeCard({
  selected,
  title,
  blurb,
  onPress,
}: {
  selected: boolean;
  title: string;
  blurb: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <AppCard tone={selected ? 'accent' : 'default'}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>{title}</Text>
            <Text
              style={[
                t.typography.caption,
                { color: t.colors.textMuted, marginTop: 2 },
              ]}
            >
              {blurb}
            </Text>
          </View>
          {selected ? (
            <Ionicons name="checkmark-circle" size={20} color={t.colors.accent} />
          ) : null}
        </View>
      </AppCard>
    </Pressable>
  );
}

function BoxPicker({
  boxes,
  loading,
  error,
  reload,
  selected,
  onToggle,
}: {
  boxes: Box[] | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const t = useTheme();
  if (loading) return <LoadingState caption="Loading your boxes…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!boxes || boxes.length === 0) {
    return (
      <AppCard tone="subtle">
        <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
          You don’t have any non-wallet boxes yet. Pick "All my KEYHOLDER boxes"
          for now — anything you create later can be covered.
        </Text>
      </AppCard>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <SectionHeader title="Pick boxes" />
      {boxes.map((b) => {
        const isOn = selected.has(b.id);
        return (
          <Pressable
            key={b.id}
            onPress={() => onToggle(b.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isOn }}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <AppCard tone={isOn ? 'accent' : 'default'}>
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
                    Currently {b.lockType.toLowerCase()}
                  </Text>
                </View>
                <Ionicons
                  name={isOn ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={isOn ? t.colors.accent : t.colors.textMuted}
                />
              </View>
            </AppCard>
          </Pressable>
        );
      })}
    </View>
  );
}

function SuccessCard({
  email,
  onDone,
}: {
  email: string;
  onDone: () => void;
}) {
  const t = useTheme();
  return (
    <AppCard tone="accent">
      <View style={styles.successRow}>
        <View
          style={[
            styles.successIcon,
            { backgroundColor: t.colors.badge.successBg },
          ]}
        >
          <Ionicons name="mail" size={22} color={t.colors.badge.successText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.h2, { color: t.colors.text }]}>
            Invite sent
          </Text>
          <Text
            style={[
              t.typography.body,
              { color: t.colors.textMuted, marginTop: 2 },
            ]}
          >
            {email} will get a one-time link by email. They’ll show up as
            Pending in your Keyholders list until they accept.
          </Text>
        </View>
      </View>
      <ActionButton title="Back to keyholders" onPress={onDone} fullWidth />
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
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  successIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
