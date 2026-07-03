import { Stack } from 'expo-router';

import { SplashGate } from '@/components/splash';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SplashGate>
          <Stack screenOptions={{ headerShown: false }} />
        </SplashGate>
      </ToastProvider>
    </AuthProvider>
  );
}
