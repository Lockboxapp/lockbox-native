import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const tabs: { name: string; title: string; icon: IoniconName; iconActive: IoniconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'boxes', title: 'Boxes', icon: 'cube-outline', iconActive: 'cube' },
  {
    name: 'banker',
    title: 'Banker',
    icon: 'chatbubble-ellipses-outline',
    iconActive: 'chatbubble-ellipses',
  },
  {
    name: 'account',
    title: 'Account',
    icon: 'person-circle-outline',
    iconActive: 'person-circle',
  },
];

export default function TabLayout() {
  const t = useTheme();
  const { token, loading } = useAuth();

  // While the auth context is hydrating from secure storage, render
  // nothing — the splash screen is still up at this point.
  if (loading) return null;
  // No token → kick the user to the login screen. The login screen
  // calls setSession() on success and router.replace's back here.
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.tabActive,
        tabBarInactiveTintColor: t.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: t.colors.tabBackground,
          borderTopColor: t.colors.tabBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 84 : 72,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} color={color} size={size ?? 22} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
