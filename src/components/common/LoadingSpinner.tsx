import { ActivityIndicator, StyleSheet } from 'react-native';

import { colors } from '@/constants/colors';

import { Screen } from './Screen';

export function LoadingSpinner() {
  return (
    <Screen layout="full" keyboardAware={false} contentStyle={styles.container}>
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
