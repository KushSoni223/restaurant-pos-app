import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { logo } from '@/constants/assets';

interface AppLogoProps {
  size?: number;
  showWordmark?: boolean;
  style?: ViewStyle;
}

export function AppLogo({ size = 80, showWordmark = false, style }: AppLogoProps) {
  const radius = Math.round(size * 0.22);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={logo}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
        resizeMode="cover"
        accessibilityLabel="TableTap logo"
      />
      {showWordmark ? (
        <View style={styles.wordmark}>
          <Text style={styles.brand}>TableTap</Text>
          <Text style={styles.tagline}>Restaurant POS</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  image: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  wordmark: {
    alignItems: 'center',
    marginTop: 20,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 4,
    fontSize: 15,
    color: colors.authHeaderMuted,
    fontWeight: '500',
  },
});
