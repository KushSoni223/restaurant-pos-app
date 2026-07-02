import { Stack } from 'expo-router';

import { colors } from '@/constants/colors';

export default function ChefLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.primary,
        title: 'Kitchen Display',
      }}
    >
      <Stack.Screen name="kitchen" options={{ title: 'Kitchen Queue' }} />
    </Stack>
  );
}
