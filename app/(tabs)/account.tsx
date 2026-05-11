import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  ActionButton,
  AppCard,
  AppScreen,
  Badge,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type { UserProfileResponse } from '@/services/types';
import { formatCents, formatShortDate } from '@/utils/format';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type SettingItem = { label: string; meta?: string; icon: IoniconName };

const personalSettings = (counts: UserProfileResponse['counts']): SettingItem[] => [
  { label: 'Profile', meta: 'Name, email, phone', icon: 'person-outline' },
  {
    label: 'Connected banks',
    meta:
      counts.connectedBanksCount === 1
        ? '1 connected'
        : `${counts.connectedBanksCount} connected`,
    icon: 'card-outline',
  },
  {
    label: 'Keyholders',
    meta:
      counts.keyholdersCount === 1
        ? '1 active'
        : `${counts.keyholdersCount} active`,
    icon: 'key-outline',
  },
  {
    label: 'My boxes',
    meta: counts.boxCount === 1 ? '1 box' : `${counts.boxCount} boxes`,
    icon: 'cube-outline',
  },
];

const appSettings: SettingItem[] = [
  { label: 'Appearance', meta: 'System', icon: 'contrast-outline' },
  { label: 'Notifications', icon: 'notifications-outline' },
  { label: 'Privacy & security', icon: 'shield-checkmark-outline' },
];

const support: SettingItem[] = [
  { label: 'Help & feedback', icon: 'help-circle-outline' },
  { label: 'Terms & privacy', icon: 'document-text-outline' },
];

export default function AccountScreen() {
  const t = useTheme();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.account.profile();
      setProfile(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <AppScreen
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
        title="Account"
        subtitle="Profile, plan, connected banks, and support."
        size="page"
      />

      {loading ? (
        <LoadingState caption="Loading your profile…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load('initial')} />
      ) : profile ? (
        <>
          <AppCard>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: t.colors.accent }]}>
                <Text
                  style={[
                    t.typography.h1,
                    { color: t.colors.onAccent, fontFamily: t.fontFamily.sansBold },
                  ]}
                >
                  {avatarInitials(profile.user.name, profile.user.email)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[t.typography.h2, { color: t.colors.text }]}>
                    {profile.user.name ?? 'LockBox member'}
                  </Text>
                  <Badge label={profile.subscription.plan} variant="success" />
                </View>
                <Text
                  style={[
                    t.typography.body,
                    { color: t.colors.textMuted, marginTop: 2 },
                  ]}
                >
                  {profile.user.email ?? '—'}
                </Text>
              </View>
            </View>
          </AppCard>

          <AppCard tone="accent">
            <View style={styles.subRow}>
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.eyebrow, { color: t.colors.accent }]}>
                  Subscription
                </Text>
                <Text
                  style={[
                    t.typography.h2,
                    { color: t.colors.text, marginTop: 4 },
                  ]}
                >
                  LockBox {profile.subscription.plan}
                </Text>
                <Text
                  style={[
                    t.typography.body,
                    { color: t.colors.textMuted, marginTop: 2 },
                  ]}
                >
                  {subscriptionMeta(profile.subscription)}
                </Text>
              </View>
              <Badge label={prettyStatus(profile.subscription.status)} variant="success" />
            </View>
            <ActionButton title="Manage plan" variant="secondary" fullWidth />
          </AppCard>

          <SettingsGroup title="Personal" items={personalSettings(profile.counts)} />
          <SettingsGroup title="App" items={appSettings} />
          <SettingsGroup title="Support" items={support} />

          <View style={{ marginTop: 4 }}>
            <ActionButton
              title={signingOut ? 'Signing out…' : 'Sign out'}
              variant="ghost"
              fullWidth
              onPress={onSignOut}
              disabled={signingOut}
            />
          </View>

          <Text style={[t.typography.caption, styles.footer, { color: t.colors.textMuted }]}>
            LockBox · v{version}
          </Text>
        </>
      ) : null}
    </AppScreen>
  );
}

function SettingsGroup({ title, items }: { title: string; items: SettingItem[] }) {
  const t = useTheme();
  return (
    <View style={styles.group}>
      <SectionHeader title={title} />
      <AppCard gap={0} padding={0}>
        {items.map((item, idx) => (
          <View
            key={item.label}
            style={[
              styles.settingRow,
              {
                paddingHorizontal: t.spacing.lg,
                paddingVertical: t.spacing.md + 2,
                borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: t.colors.divider,
              },
            ]}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: t.colors.surfaceSubtle, borderColor: t.colors.border },
              ]}
            >
              <Ionicons name={item.icon} size={16} color={t.colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                {item.label}
              </Text>
              {item.meta ? (
                <Text
                  style={[
                    t.typography.caption,
                    { color: t.colors.textMuted, marginTop: 2 },
                  ]}
                >
                  {item.meta}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.colors.textMuted} />
          </View>
        ))}
      </AppCard>
    </View>
  );
}

function avatarInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? '';
    const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';
    return (a + b).toUpperCase() || 'LB';
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'LB';
}

function subscriptionMeta(sub: UserProfileResponse['subscription']): string {
  const price = sub.priceCents > 0 ? `${formatCents(sub.priceCents)}/mo` : 'Free';
  const renews = sub.renewsAt ? ` · Renews ${formatShortDate(sub.renewsAt)}` : '';
  return `${price}${renews}`;
}

function prettyStatus(status: UserProfileResponse['subscription']['status']): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'canceled':
      return 'Canceled';
    case 'past_due':
      return 'Past due';
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  group: {
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: 12,
  },
});
