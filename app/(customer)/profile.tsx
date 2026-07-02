import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import { Button, SAFE_AREA_TAB, Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

export default function CustomerProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Screen edges={SAFE_AREA_TAB} contentStyle={styles.content}>
      <ScreenHeader title="Profile" subtitle={`Role: ${user?.role ?? 'CUSTOMER'}`} />
      <Text style={styles.placeholder}>Customer profile screen</Text>
      <Button title="Logout" onPress={handleLogout} variant="secondary" style={styles.logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  placeholder: {
    color: colors.textMuted,
    marginBottom: 24,
  },
  logout: {
    marginTop: 'auto',
  },
});
