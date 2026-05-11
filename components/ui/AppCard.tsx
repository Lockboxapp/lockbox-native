import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type AppCardTone = 'default' | 'accent' | 'subtle';

type AppCardProps = {
  children: ReactNode;
  tone?: AppCardTone;
  padding?: number;
  gap?: number;
  withShadow?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Standard card surface used across screens. Pulls colors, radius, and shadow
 * from the theme so cards stay visually consistent and switch correctly
 * between light and dark mode.
 */
export function AppCard({
  children,
  tone = 'default',
  padding,
  gap,
  withShadow = true,
  style,
}: AppCardProps) {
  const t = useTheme();

  const backgroundColor =
    tone === 'accent' ? t.colors.surfaceAccent : tone === 'subtle' ? t.colors.surfaceSubtle : t.colors.surface;

  const borderColor = tone === 'accent' ? t.colors.accentSoft : t.colors.border;

  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor,
          borderWidth: 1,
          borderRadius: t.radius.xl,
          padding: padding ?? t.spacing.lg,
          gap: gap ?? t.spacing.md,
        },
        withShadow && t.mode === 'light' ? t.colors.shadow : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
