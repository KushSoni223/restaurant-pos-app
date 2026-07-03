import { Tabs } from 'expo-router';

import { colors } from '@/constants/colors';
import { tabBarIcon } from '@/navigation/tabBarIcon';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: tabBarIcon('stats-chart-outline') }}
      />
      <Tabs.Screen
        name="menu-management"
        options={{ title: 'Menu', tabBarIcon: tabBarIcon('fast-food-outline') }}
      />
      <Tabs.Screen
        name="staff"
        options={{ title: 'Staff', tabBarIcon: tabBarIcon('people-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabBarIcon('settings-outline') }}
      />
    </Tabs>
  );
}
