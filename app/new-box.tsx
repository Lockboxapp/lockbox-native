// ============================================================
// app/new-box.tsx
//
// 3-step box creation flow:
//   1. Name
//   2. Protection type (with KEYHOLDER gate — owner must have an
//      ACTIVE keyholder relationship before they can create a
//      KEYHOLDER-protected box, per board decision)
//   3. Optional target amount + target date
//
// On submit calls api.boxes.create() and routes to /box-detail
// with the new box id. The 3 steps stay local; no nested routes.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  Badge,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type { KeyholderRelationship, LockType } from '@/services/types';

type Step = 'name' | 'protection' | 'goal';

const PROTECTION_CARDS: {
  key: LockType;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  blurb: string;
  consequence: string;
}[] = [
  {
    key: 'SOFT',
    icon: 'lock-open-outline',
    label: 'Flexible',
    blurb: 'You control access. Unlock anytime.',
    consequence: 'Best when you just want a clear bucket.',
  },
  {
    key: 'HARD',
    icon: 'lock-closed',
    label: 'Hard Lock',
    blurb: 'Requires a written reason to unlock.',
    consequence: 'Built-in friction. No keyholder needed.',
  },
  {
    key: 'KEYHOLDER',
    icon: 'shield-checkmark',
    label: 'Keyholder',
    blurb: 'A trusted person approves every unlock.',
    consequence: 'Maximum protection.',
  },
];

export default function NewBoxScreen() {
  const t = useTheme();
  const [step, setStep] = useState<Step>('name');

  // Step 1 — name
  const [name, setName] = useState('');

  // Step 2 — protection + optional keyholder
  const [lockType, setLockType] = useState<LockType | null>(null);
  const [keyholders, setKeyholders] = useState<KeyholderRelationship[] | null>(
    null,
  );
  const [keyholdersLoading, setKeyholdersLoading] = useState(false);
  const [keyholdersError, setKeyholdersError] = useState<string | null>(null);
  const [selectedKeyholderId, setSelectedKeyholderId] = useState<string | null>(
    null,
  );

  // Step 3 — goal
  const [targetDollarsText, setTargetDollarsText] = useState('');
  const [targetDateText, setTargetDateText] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeKeyholders = useMemo(
    () => (keyholders ?? []).filter((k) => k.status === 'ACTIVE'),
    [keyholders],
  );

  const loadKeyholders = useCallback(async () => {
    setKeyholdersLoading(true);
    setKeyholdersError(null);
    try {
      const res = await api.keyholders.list();
      setKeyholders(res);
    } catch (e) {
      setKeyholdersError(
        e instanceof ApiError ? e.message : 'Could not load keyholders.',
      );
    } finally {
      setKeyholdersLoading(false);
    }
  }, []);

  // Lazy-load keyholders only when KEYHOLDER is picked.
  useEffect(() => {
    if (lockType === 'KEYHOLDER' && keyholders === null) {
      loadKeyholders();
    }
  }, [lockType, keyholders, loadKeyholders]);

  const nameValid = name.trim().length > 0 && name.trim().length <= 50;

  const canAdvanceFromProtection =
    lockType !== null &&
    (lockType !== 'KEYHOLDER' || selectedKeyholderId != null);

  function parseTargetCents(): number | undefined {
    const n = Number(targetDollarsText);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return Math.round(n * 100);
  }

  function parseTargetDate(): string | undefined {
    const trimmed = targetDateText.trim();
    if (!trimmed) return undefined;
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  async function onSubmit() {
    if (submitting) return;
    if (!nameValid || !lockType) return;
    if (lockType === 'KEYHOLDER' && !selectedKeyholderId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await api.boxes.create({
        name: name.trim(),
        lockType,
        targetAmountCents: parseTargetCents(),
        targetDate: parseTargetDate(),
        keyholderRelationshipId:
          lockType === 'KEYHOLDER' ? selectedKeyholderId ?? undefined : undefined,
      });
      router.replace({
        pathname: '/box-detail',
        params: { id: created.id },
      });
    } catch (e) {
      setSubmitError(
        e instanceof ApiError ? e.message : 'Could not create box.',
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
        <ScreenHeader
          title="New box"
          onBack={() => {
            if (step === 'protection') setStep('name');
            else if (step === 'goal') setStep('protection');
            else router.back();
          }}
        />
        <AppScreen edges={['left', 'right']}>
          <StepIndicator step={step} />

          {step === 'name' ? (
            <NameStep
              name={name}
              onChange={setName}
              onNext={() => setStep('protection')}
              canAdvance={nameValid}
            />
          ) : step === 'protection' ? (
            <ProtectionStep
              lockType={lockType}
              setLockType={setLockType}
              keyholders={activeKeyholders}
              keyholdersLoading={keyholdersLoading}
              keyholdersError={keyholdersError}
              reloadKeyholders={loadKeyholders}
              selectedKeyholderId={selectedKeyholderId}
              setSelectedKeyholderId={setSelectedKeyholderId}
              onNext={() => setStep('goal')}
              canAdvance={canAdvanceFromProtection}
            />
          ) : (
            <GoalStep
              name={name}
              lockType={lockType!}
              targetDollarsText={targetDollarsText}
              setTargetDollarsText={setTargetDollarsText}
              targetDateText={targetDateText}
              setTargetDateText={setTargetDateText}
              submitting={submitting}
              submitError={submitError}
              onSubmit={onSubmit}
            />
          )}
        </AppScreen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const t = useTheme();
  const stepIdx = step === 'name' ? 0 : step === 'protection' ? 1 : 2;
  return (
    <View style={styles.stepRow}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            {
              backgroundColor:
                i <= stepIdx ? t.colors.accent : t.colors.surfaceSubtle,
            },
          ]}
        />
      ))}
    </View>
  );
}

