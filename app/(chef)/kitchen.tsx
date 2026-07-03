import { StyleSheet, Text } from 'react-native';

import { Button, SAFE_AREA_STACK, Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';
import { useLogout } from '@/hooks/useLogout';

export default function ChefKitchenScreen() {
  const handleLogout = useLogout();

  return (
    <Screen edges={SAFE_AREA_STACK} contentStyle={styles.content}>
      <ScreenHeader title="Kitchen Display" subtitle="Incoming orders and prep status" />
      <Text style={styles.placeholder}>Chef — kitchen queue screen</Text>
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
