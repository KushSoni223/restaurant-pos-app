import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';
import { logo } from '@/constants/assets';

interface AnimatedSplashProps {
  exiting: boolean;
  onFinish: () => void;
}

function LoadingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function AnimatedSplash({ exiting, onFinish }: AnimatedSplashProps) {
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);
  const logoScale = useSharedValue(0.3);
  const logoRotate = useSharedValue(-12);
  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(24);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(16);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    logoRotate.value = withSpring(0, { damping: 12, stiffness: 90 });
    brandOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
    brandTranslateY.value = withDelay(350, withSpring(0, { damping: 16, stiffness: 100 }));
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 450 }));
    taglineTranslateY.value = withDelay(600, withSpring(0, { damping: 16, stiffness: 100 }));
    ringOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    ringScale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [
    brandOpacity,
    brandTranslateY,
    glowScale,
    logoRotate,
    logoScale,
    ringOpacity,
    ringScale,
    taglineOpacity,
    taglineTranslateY,
  ]);

  useEffect(() => {
    if (!exiting) return;

    containerOpacity.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onFinish)();
    });
    containerScale.value = withTiming(1.06, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [containerOpacity, containerScale, exiting, onFinish]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
  }));

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value * 0.35,
    transform: [{ scale: ringScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, containerStyle]} pointerEvents={exiting ? 'none' : 'auto'}>
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.logoGlow, glowStyle]} />
        <Animated.View style={[styles.logoMark, logoStyle]}>
          <Image source={logo} style={styles.logoImage} resizeMode="cover" accessibilityLabel="TableTap logo" />
        </Animated.View>

        <Animated.Text style={[styles.brand, brandStyle]}>TableTap</Animated.Text>
        <Animated.Text style={[styles.tagline, taglineStyle]}>Restaurant POS</Animated.Text>
      </View>

      <View style={styles.dots}>
        <LoadingDot delay={0} />
        <LoadingDot delay={150} />
        <LoadingDot delay={300} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.authHeader,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircleLarge: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  decorCircleSmall: {
    position: 'absolute',
    bottom: 120,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  center: {
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  logoGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
  },
  logoMark: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    color: colors.authHeaderMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dots: {
    position: 'absolute',
    bottom: 72,
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
