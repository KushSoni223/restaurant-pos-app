import { Tabs } from 'expo-router';

import { colors } from '@/constants/colors';
import { tabBarIcon } from '@/navigation/tabBarIcon';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="menu"
        options={{ title: 'Menu', tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: 'Cart', tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} /> }}  
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} /> }} 
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
