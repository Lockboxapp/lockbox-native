// ============================================================
// components/onboarding/SuggestionChips.tsx
//
// Amount suggestion chips for Screen 4. Tapping a chip only
// populates the amount field — it does not submit. Deliberately
// understated: quiet outlines, not CTAs.
// ============================================================

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type SuggestionChipsProps = {
  /** Whole-dollar amounts. */
  amounts: number[];
  /** Currently-entered amount, so the matching chip can read active. */
  activeAmount: number | null;
  onSelect: (amount: number) => void;
};

export function SuggestionChips({
  amounts,
  activeAmount,
  onSelect,
}: SuggestionChipsProps) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      {amounts.map((amount) => {
        const active = activeAmount === amount;
        return (
          <Pressable
            key={amount}
            onPress={() => onSelect(amount)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.chip,
              {
                borderColor: active ? t.colors.accent : t.colors.border,
                backgroundColor: active
                  ? t.colors.surfaceAccent
                  : 'transparent',
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                t.typography.caption,
                {
                  color: active ? t.colors.accent : t.colors.textMuted,
                  fontFamily: t.fontFamily.sansMedium,
                },
              ]}
            >
              ${amount.toLocaleString('en-US')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
});
