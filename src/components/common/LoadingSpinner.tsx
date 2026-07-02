import { ActivityIndicator, StyleSheet } from 'react-native';

import { colors } from '@/constants/colors';

import { SAFE_AREA_FULL, Screen } from './Screen';

export function LoadingSpinner() {
  return (
    <Screen edges={SAFE_AREA_FULL} keyboardAware={false} contentStyle={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
