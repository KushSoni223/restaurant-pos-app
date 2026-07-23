import { StyleSheet, Text } from 'react-native';

import { Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';

export default function AdminDashboardScreen() {
  return (
    <Screen layout="tab">
      <ScreenHeader title="Dashboard" subtitle="Sales overview and quick stats" />
      <Text style={styles.placeholder}>Admin — dashboard screen</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    color: colors.textMuted,
  },
});
