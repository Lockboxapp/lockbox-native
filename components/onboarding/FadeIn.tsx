// ============================================================
// components/onboarding/FadeIn.tsx
//
// A restrained entrance animation for onboarding content: a
// short opacity + upward-rise on mount. Pass `delay` to stagger
// a sequence of elements into one orchestrated page-load reveal
// (per the frontend-design skill — one well-timed entrance beats
// scattered micro-animations).
// ============================================================

import { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type FadeInProps = {
  children: ReactNode;
  /** Stagger offset in ms. */
  delay?: number;
  /** Rise distance in px. Defaults to a subtle 12. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

export function FadeIn({ children, delay = 0, offset = 12, style }: FadeInProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 420 }));
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * offset }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
