import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo, Screen } from '@/components/common';
import { colors } from '@/constants/colors';

interface AuthScreenProps {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthScreen({ title, subtitle, footer, children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <Screen
      edges={['top', 'left', 'right']}
      backgroundColor={colors.authHeader}
      scrollContentStyle={styles.scroll}
      contentStyle={styles.wrapper}
    >
      <View style={styles.hero}>
        <View style={styles.decorCircleLarge} />
        <View style={styles.decorCircleSmall} />
        <AppLogo size={72} style={styles.logo} />
        <Text style={styles.brand}>TableTap</Text>
        <Text style={styles.tagline}>Restaurant POS</Text>
      </View>

      <View style={[styles.card, { paddingBottom: 28 + insets.bottom }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
        {footer}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  wrapper: {
    flex: 1,
    backgroundColor: colors.authHeader,
    paddingBottom: 0,
  },
  hero: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 56,
    overflow: 'hidden',
    backgroundColor: colors.authHeader,
  },
  decorCircleLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
  },
  decorCircleSmall: {
    position: 'absolute',
    bottom: 20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  logo: {
    marginBottom: 16,
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
  card: {
    flex: 1,
    marginTop: -32,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 28,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
