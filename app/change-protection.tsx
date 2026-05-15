// ============================================================
// app/change-protection.tsx
//
// Change a box's protection type. Same three-card selector as
// new-box Step 2 + extra guard rails:
//
//   - Cannot change while status=LOCKED / UNLOCK_PENDING
//   - Cannot change inside an active temporary unlock window
//   - Changing TO KEYHOLDER requires picking an active keyholder
//     relationship that covers this box (server attaches it on
//     the lock call if scope is SELECTED)
//   - Changing FROM KEYHOLDER triggers an extra confirmation
//     sheet with plain-English warning copy (board rule)
//
// Submits via api.boxes.lock(). On success, back-navigate to
// box detail so the new state is rendered fresh.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
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
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type {
  Box,
  KeyholderRelationship,
  LockType,
} from '@/services/types';

const PROTECTION_CARDS: {
  key: LockType;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  blurb: string;
}[] = [
  {
    key: 'SOFT',
    icon: 'lock-open-outline',
    label: 'Flexible',
    blurb: 'You control access. Unlock anytime.',
  },
  {
    key: 'HARD',
    icon: 'lock-closed',
    label: 'Hard Lock',
    blurb: 'Requires a written reason to unlock.',
  },
  {
    key: 'KEYHOLDER',
    icon: 'shield-checkmark',
    label: 'Keyholder',
    blurb: 'A trusted person approves every unlock.',
  },
];

