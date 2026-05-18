// ============================================================
// app/(onboarding)/signup.tsx — Screen 3
//
// Account creation. Four validated fields → CTA fires the
// two-endpoint signup:
//   1. POST /api/signup/start  — validates, sends OTP
//   2. (OTP sheet) POST /api/signup/verify — creates the user
//
// On verify success: token → expo-secure-store (via useAuth),
// PostHog `user_signed_up`, then → Screen 4.
//
// NOTE: /api/signup/start and /api/signup/verify do not yet
// exist on lockbox-ui (only the single POST /api/signup does).
// The screen is built to the documented contract; the call
// will fail until the backend sprint ships those endpoints.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { forwardRef, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/onboarding/FadeIn';
import { OtpSheet } from '@/components/onboarding/OtpSheet';
import { ActionButton } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import { identify, track } from '@/services/analytics';

// ─── Field helpers ──────────────────────────────────────────
function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

/** Format up to 10 digits as (XXX) XXX-XXXX. */
function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

type PasswordStrength = 'weak' | 'fair' | 'strong';

function passwordStrength(value: string): PasswordStrength {
  if (value.length < 8) return 'weak';
  const variety =
    Number(/[a-z]/.test(value)) +
    Number(/[A-Z]/.test(value)) +
    Number(/\d/.test(value)) +
    Number(/[^a-zA-Z0-9]/.test(value));
  if (value.length >= 12 && variety >= 3) return 'strong';
  if (variety >= 2) return 'fair';
  return 'fair';
}

