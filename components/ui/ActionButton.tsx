import { ReactNode } from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost';

type ActionButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ActionButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Themed button used across the app. Three variants form a clear hierarchy:
 *   - primary: filled forest-green CTA
 *   - secondary: tonal/outlined surface
 *   - ghost: minimal, text-only with subtle hover/press feedback
 */
export function ActionButton({
  title,
  onPress,
  variant = 'primary',
  fullWidth,
  disabled,
  leading,
  trailing,
  style,
}: ActionButtonProps) {
  const t = useTheme();

  const base: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.md + 2,
    paddingHorizontal: t.spacing.xl,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: disabled ? 0.5 : 1,
  };

  let containerStyle: ViewStyle;
  let textColor: string;

  switch (variant) {
    case 'secondary':
      containerStyle = {
        ...base,
        backgroundColor: t.colors.surfaceAccent,
        borderColor: t.colors.accentSoft,
      };
      textColor = t.colors.accentDeep;
      break;
    case 'ghost':
      containerStyle = {
        ...base,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      };
      textColor = t.colors.accent;
      break;
    case 'primary':
    default:
      containerStyle = {
        ...base,
        backgroundColor: t.colors.accent,
        borderColor: t.colors.accent,
      };
      textColor = t.colors.onAccent;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled ? { opacity: 0.82 } : null,
        style,
      ]}
    >
      {leading ? <View>{leading}</View> : null}
      <Text style={[t.typography.bodyStrong, { color: textColor }]}>{title}</Text>
      {trailing ? <View>{trailing}</View> : null}
    </Pressable>
  );
}