export default function ChangeProtectionScreen() {
  const t = useTheme();
  const { boxId } = useLocalSearchParams<{ boxId: string }>();
  const [box, setBox] = useState<Box | null>(null);
  const [keyholders, setKeyholders] = useState<KeyholderRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<LockType | null>(null);
  const [selectedKeyholderId, setSelectedKeyholderId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showFromKeyholderWarning, setShowFromKeyholderWarning] =
    useState(false);

  const load = useCallback(async () => {
    if (!boxId) {
      setError('Missing box id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [b, kh] = await Promise.all([
        api.boxes.detail(boxId),
        api.keyholders.list(),
      ]);
      setBox(b);
      setKeyholders(kh);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load box.');
    } finally {
      setLoading(false);
    }
  }, [boxId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeKeyholders = useMemo(
    () => keyholders.filter((k) => k.status === 'ACTIVE'),
    [keyholders],
  );

  const isLockedStatus =
    box != null &&
    (box.status === 'LOCKED' || box.status === 'UNLOCK_PENDING');
  const isTempUnlock = box?.isTemporarilyUnlocked ?? false;
  const isWallet = box?.isWallet ?? false;
  const disabled = isLockedStatus || isTempUnlock || isWallet;

  const isChangeFromKeyholder =
    box?.lockType === 'KEYHOLDER' && targetType !== null && targetType !== 'KEYHOLDER';

  function startSubmit() {
    if (!box || !targetType || submitting) return;
    if (targetType === 'KEYHOLDER' && !selectedKeyholderId) return;
    if (targetType === box.lockType) {
      setSubmitError('That is already this box’s protection type.');
      return;
    }
    if (isChangeFromKeyholder) {
      setShowFromKeyholderWarning(true);
      return;
    }
    void doSubmit();
  }

  async function doSubmit() {
    if (!box || !targetType) return;
    setShowFromKeyholderWarning(false);
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.boxes.lock(box.id, {
        lockType: targetType,
        keyholderRelationshipId:
          targetType === 'KEYHOLDER' ? selectedKeyholderId ?? undefined : undefined,
      });
      router.back();
    } catch (e) {
      setSubmitError(
        e instanceof ApiError ? e.message : 'Could not change protection.',
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
      <ScreenHeader title="Change protection" onBack={() => router.back()} />
      <AppScreen edges={['left', 'right']}>
        {loading ? (
          <LoadingState caption="Loading box…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !box ? null : (
          <>
            <SectionHeader
              eyebrow="Change protection"
              title={box.name}
              subtitle="Pick a new protection type. Server enforces all the guard rails."
              size="page"
            />

            {isWallet ? (
              <AppCard tone="warning">
                <Text style={[t.typography.title, { color: t.colors.text }]}>
                  Wallet protection can’t change
                </Text>
                <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                  Wallet is always liquid by design.
                </Text>
              </AppCard>
            ) : isLockedStatus ? (
              <AppCard tone="warning">
                <Text style={[t.typography.title, { color: t.colors.text }]}>
                  Unlock this box first
                </Text>
                <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                  You can’t change protection while a box is locked or pending review.
                </Text>
              </AppCard>
            ) : isTempUnlock ? (
              <AppCard tone="warning">
                <Text style={[t.typography.title, { color: t.colors.text }]}>
                  Wait for the unlock window to expire
                </Text>
                <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                  Protection can’t change during a temporary unlock. The window
                  will close on its own, then you can change protection.
                </Text>
              </AppCard>
            ) : null}

            <View style={{ gap: 12, opacity: disabled ? 0.4 : 1 }}>
              {PROTECTION_CARDS.map((card) => {
                const isCurrent = card.key === box.lockType;
                const selected = card.key === targetType;
                return (
                  <Pressable
                    key={card.key}
                    onPress={() => {
                      if (disabled || isCurrent) return;
                      setTargetType(card.key);
                      if (card.key !== 'KEYHOLDER') setSelectedKeyholderId(null);
                    }}
                    disabled={disabled || isCurrent}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [pressed && !disabled && { opacity: 0.7 }]}
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
                          <View style={styles.rowBetween}>
                            <Text style={[t.typography.h2, { color: t.colors.text }]}>
                              {card.label}
                            </Text>
                            {isCurrent ? (
                              <Badge label="Current" variant="neutral" />
                            ) : null}
                          </View>
                          <Text
                            style={[
                              t.typography.body,
                              { color: t.colors.textMuted, marginTop: 2 },
                            ]}
                          >
                            {card.blurb}
                          </Text>
                        </View>
                      </View>
                    </AppCard>
                  </Pressable>
                );
              })}
            </View>

            {targetType === 'KEYHOLDER' && !disabled ? (
              <KeyholderPicker
                keyholders={activeKeyholders}
                selectedId={selectedKeyholderId}
                onSelect={setSelectedKeyholderId}
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
              title={submitting ? 'Applying…' : 'Apply change'}
              onPress={startSubmit}
              disabled={
                disabled ||
                submitting ||
                targetType == null ||
                targetType === box.lockType ||
                (targetType === 'KEYHOLDER' && !selectedKeyholderId)
              }
              fullWidth
            />
          </>
        )}
      </AppScreen>

      <Modal
        visible={showFromKeyholderWarning}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFromKeyholderWarning(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowFromKeyholderWarning(false)}
          accessibilityLabel="Close warning"
        />
        <View style={styles.sheetWrap} pointerEvents="box-none">
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: t.colors.surface,
                borderColor: t.colors.borderWarning,
                padding: t.spacing.xl,
                gap: t.spacing.md,
                borderTopLeftRadius: t.radius.xxl,
                borderTopRightRadius: t.radius.xxl,
              },
            ]}
          >
            <View style={styles.handle} />
            <Text style={[t.typography.eyebrow, { color: t.colors.badge.warningText }]}>
              Remove keyholder protection
            </Text>
            <Text style={[t.typography.h2, { color: t.colors.text }]}>
              You’re removing the strongest protection from {box?.name}.
            </Text>
            <Text style={[t.typography.body, { color: t.colors.text }]}>
              No one will need to approve your unlocks after this change. You
              alone will decide when this money can move.
            </Text>
            <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
              You can put this protection back later, but only if you still
              have an active keyholder on file at that time.
            </Text>
            <View style={styles.sheetActions}>
              <ActionButton
                title="Cancel"
                variant="ghost"
                onPress={() => setShowFromKeyholderWarning(false)}
                disabled={submitting}
              />
              <ActionButton
                title={submitting ? 'Applying…' : 'Yes, remove protection'}
                onPress={doSubmit}
                disabled={submitting}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function KeyholderPicker({
  keyholders,
  selectedId,
  onSelect,
}: {
  keyholders: KeyholderRelationship[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTheme();
  if (keyholders.length === 0) {
    return (
      <AppCard tone="warning">
        <Text style={[t.typography.title, { color: t.colors.text }]}>
          You need an active keyholder first
        </Text>
        <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
          Add a keyholder before changing this box to keyholder protection.
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
      <SectionHeader title="Pick a keyholder" />
      {keyholders.map((rel) => {
        const selected = rel.id === selectedId;
        return (
          <Pressable
            key={rel.id}
            onPress={() => onSelect(rel.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <AppCard tone={selected ? 'accent' : 'default'}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                    {rel.profile.name ?? rel.profile.email}
                  </Text>
                  <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: 2 }]}>
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
