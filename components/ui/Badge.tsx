import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type BadgeVariant =
  | 'flexible'
  | 'locked'
  | 'keyholder'
  | 'neutral'
  | 'warning'
  | 'danger'
  | 'success';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pill-shaped status badge. Variant maps to a themed bg/text pair so badges
 * stay consistent everywhere — especially the box protection-type badges
 * (flexible / locked / keyholder).
 */
export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const t = useTheme();
  const { bg, fg } = pickColors(t.colors.badge, variant);

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          paddingHorizontal: t.spacing.md - 2,
          paddingVertical: 4,
          borderRadius: t.radius.pill,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={[
          t.typography.caption,
          { color: fg, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function pickColors(
  badge: ReturnType<typeof useTheme>['colors']['badge'],
  variant: BadgeVariant,
): { bg: string; fg: string } {
  switch (variant) {
    case 'flexible':
      return { bg: badge.flexibleBg, fg: badge.flexibleText };
    case 'locked':
      return { bg: badge.lockedBg, fg: badge.lockedText };
    case 'keyholder':
      return { bg: badge.keyholderBg, fg: badge.keyholderText };
    case 'warning':
      return { bg: badge.warningBg, fg: badge.warningText };
    case 'danger':
      return { bg: badge.dangerBg, fg: badge.dangerText };
    case 'success':
      return { bg: badge.successBg, fg: badge.successText };
    case 'neutral':
    default:
      return { bg: badge.neutralBg, fg: badge.neutralText };
  }
}
