import { Stack } from 'expo-router';

import { SplashGate } from '@/components/splash';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SplashGate>
        <Stack screenOptions={{ headerShown: false }} />
      </SplashGate>
    </AuthProvider>
  );
}
