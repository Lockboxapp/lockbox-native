// ============================================================
// app/(onboarding)/protect.tsx — Screen 4
//
// "How much do you want to protect?" — amount + optional target
// date + editable box name. All held in OnboardingContext; NO
// box is created here (box creation is Screen 5 only).
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountInput } from '@/components/onboarding/AmountInput';
import { BoxNamePill } from '@/components/onboarding/BoxNamePill';
import { FadeIn } from '@/components/onboarding/FadeIn';
import { SuggestionChips } from '@/components/onboarding/SuggestionChips';
import { ActionButton } from '@/components/ui';
import { emojiForIntent, useOnboarding } from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';

const SUGGESTIONS = [100, 500, 1000, 1500];

const longDate = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
});

export default function ProtectScreen() {
  const t = useTheme();
  const { state, patch } = useOnboarding();

  const [amountText, setAmountText] = useState(
    state.amount != null ? String(state.amount) : '',
  );
  const [showHelper, setShowHelper] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const amount = amountText.length > 0 ? Number(amountText) : null;
  const canContinue = amount != null && amount > 0;

  function onDateChange(event: DateTimePickerEvent, date?: Date) {
    // Android dialog dismisses itself; iOS picker stays inline.
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (event.type === 'set' && date) {
      patch({ targetDate: date });
    }
  }

  function onContinue() {
    patch({ amount });
    router.push('/(onboarding)/lock');
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
            <BoxNamePill
              emoji={emojiForIntent(state.intent)}
              name={state.boxName || 'My Box'}
              onRename={(next) => patch({ boxName: next })}
            />
          </FadeIn>

          <FadeIn delay={120}>
            <Text style={[t.typography.h1, styles.headline, { color: t.colors.text }]}>
              How much do you want to protect?
            </Text>
          </FadeIn>

          <FadeIn delay={200} style={styles.amountBlock}>
            <AmountInput
              value={amountText}
              onChangeText={setAmountText}
              onBlur={() => setShowHelper((amount ?? 0) > 0)}
              autoFocus
            />
            <SuggestionChips
              amounts={SUGGESTIONS}
              activeAmount={amount}
              onSelect={(v) => {
                setAmountText(String(v));
                setShowHelper(true);
              }}
            />
            {showHelper ? (
              <Text
                style={[
                  t.typography.caption,
                  styles.helper,
                  { color: t.colors.textMuted },
                ]}
              >
                You can add money over time — it doesn&rsquo;t need to be funded
                all at once.
              </Text>
            ) : null}
          </FadeIn>

          <FadeIn delay={280} style={styles.dateBlock}>
            <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
              When do you need it by? (optional)
            </Text>
            <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
              Helps us remind you.
            </Text>
            {state.targetDate ? (
              <Pressable
                onPress={() => patch({ targetDate: null })}
                accessibilityRole="button"
                accessibilityLabel="Clear target date"
                style={[
                  styles.dateRow,
                  {
                    backgroundColor: t.colors.surfaceAccent,
                    borderColor: t.colors.accentSoft,
                  },
                ]}
              >
                <Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
                  By {longDate.format(state.targetDate)}
                </Text>
                <Ionicons name="close-circle" size={18} color={t.colors.textMuted} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setShowPicker(true)}
                accessibilityRole="button"
                style={[
                  styles.dateRow,
                  {
                    backgroundColor: t.colors.surface,
                    borderColor: t.colors.border,
                  },
                ]}
              >
                <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
                  Pick a date
                </Text>
                <Ionicons name="calendar-outline" size={18} color={t.colors.textMuted} />
              </Pressable>
            )}
            {showPicker ? (
              <DateTimePicker
                value={state.targetDate ?? new Date()}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDateChange}
              />
            ) : null}
          </FadeIn>

          <ActionButton
            title="Continue"
            onPress={onContinue}
            disabled={!canContinue}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
  },
  headline: {
    textAlign: 'center',
  },
  amountBlock: {
    gap: 14,
  },
  helper: {
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
  },
  dateBlock: {
    gap: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
});
