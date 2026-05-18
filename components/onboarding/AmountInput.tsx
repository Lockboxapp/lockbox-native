// ============================================================
// components/onboarding/AmountInput.tsx
//
// Large centered dollar input for Screen 4. Fixed "$" prefix,
// numeric keyboard, DM Mono digits. Holds a raw string so the
// caller controls parsing — no minimum enforced here.
// ============================================================

import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type AmountInputProps = {
  /** Raw digit string (no "$", no commas). */
  value: string;
  onChangeText: (next: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
};

export function AmountInput({
  value,
  onChangeText,
  onBlur,
  autoFocus,
}: AmountInputProps) {
  const t = useTheme();

  function handleChange(raw: string) {
    // Keep digits only — the display layer owns formatting.
    onChangeText(raw.replace(/[^0-9]/g, ''));
  }

  const display = value.length > 0 ? Number(value).toLocaleString('en-US') : '';

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.prefix,
          { color: value ? t.colors.text : t.colors.textMuted },
        ]}
      >
        $
      </Text>
      <TextInput
        value={display}
        onChangeText={handleChange}
        onBlur={onBlur}
        autoFocus={autoFocus}
        keyboardType="numeric"
        inputMode="numeric"
        placeholder="0"
        placeholderTextColor={t.colors.textMuted}
        style={[
          styles.input,
          {
            color: t.colors.text,
            fontFamily: t.fontFamily.mono,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  prefix: {
    fontSize: 44,
    fontWeight: '600',
  },
  input: {
    fontSize: 52,
    minWidth: 80,
    paddingVertical: 4,
    textAlign: 'center',
  },
});
