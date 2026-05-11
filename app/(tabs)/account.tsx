import { StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppCard, AppScreen, Badge, SectionHeader } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

type SettingItem = { label: string; meta?: string };

const personalSettings: SettingItem[] = [
  { label: 'Profile', meta: 'Name, email, phone' },
  { label: 'Connected Banks', meta: '2 connected' },
  { label: 'Keyholders', meta: '1 active' },
  { label: 'My Boxes', meta: '6 boxes' },
];

const appSettings: SettingItem[] = [
  { label: 'Appearance', meta: 'System' },
  { label: 'Notifications' },
  { label: 'Privacy & Security' },
];

const support: SettingItem[] = [
  { label: 'Help & Feedback' },
  { label: 'Terms & Privacy' },
];

export default function AccountScreen() {
  const t = useTheme();

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
            <Text style={[t.typography.h1, { color: t.colors.onAccent }]}>DG</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[t.typography.h2, { color: t.colors.text }]}>Darian Garrett</Text>
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
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: t.colors.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>{item.label}</Text>
              {item.meta ? (
                <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: 2 }]}>
                  {item.meta}
                </Text>
              ) : null}
            </View>
            <Text style={[t.typography.body, { color: t.colors.textMuted }]}>›</Text>
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
});
