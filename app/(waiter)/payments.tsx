import { StyleSheet, Text } from 'react-native';

import { Button, SAFE_AREA_TAB, Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';
import { useLogout } from '@/hooks/useLogout';

export default function WaiterPaymentsScreen() {
  const handleLogout = useLogout();

  return (
    <Screen edges={SAFE_AREA_TAB} contentStyle={styles.content}>
      <ScreenHeader title="Payments" subtitle="Process bills and split checks" />
      <Text style={styles.placeholder}>Waiter POS — payments screen</Text>
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
