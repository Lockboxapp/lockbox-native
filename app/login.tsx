// ============================================================
// app/login.tsx
//
// Email + password login. Calls api.auth.login(), stashes the
// returned JWT via useAuth().setSession(), then routes the user
// into the tab shell. No social auth, no signup screen in Sprint 2.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
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

import { ActionButton, SectionHeader } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';

export default function LoginScreen() {
  const t = useTheme();
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { token } = await api.auth.login(email.trim(), password);
      await setSession(token);
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not reach LockBox. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: t.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { padding: t.spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader
            eyebrow="Welcome back"
            title="Sign in"
            subtitle="Use the same email and password you use on lockboxfinance.com."
            size="page"
          />

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={t.colors.textMuted}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                inputMode="email"
                returnKeyType="next"
                style={[
                  styles.input,
                  t.typography.body,
                  {
                    color: t.colors.text,
                    backgroundColor: t.colors.surface,
                    borderColor: t.colors.border,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
                Password
              </Text>
              <View
                style={[
                  styles.passwordWrap,
                  {
                    backgroundColor: t.colors.surface,
                    borderColor: t.colors.border,
                  },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={t.colors.textMuted}
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={onSubmit}
                  style={[
                    styles.passwordInput,
                    t.typography.body,
                    { color: t.colors.text },
                  ]}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={t.colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View
                style={[
                  styles.error,
                  {
                    backgroundColor: t.colors.badge.dangerBg,
                    borderColor: t.colors.badge.dangerBg,
                  },
                ]}
              >
                <Text
                  style={[t.typography.body, { color: t.colors.badge.dangerText }]}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <ActionButton
              title={submitting ? 'Signing in…' : 'Sign in'}
              onPress={onSubmit}
              disabled={!canSubmit}
              fullWidth
            />

            <Pressable
              onPress={() => router.push('/(onboarding)/welcome')}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.signupLink}
            >
              <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                Don&rsquo;t have an account?{' '}
                <Text
                  style={{
                    color: t.colors.accent,
                    fontFamily: t.fontFamily.sansSemiBold,
                  }}
                >
                  Get started
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    gap: 16,
  },
  form: {
    gap: 16,
    marginTop: 8,
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
  },
  eyeButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  error: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  signupLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
});
