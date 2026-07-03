import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useLogout() {
  const { logout } = useAuth();
  const { showSuccess } = useToast();

  const performLogout = useCallback(async () => {
    await logout();
    showSuccess('Signed out', 'You have been logged out successfully.');
    router.replace('/(auth)/login');
  }, [logout, showSuccess]);

  return useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void performLogout();
        },
      },
    ]);
  }, [performLogout]);
}
