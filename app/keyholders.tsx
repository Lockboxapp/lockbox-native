// ============================================================
// app/keyholders.tsx
//
// First-class keyholder management surface. List of all
// relationships (PENDING / ACTIVE / REVOKED), with:
//   - PENDING entries clearly labelled so the owner understands
//     why they can't yet be used for box creation
//   - ACTIVE entries removable via a warning sheet that lists
//     the affected KEYHOLDER boxes
//   - "+ Add keyholder" CTA → /new-keyholder
//
// Empty state per board rule. Pull-to-refresh. Loading + error.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
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
  type BadgeVariant,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type {
  KeyholderRelationship,
  KeyholderRelationshipStatus,
} from '@/services/types';

const statusLabel: Record<KeyholderRelationshipStatus, string> = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  REVOKED: 'Revoked',
};

const statusVariant: Record<KeyholderRelationshipStatus, BadgeVariant> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  PAUSED: 'neutral',
  REVOKED: 'neutral',
};

export default function KeyholdersScreen() {
  const t = useTheme();
  const [relationships, setRelationships] = useState<KeyholderRelationship[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<KeyholderRelationship | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.keyholders.list();
      setRelationships(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load keyholders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  async function confirmRemove() {
    if (!removeTarget || removing) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await api.keyholders.remove(removeTarget.id);
      setRemoveTarget(null);
      load('refresh');
    } catch (e) {
      setRemoveError(
        e instanceof ApiError ? e.message : 'Could not remove keyholder.',
      );
    } finally {
      setRemoving(false);
    }
  }

  const visible = (relationships ?? []).filter((r) => r.status !== 'REVOKED');

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: t.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScreenHeader title="Keyholders" onBack={() => router.back()} />
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
          eyebrow="Settings"
          title="Your keyholders"
          subtitle="Trusted people who approve unlocks on your KEYHOLDER boxes."
          size="page"
          trailing={
            <ActionButton
              title="+ Add"
              variant="secondary"
              onPress={() => router.push('/new-keyholder')}
            />
          }
        />

        {loading ? (
          <LoadingState caption="Loading keyholders…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load('initial')} />
        ) : visible.length === 0 ? (
          <AppCard tone="subtle">
            <Text style={[t.typography.title, { color: t.colors.text }]}>
              No keyholders yet
            </Text>
            <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
              Add one to create protected boxes. You can have more than one — a
              KEYHOLDER box can be covered by multiple people.
            </Text>
            <ActionButton
              title="Add a keyholder"
              onPress={() => router.push('/new-keyholder')}
            />
          </AppCard>
        ) : (
          <View style={{ gap: 12 }}>
            {visible.map((rel) => (
              <RelationshipCard
                key={rel.id}
                relationship={rel}
                onRemove={() => {
                  setRemoveError(null);
                  setRemoveTarget(rel);
                }}
              />
            ))}
          </View>
        )}
      </AppScreen>

      <Modal
        visible={removeTarget != null}
        animationType="slide"
        transparent
        onRequestClose={() => setRemoveTarget(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => !removing && setRemoveTarget(null)}
          accessibilityLabel="Close"
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
              Remove keyholder
            </Text>
            <Text style={[t.typography.h2, { color: t.colors.text }]}>
              {removeTarget?.profile.name ?? removeTarget?.profile.email} will
              stop being a keyholder.
            </Text>
            <Text style={[t.typography.body, { color: t.colors.text }]}>
              Any KEYHOLDER boxes they protect will still be locked, but they
              will need a new keyholder assigned before you can request an
              unlock.
            </Text>
            <AffectedBoxesPreview rel={removeTarget} />
            {removeError ? (
              <Text style={[t.typography.body, { color: t.colors.badge.dangerText }]}>
                {removeError}
              </Text>
            ) : null}
            <View style={styles.sheetActions}>
              <ActionButton
                title="Cancel"
                variant="ghost"
                onPress={() => setRemoveTarget(null)}
                disabled={removing}
              />
              <ActionButton
                title={removing ? 'Removing…' : 'Yes, remove'}
                onPress={confirmRemove}
                disabled={removing}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RelationshipCard({
  relationship,
  onRemove,
}: {
  relationship: KeyholderRelationship;
  onRemove: () => void;
}) {
  const t = useTheme();
  const r = relationship;
  const affectedNames = r.boxes
    .filter((b) => !b.box.isClosed)
    .map((b) => b.box.name);
  return (
    <AppCard>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[t.typography.h2, { color: t.colors.text }]}>
            {r.profile.name ?? r.profile.email}
          </Text>
          <Text
            style={[
              t.typography.caption,
              { color: t.colors.textMuted, marginTop: 2 },
            ]}
          >
            {r.profile.email}
          </Text>
        </View>
        <Badge label={statusLabel[r.status]} variant={statusVariant[r.status]} />
      </View>
      <Text style={[t.typography.body, { color: t.colors.text }]}>
        Scope · {r.scopeType === 'ALL' ? 'All KEYHOLDER boxes' : 'Selected boxes'}
      </Text>
      {r.scopeType === 'SELECTED' ? (
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          {affectedNames.length === 0
            ? 'No active boxes attached yet.'
            : affectedNames.join(', ')}
        </Text>
      ) : null}
      {r.status === 'PENDING' ? (
        <AppCard tone="warning">
          <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
            Invite not accepted yet
          </Text>
          <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
            We sent the invite by email. Until {r.profile.name ?? 'they'} accept,
            you can’t pick them when creating or changing a KEYHOLDER box.
          </Text>
        </AppCard>
      ) : null}
      {r.status === 'ACTIVE' ? (
        <View style={styles.cardActions}>
          <ActionButton title="Remove" variant="secondary" onPress={onRemove} />
        </View>
      ) : null}
    </AppCard>
  );
}

function AffectedBoxesPreview({
  rel,
}: {
  rel: KeyholderRelationship | null;
}) {
  const t = useTheme();
  if (!rel) return null;
  const names = rel.boxes
    .filter((b) => !b.box.isClosed)
    .map((b) => b.box.name);
  if (rel.scopeType === 'ALL') {
    return (
      <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
        Covers all your KEYHOLDER boxes. We’ll surface each one that needs a new
        keyholder after this change.
      </Text>
    );
  }
  if (names.length === 0) {
    return (
      <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
        No active boxes are attached to this keyholder.
      </Text>
    );
  }
  return (
    <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
      Affected boxes: {names.join(', ')}
    </Text>
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardActions: {
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
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