export default function SignupScreen() {
  const t = useTheme();
  const { state, patch } = useOnboarding();
  const { setSession } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const phoneRef = useRef<TextInput>(null);

  const nameValid = fullName.trim().length > 1;
  const emailValid = isValidEmail(email);
  const passwordValid = password.length >= 8;
  const phoneValid = phoneDigits(phone).length === 10;
  const formValid = nameValid && emailValid && passwordValid && phoneValid;

  const strength = passwordStrength(password);

  async function onContinue() {
    if (!formValid || starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await api.signup.start({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phoneDigits(phone),
      });
      patch({
        fullName: fullName.trim(),
        signupSessionId: res.signupSessionId,
        signupStartedAt: Date.now(),
      });
      setOtpError(null);
      setOtpVisible(true);
    } catch (e) {
      setStartError(
        e instanceof ApiError
          ? e.message
          : 'Could not start signup. Check your connection and try again.',
      );
    } finally {
      setStarting(false);
    }
  }

  async function onVerify(code: string) {
    if (!state.signupSessionId || verifying) return;
    setVerifying(true);
    setOtpError(null);
    try {
      const res = await api.signup.verify({
        signupSessionId: state.signupSessionId,
        code,
      });
      await setSession(res.token);
      identify(res.userId, { email: res.email });
      track('user_signed_up', {
        ...({
          onboardingIntent: state.intent,
          lockTypeSelected: state.lockType,
          targetDateSet: state.targetDate != null,
          onboardingSource: 'organic',
          onboardingVersion: 'v2',
          kycStatus: state.kycStatus,
          bankLinked: state.bankLinked,
          timeToComplete: 0,
          platform: 'native',
        }),
      });
      setOtpVisible(false);
      router.push('/(onboarding)/protect');
    } catch (e) {
      setOtpError(
        e instanceof ApiError
          ? e.message
          : 'That code did not work. Try again.',
      );
    } finally {
      setVerifying(false);
    }
  }

  async function onResend() {
    if (!state.signupSessionId) return;
    setOtpError(null);
    try {
      await api.signup.resendOtp(state.signupSessionId);
    } catch (e) {
      setOtpError(
        e instanceof ApiError ? e.message : 'Could not resend the code.',
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: t.spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeIn delay={40}>
            <Text style={[t.typography.h1, { color: t.colors.text }]}>
              Create your account
            </Text>
            <Text
              style={[
                t.typography.body,
                { color: t.colors.textMuted, marginTop: t.spacing.sm },
              ]}
            >
              Your box is waiting.
            </Text>
          </FadeIn>

          <FadeIn delay={120} style={styles.form}>
            <Field label="Full name">
              <BareInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jordan Rivera"
                autoComplete="name"
                autoCapitalize="words"
              />
            </Field>

            <Field
              label="Email"
              error={email.length > 0 && !emailValid ? 'Enter a valid email' : null}
            >
              <BareInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            <Field label="Password">
              <View
                style={[
                  styles.passwordRow,
                  {
                    borderColor: t.colors.border,
                    backgroundColor: t.colors.surface,
                  },
                ]}
              >
                <BareInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  autoCapitalize="none"
                  autoCorrect={false}
                  flex
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={t.colors.textMuted}
                  />
                </Pressable>
              </View>
              <PasswordMeter password={password} strength={strength} />
            </Field>

            <Field label="Phone number" helper="Used for account security and unlock verification.">
              <BareInput
                ref={phoneRef}
                value={phone}
                onChangeText={(v) => setPhone(formatPhone(v))}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </Field>

            {startError ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: t.colors.badge.dangerBg },
                ]}
              >
                <Text style={[t.typography.body, { color: t.colors.badge.dangerText }]}>
                  {startError}
                </Text>
              </View>
            ) : null}

            <ActionButton
              title={starting ? 'Sending code…' : 'Continue'}
              onPress={onContinue}
              disabled={!formValid || starting}
              fullWidth
            />

            <Text
              style={[
                t.typography.caption,
                { color: t.colors.textMuted, textAlign: 'center' },
              ]}
            >
              By continuing you agree to our Terms of Service and Privacy Policy.
            </Text>

            <Pressable
              onPress={() => router.push('/login')}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.signinLink}
            >
              <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                Already have an account?{' '}
                <Text
                  style={{
                    color: t.colors.accent,
                    fontFamily: t.fontFamily.sansSemiBold,
                  }}
                >
                  Sign in
                </Text>
              </Text>
            </Pressable>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>

      <OtpSheet
        visible={otpVisible}
        phone={phone}
        submitting={verifying}
        error={otpError}
        onVerify={onVerify}
        onResend={onResend}
        onWrongNumber={() => {
          setOtpVisible(false);
          setTimeout(() => phoneRef.current?.focus(), 250);
        }}
        onClose={() => setOtpVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Local field primitives ─────────────────────────────────
function Field({
  label,
  helper,
  error,
  children,
}: {
  label: string;
  helper?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
        {label}
      </Text>
      {children}
      {error ? (
        <Text style={[t.typography.caption, { color: t.colors.badge.dangerText }]}>
          {error}
        </Text>
      ) : helper ? (
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

type BareInputProps = React.ComponentProps<typeof TextInput> & {
  /** Render borderless/padding-free — for use inside a wrapper row. */
  flex?: boolean;
};

const BareInput = forwardRef<TextInput, BareInputProps>(function BareInput(
  { flex, style, ...props },
  ref,
) {
  const t = useTheme();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={t.colors.textMuted}
      style={[
        t.typography.body,
        {
          color: t.colors.text,
          backgroundColor: t.colors.surface,
          borderColor: t.colors.border,
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        flex ? { flex: 1, borderWidth: 0, paddingHorizontal: 0 } : null,
        style,
      ]}
      {...props}
    />
  );
});

function PasswordMeter({
  password,
  strength,
}: {
  password: string;
  strength: PasswordStrength;
}) {
  const t = useTheme();
  if (password.length === 0) {
    return (
      <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
        Must be at least 8 characters.
      </Text>
    );
  }
  const meta =
    strength === 'strong'
      ? { label: 'Strong', color: t.colors.badge.successText, bars: 3 }
      : strength === 'fair'
        ? { label: 'Fair', color: t.colors.badge.warningText, bars: 2 }
        : { label: 'Too short', color: t.colors.badge.dangerText, bars: 1 };
  return (
    <View style={styles.meterRow}>
      <View style={styles.meterBars}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.meterBar,
              {
                backgroundColor:
                  i < meta.bars ? meta.color : t.colors.surfaceSubtle,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[t.typography.caption, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  meterBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  meterBar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  errorBox: {
    borderRadius: 12,
    padding: 12,
  },
  signinLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
});
