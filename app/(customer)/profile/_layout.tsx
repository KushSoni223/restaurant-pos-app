import { Stack } from 'expo-router';

import { colors } from '@/constants/colors';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="view" options={{ title: 'View Profile' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
    </Stack>
  );
}
