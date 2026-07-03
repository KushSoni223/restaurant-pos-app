import { Tabs } from 'expo-router';

import { colors } from '@/constants/colors';
import { tabBarIcon } from '@/navigation/tabBarIcon';

export default function WaiterLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="tables"
        options={{ title: 'Tables', tabBarIcon: tabBarIcon('grid-outline') }}
      />
      <Tabs.Screen
        name="take-order"
        options={{ title: 'Take Order', tabBarIcon: tabBarIcon('add-circle-outline') }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: tabBarIcon('list-outline') }}
      />
      <Tabs.Screen
        name="payments"
        options={{ title: 'Payments', tabBarIcon: tabBarIcon('card-outline') }}
      />
    </Tabs>
  );
}
