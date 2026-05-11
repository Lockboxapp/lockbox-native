import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppCard, AppScreen, Badge, SectionHeader } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type SettingItem = { label: string; meta?: string; icon: IoniconName };

const personalSettings: SettingItem[] = [
  { label: 'Profile', meta: 'Name, email, phone', icon: 'person-outline' },
  { label: 'Connected banks', meta: '2 connected', icon: 'card-outline' },
  { label: 'Keyholders', meta: '1 active', icon: 'key-outline' },
  { label: 'My boxes', meta: '6 boxes', icon: 'cube-outline' },
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
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <AppScreen>
      <SectionHeader
        eyebrow="Settings"
        title="Account"
        subtitle="Profile, plan, connected banks, and support."
        size="page"
      />

      <AppCard>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: t.colors.accent }]}>
            <Text
              style={[
                t.typography.h1,
                { color: t.colors.onAccent, fontFamily: t.fontFamily.sansBold },
              ]}
            >
              DG
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[t.typography.h2, { color: t.colors.text }]}>Darian Garrett</Text>
              <Badge label="Plus" variant="success" />
            </View>
            <Text style={[t.typography.body, { color: t.colors.textMuted, marginTop: 2 }]}>
              dgarrett.atl@gmail.com
            </Text>
          </View>
        </View>
      </AppCard>

      <AppCard tone="accent">
        <View style={styles.subRow}>
          <View style={{ flex: 1 }}>
            <Text style={[t.typography.eyebrow, { color: t.colors.accent }]}>Subscription</Text>
            <Text style={[t.typography.h2, { color: t.colors.text, marginTop: 4 }]}>
              LockBox Plus
            </Text>
            <Text style={[t.typography.body, { color: t.colors.textMuted, marginTop: 2 }]}>
              Renews May 28 · $9.99/mo
            </Text>
          </View>
          <Badge label="Active" variant="success" />
        </View>
        <ActionButton title="Manage plan" variant="secondary" fullWidth />
      </AppCard>

      <SettingsGroup title="Personal" items={personalSettings} />
      <SettingsGroup title="App" items={appSettings} />
      <SettingsGroup title="Support" items={support} />

      <View style={{ marginTop: 4 }}>
        <ActionButton title="Sign out" variant="ghost" fullWidth />
      </View>

      <Text style={[t.typography.caption, styles.footer, { color: t.colors.textMuted }]}>
        LockBox · v{version}
      </Text>
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
              <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>{item.label}</Text>
              {item.meta ? (
                <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: 2 }]}>
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
