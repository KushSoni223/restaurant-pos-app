import { Tabs } from 'expo-router';

import { colors } from '@/constants/colors';

export default function WaiterLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="tables" options={{ title: 'Tables' }} />
      <Tabs.Screen name="take-order" options={{ title: 'Take Order' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="payments" options={{ title: 'Payments' }} />
    </Tabs>
  );
}