function NameStep({
  name,
  onChange,
  onNext,
  canAdvance,
}: {
  name: string;
  onChange: (v: string) => void;
  onNext: () => void;
  canAdvance: boolean;
}) {
  const t = useTheme();
  return (
    <>
      <SectionHeader
        eyebrow="Step 1 of 3"
        title="Name this box"
        subtitle="A clear name makes it easier to know what you're protecting."
        size="page"
      />
      <View style={styles.field}>
        <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
          Box name
        </Text>
        <TextInput
          value={name}
          onChangeText={(v) => onChange(v.slice(0, 50))}
          placeholder="Rent, Bills, Emergency Fund…"
          placeholderTextColor={t.colors.textMuted}
          autoFocus
          maxLength={50}
          returnKeyType="next"
          onSubmitEditing={() => canAdvance && onNext()}
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
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          {50 - name.length} characters left
        </Text>
      </View>
      <ActionButton
        title="Next"
        onPress={onNext}
        disabled={!canAdvance}
        fullWidth
      />
    </>
  );
}

function ProtectionStep({
  lockType,
  setLockType,
  keyholders,
  keyholdersLoading,
  keyholdersError,
  reloadKeyholders,
  selectedKeyholderId,
  setSelectedKeyholderId,
  onNext,
  canAdvance,
}: {
  lockType: LockType | null;
  setLockType: (v: LockType) => void;
  keyholders: KeyholderRelationship[];
  keyholdersLoading: boolean;
  keyholdersError: string | null;
  reloadKeyholders: () => void;
  selectedKeyholderId: string | null;
  setSelectedKeyholderId: (v: string | null) => void;
  onNext: () => void;
  canAdvance: boolean;
}) {
  const t = useTheme();
  return (
    <>
      <SectionHeader
        eyebrow="Step 2 of 3"
        title="Pick a protection type"
        subtitle="How hard should this money be to access?"
        size="page"
      />
      <View style={{ gap: 12 }}>
        {PROTECTION_CARDS.map((card) => {
          const selected = lockType === card.key;
          return (
            <Pressable
              key={card.key}
              onPress={() => {
                setLockType(card.key);
                if (card.key !== 'KEYHOLDER') setSelectedKeyholderId(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <AppCard tone={selected ? 'accent' : 'default'}>
                <View style={styles.cardHead}>
                  <View
                    style={[
                      styles.cardIcon,
                      {
                        backgroundColor: selected
                          ? t.colors.accent
                          : t.colors.surfaceSubtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name={card.icon}
                      size={18}
                      color={selected ? t.colors.onAccent : t.colors.text}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[t.typography.h2, { color: t.colors.text }]}
                    >
                      {card.label}
                    </Text>
                    <Text
                      style={[
                        t.typography.body,
                        { color: t.colors.textMuted, marginTop: 2 },
                      ]}
                    >
                      {card.blurb}
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
                <Text
                  style={[t.typography.caption, { color: t.colors.textMuted }]}
                >
                  {card.consequence}
                </Text>
              </AppCard>
            </Pressable>
          );
        })}
      </View>

      {lockType === 'KEYHOLDER' ? (
        <KeyholderPicker
          keyholders={keyholders}
          loading={keyholdersLoading}
          error={keyholdersError}
          reload={reloadKeyholders}
          selectedKeyholderId={selectedKeyholderId}
          onSelect={setSelectedKeyholderId}
        />
      ) : null}

      <ActionButton
        title="Next"
        onPress={onNext}
        disabled={!canAdvance}
        fullWidth
      />
    </>
  );
}

function KeyholderPicker({
  keyholders,
  loading,
  error,
  reload,
  selectedKeyholderId,
  onSelect,
}: {
  keyholders: KeyholderRelationship[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  selectedKeyholderId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTheme();
  if (loading) return <LoadingState caption="Loading keyholders…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (keyholders.length === 0) {
    return (
      <AppCard tone="warning">
        <Text style={[t.typography.title, { color: t.colors.text }]}>
          You need an active keyholder first
        </Text>
        <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
          KEYHOLDER boxes require a trusted person who can approve unlocks.
          Add one now and come back to finish this box.
        </Text>
        <ActionButton
          title="Add a keyholder"
          variant="secondary"
          onPress={() => router.push('/new-keyholder')}
        />
      </AppCard>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <SectionHeader title="Choose a keyholder" />
      {keyholders.map((rel) => {
        const selected = rel.id === selectedKeyholderId;
        return (
          <Pressable
            key={rel.id}
            onPress={() => onSelect(rel.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <AppCard tone={selected ? 'accent' : 'default'}>
              <View style={styles.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                    {rel.profile.name ?? rel.profile.email}
                  </Text>
                  <Text
                    style={[
                      t.typography.caption,
                      { color: t.colors.textMuted, marginTop: 2 },
                    ]}
                  >
                    {rel.profile.email} · {rel.scopeType === 'ALL' ? 'All boxes' : 'Selected boxes'}
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
  );
}

function GoalStep({
  name,
  lockType,
  targetDollarsText,
  setTargetDollarsText,
  targetDateText,
  setTargetDateText,
  submitting,
  submitError,
  onSubmit,
}: {
  name: string;
  lockType: LockType;
  targetDollarsText: string;
  setTargetDollarsText: (v: string) => void;
  targetDateText: string;
  setTargetDateText: (v: string) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const t = useTheme();
  return (
    <>
      <SectionHeader
        eyebrow="Step 3 of 3"
        title="Set a goal (optional)"
        subtitle="A target helps you see progress. You can add or change this later."
        size="page"
      />
      <AppCard tone="subtle">
        <Text style={[t.typography.eyebrow, { color: t.colors.textMuted }]}>
          Summary
        </Text>
        <Text style={[t.typography.h2, { color: t.colors.text }]}>{name}</Text>
        <Badge label={lockTypeLabel(lockType)} variant={lockTypeBadge(lockType)} />
      </AppCard>

      <View style={styles.field}>
        <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
          Target amount (USD, optional)
        </Text>
        <TextInput
          value={targetDollarsText}
          onChangeText={setTargetDollarsText}
          placeholder="500"
          placeholderTextColor={t.colors.textMuted}
          keyboardType="decimal-pad"
          inputMode="decimal"
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
          Target date (YYYY-MM-DD, optional)
        </Text>
        <TextInput
          value={targetDateText}
          onChangeText={setTargetDateText}
          placeholder="2026-08-15"
          placeholderTextColor={t.colors.textMuted}
          autoCapitalize="none"
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

      {submitError ? (
        <AppCard tone="warning">
          <Text style={[t.typography.body, { color: t.colors.badge.dangerText }]}>
            {submitError}
          </Text>
        </AppCard>
      ) : null}

      <View style={styles.actions}>
        <ActionButton
          title={submitting ? 'Creating…' : 'Create box'}
          onPress={onSubmit}
          disabled={submitting}
          fullWidth
        />
        <Text
          style={[
            t.typography.caption,
            { color: t.colors.textMuted, textAlign: 'center' },
          ]}
        >
          You can add a goal later from the box detail screen.
        </Text>
      </View>
    </>
  );
}

function lockTypeLabel(t: LockType): string {
  return t === 'SOFT' ? 'Flexible' : t === 'HARD' ? 'Fully Locked' : 'Keyholder';
}

function lockTypeBadge(
  t: LockType,
): 'flexible' | 'locked' | 'keyholder' {
  return t === 'SOFT' ? 'flexible' : t === 'HARD' ? 'locked' : 'keyholder';
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
  stepRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: 8,
  },
});
