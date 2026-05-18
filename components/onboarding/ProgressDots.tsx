// ============================================================
// components/onboarding/ProgressDots.tsx
//
// Step indicator for the onboarding funnel. Filled (accent) for
// completed + current steps, muted for upcoming. Rendered by the
// onboarding shell header — Welcome and Locked In show no dots.
// ============================================================

import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type ProgressDotsProps = {
  /** 1-based index of the current step. */
  current: number;
  /** Total dotted steps. */
  total: number;
};

export function ProgressDots({ current, total }: ProgressDotsProps) {
  const t = useTheme();
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      {Array.from({ length: total }, (_, i) => {
        const reached = i + 1 <= current;
        const isCurrent = i + 1 === current;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: reached
                  ? t.colors.accent
                  : t.colors.surfaceSubtle,
                width: isCurrent ? 22 : 7,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: 999,
  },
});
