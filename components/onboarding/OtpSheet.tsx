// ============================================================
// components/onboarding/OtpSheet.tsx
//
// OTP verification as a bottom sheet — never a full-screen
// navigation (spec + DoD). Built on RN `Modal` with a slide-up
// presentation, matching the existing sheet pattern in this
// codebase (DepositSheet, keyholder remove sheet).
//
// - 6 single-digit inputs, auto-advance, backspace-to-previous
// - `textContentType="oneTimeCode"` for iOS autofill
// - Paste handling: a 6-digit paste into any box fills all six
// - 30s resend cooldown, then an active "Resend code" control
// - "Wrong number?" dismisses the sheet and refocuses the phone
//   field on the parent screen
//
// The parent owns the API calls — this component only collects
// the code and reports submit / resend / dismiss intents.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { ActionButton } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

type OtpSheetProps = {
  visible: boolean;
  /** Display phone number, already formatted. */
  phone: string;
  submitting: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onWrongNumber: () => void;
  onClose: () => void;
};

export function OtpSheet({
  visible,
  phone,
  submitting,
  error,
  onVerify,
  onResend,
  onWrongNumber,
  onClose,
}: OtpSheetProps) {
  const t = useTheme();
  const [digits, setDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(''),
  );
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Reset state + restart the cooldown each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const focusTimer = setTimeout(() => inputs.current[0]?.focus(), 250);
    return () => clearTimeout(focusTimer);
  }, [visible]);

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (!visible || cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [visible, cooldown]);

  const code = digits.join('');
  const complete = code.length === OTP_LENGTH;

  function handleChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, '');
    // Paste: a multi-digit value lands — spread it across the boxes.
    if (cleaned.length > 1) {
      const next = Array(OTP_LENGTH).fill('');
      cleaned
        .slice(0, OTP_LENGTH)
        .split('')
        .forEach((d, i) => {
          next[i] = d;
        });
      setDigits(next);
      const lastFilled = Math.min(cleaned.length, OTP_LENGTH) - 1;
      inputs.current[lastFilled]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              padding: t.spacing.xl,
              gap: t.spacing.md,
              borderTopLeftRadius: t.radius.xxl,
              borderTopRightRadius: t.radius.xxl,
            },
          ]}
        >
          <View style={styles.handle} />
          <Text style={[t.typography.h2, { color: t.colors.text }]}>
            Enter your code
          </Text>
          <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
            We sent a 6-digit code to {phone || 'your phone'}.
          </Text>

          <View style={styles.digitRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={digit}
                onChangeText={(v) => handleChange(i, v)}
                onKeyPress={(e) => handleKeyPress(i, e)}
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={i === 0 ? OTP_LENGTH : 1}
                style={[
                  styles.digitBox,
                  t.typography.h1,
                  {
                    color: t.colors.text,
                    fontFamily: t.fontFamily.mono,
                    backgroundColor: t.colors.surfaceSubtle,
                    borderColor: digit ? t.colors.accent : t.colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {error ? (
            <Text style={[t.typography.body, { color: t.colors.badge.dangerText }]}>
              {error}
            </Text>
          ) : null}

          <ActionButton
            title={submitting ? 'Verifying…' : 'Verify'}
            onPress={() => onVerify(code)}
            disabled={!complete || submitting}
            fullWidth
          />

          <View style={styles.footerRow}>
            {cooldown > 0 ? (
              <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                Resend code in {cooldown}s
              </Text>
            ) : (
              <Pressable
                onPress={() => {
                  setCooldown(RESEND_COOLDOWN_SECONDS);
                  onResend();
                }}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    t.typography.caption,
                    { color: t.colors.accent, fontFamily: t.fontFamily.sansSemiBold },
                  ]}
                >
                  Resend code
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onWrongNumber}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
                Wrong number?
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderWidth: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(127,127,127,0.4)',
    marginBottom: 4,
  },
  digitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 4,
  },
  digitBox: {
    flex: 1,
    height: 60,
    borderWidth: 1.5,
    borderRadius: 14,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
