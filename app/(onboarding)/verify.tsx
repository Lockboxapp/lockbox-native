// ============================================================
// app/(onboarding)/verify.tsx — Screen 6 (6A + 6B)
//
// Two conditional steps in one screen:
//   6A — KYC trust screen: why we verify, with a visible,
//        non-guilt-framed skip path.
//   6B — KYC form: legal name, DOB, address, SSN. Each field
//        blur syncs to PATCH /api/kyc/progress so a resuming
//        user keeps their place.
//
// KYC is skippable, never a wall. Both the skip path and a
// failed submission proceed to Screen 7 — a failed verification
// surfaces later as a dashboard banner, not a block here.
//
// NOTE: /api/kyc/progress, /api/kyc/submit and /api/users/me do
// not yet exist on lockbox-ui. Progress saves are fire-and-forget
// so a 404 never disrupts typing; the submit path surfaces a
// real error and lets the user retry.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { type ComponentProps, type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { ActionButton } from '@/components/ui';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/services/analytics';
import { ApiError, api } from '@/services/api';
import type { KycProgressPatch } from '@/services/types';

type StateOption = { code: string; name: string };

const US_STATES: StateOption[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

const dobFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// ─── Field helpers ──────────────────────────────────────────
function digitsOnly(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max);
}

/** Format up to 9 digits as XXX-XX-XXXX. */
function formatSsn(raw: string): string {
  const d = digitsOnly(raw, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/** ISO calendar date (YYYY-MM-DD) — the shape the KYC API expects. */
function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ============================================================
// Screen — owns the 6A → 6B step and hands each its callbacks.
// ============================================================
export default function VerifyScreen() {
  const [step, setStep] = useState<'trust' | 'form'>('trust');

  if (step === 'form') return <KycForm />;
  return <TrustStep onVerifyNow={() => setStep('form')} />;
}

// ============================================================
// 6A — KYC trust screen
// ============================================================
function TrustStep({ onVerifyNow }: { onVerifyNow: () => void }) {
  const t = useTheme();
  const { patch, eventProps } = useOnboarding();

  function onSkip() {
    patch({ kycSkipped: true, kycStatus: 'SKIPPED' });
    track('kyc_skipped', {
      ...eventProps(),
      kycStatus: 'SKIPPED',
      onboardingStep: 6,
    });
    // Persist the skip timestamp — fire-and-forget so the skip
    // stays instant even if the endpoint is unavailable.
    api.users
      .patch({ skippedKycAt: new Date().toISOString() })
      .catch(() => {});
    router.push('/(onboarding)/link-bank');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={[styles.trustRoot, { paddingHorizontal: t.spacing.xl }]}>
        <View style={styles.trustHero}>
          <FadeIn delay={60}>
            <View
              style={[
                styles.shieldBadge,
                { backgroundColor: t.colors.surfaceAccent },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={44}
                color={t.colors.accent}
              />
            </View>
          </FadeIn>

          <FadeIn delay={160}>
            <Text
              style={[t.typography.h1, styles.trustText, { color: t.colors.text }]}
            >
              Before we move real money, we need to verify it&rsquo;s really
              you.
            </Text>
          </FadeIn>

          <FadeIn delay={240}>
            <Text
              style={[
                t.typography.body,
                styles.trustText,
                { color: t.colors.textMuted },
              ]}
            >
              This protects your account, keeps LockBox compliant, and makes
              sure only you can move money in or out.
            </Text>
          </FadeIn>

          <FadeIn delay={320}>
            <Text
              style={[
                t.typography.caption,
                styles.trustText,
                { color: t.colors.textMuted },
              ]}
            >
              Most people finish in under 2 minutes.
            </Text>
          </FadeIn>
        </View>

        <FadeIn delay={400} style={styles.trustFooter}>
          <ActionButton title="Verify now" onPress={onVerifyNow} fullWidth />
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.skipLink}
          >
            <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
              I&rsquo;ll do this later
            </Text>
          </Pressable>
        </FadeIn>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// 6B — KYC form
// ============================================================
function KycForm() {
  const t = useTheme();
  const { state, patch, eventProps } = useOnboarding();

  const [firstName, setFirstName] = useState(
    state.fullName.trim().split(/\s+/)[0] ?? '',
  );
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [address, setAddress] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zip, setZip] = useState('');
  const [ssn, setSsn] = useState('');

  const [showDob, setShowDob] = useState(false);
  const [showSsn, setShowSsn] = useState(false);
  const [statePickerOpen, setStatePickerOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stateName =
    US_STATES.find((s) => s.code === stateCode)?.name ?? null;

  const formValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    dob != null &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    stateCode.length > 0 &&
    zip.length === 5 &&
    ssn.length === 9;

  // Per-field blur sync — fire-and-forget partial save.
  function saveField(data: KycProgressPatch) {
    api.kyc.saveProgress(data).catch(() => {});
  }

  function onChangeDob(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') setShowDob(false);
    if (event.type === 'set' && date) {
      setDob(date);
      saveField({ dateOfBirth: toYmd(date) });
    }
  }

  function onSelectState(code: string) {
    setStateCode(code);
    setStatePickerOpen(false);
    saveField({ state: code });
  }

  async function onSubmit() {
    if (!formValid || submitting || dob == null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.kyc.submit({
        legalFirstName: firstName.trim(),
        legalLastName: lastName.trim(),
        dateOfBirth: toYmd(dob),
        address: address.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: stateCode,
        zip,
        ssn,
      });
      if (result.ok) {
        patch({ kycStatus: 'VERIFIED' });
        track('kyc_completed', { ...eventProps(), kycStatus: 'VERIFIED' });
      } else {
        patch({ kycStatus: 'FAILED' });
        track('kyc_failed', {
          ...eventProps(),
          kycStatus: 'FAILED',
          reason: result.reason ?? 'unspecified',
        });
      }
      // Proceed regardless of outcome — failed KYC is never a wall;
      // it surfaces later as a dashboard banner.
      router.push('/(onboarding)/link-bank');
    } catch (e) {
      setSubmitError(
        e instanceof ApiError
          ? e.message
          : "We couldn't reach the server. Check your connection and try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.formContent,
            { paddingHorizontal: t.spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeIn delay={40}>
            <Text style={[t.typography.h1, { color: t.colors.text }]}>
              Confirm your identity
            </Text>
            <Text
              style={[
                t.typography.body,
                { color: t.colors.textMuted, marginTop: t.spacing.sm },
              ]}
            >
              Your information is encrypted and never sold.
            </Text>
          </FadeIn>

          <FadeIn delay={120} style={styles.section}>
            <SectionLabel>Personal Info</SectionLabel>
            <Field label="Legal first name">
              <BareInput
                value={firstName}
                onChangeText={setFirstName}
                onBlur={() => {
                  const v = firstName.trim();
                  if (v) saveField({ legalFirstName: v });
                }}
                placeholder="Jordan"
                autoComplete="given-name"
                autoCapitalize="words"
              />
            </Field>
            <Field label="Legal last name">
              <BareInput
                value={lastName}
                onChangeText={setLastName}
                onBlur={() => {
                  const v = lastName.trim();
                  if (v) saveField({ legalLastName: v });
                }}
                placeholder="Rivera"
                autoComplete="family-name"
                autoCapitalize="words"
              />
            </Field>
            <Field label="Date of birth">
              <PickerRow
                value={dob ? dobFormatter.format(dob) : null}
                placeholder="Select your date of birth"
                iconName="calendar-outline"
                onPress={() => setShowDob(true)}
              />
            </Field>
          </FadeIn>

          <FadeIn delay={200} style={styles.section}>
            <SectionLabel>Address</SectionLabel>
            <Field label="Residential address">
              <BareInput
                value={address}
                onChangeText={setAddress}
                onBlur={() => {
                  const v = address.trim();
                  if (v) saveField({ address: v });
                }}
                placeholder="123 Main St"
                autoComplete="address-line1"
                autoCapitalize="words"
              />
            </Field>
            <Field label="Apartment / Suite (optional)">
              <BareInput
                value={addressLine2}
                onChangeText={setAddressLine2}
                onBlur={() => {
                  const v = addressLine2.trim();
                  if (v) saveField({ addressLine2: v });
                }}
                placeholder="Apt 4B"
                autoComplete="address-line2"
                autoCapitalize="words"
              />
            </Field>
            <Field label="City">
              <BareInput
                value={city}
                onChangeText={setCity}
                onBlur={() => {
                  const v = city.trim();
                  if (v) saveField({ city: v });
                }}
                placeholder="Atlanta"
                autoComplete="postal-address-locality"
                autoCapitalize="words"
              />
            </Field>
            <Field label="State">
              <PickerRow
                value={stateName}
                placeholder="Select your state"
                iconName="chevron-down"
                onPress={() => setStatePickerOpen(true)}
              />
            </Field>
            <Field label="ZIP code">
              <BareInput
                value={zip}
                onChangeText={(v) => setZip(digitsOnly(v, 5))}
                onBlur={() => {
                  if (zip.length === 5) saveField({ zip });
                }}
                placeholder="30301"
                keyboardType="numeric"
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </Field>
          </FadeIn>

          <FadeIn delay={280} style={styles.section}>
            <SectionLabel>Identity</SectionLabel>
            <Field
              label="Social Security number"
              helper="Used only to verify your identity. Never for a credit check."
            >
              <View
                style={[
                  styles.inputRow,
                  {
                    borderColor: t.colors.border,
                    backgroundColor: t.colors.surface,
                  },
                ]}
              >
                <BareInput
                  value={showSsn ? formatSsn(ssn) : ssn}
                  onChangeText={(v) => setSsn(digitsOnly(v, 9))}
                  placeholder="000-00-0000"
                  keyboardType="numeric"
                  inputMode="numeric"
                  secureTextEntry={!showSsn}
                  flex
                />
                <Pressable
                  onPress={() => setShowSsn((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showSsn ? 'Hide SSN' : 'Show SSN'}
                >
                  <Ionicons
                    name={showSsn ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={t.colors.textMuted}
                  />
                </Pressable>
              </View>
            </Field>
          </FadeIn>

          {submitError ? (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: t.colors.badge.dangerBg },
              ]}
            >
              <Text
                style={[
                  t.typography.body,
                  { color: t.colors.badge.dangerText },
                ]}
              >
                {submitError}
              </Text>
            </View>
          ) : null}

          <ActionButton
            title="Submit"
            onPress={onSubmit}
            disabled={!formValid || submitting}
            fullWidth
            trailing={
              submitting ? (
                <ActivityIndicator size="small" color={t.colors.onAccent} />
              ) : undefined
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {showDob ? (
        <DateTimePicker
          value={dob ?? new Date(2000, 0, 1)}
          mode="date"
          maximumDate={new Date()}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDob}
        />
      ) : null}

      <StatePickerModal
        visible={statePickerOpen}
        selectedCode={stateCode}
        onSelect={onSelectState}
        onClose={() => setStatePickerOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Local primitives ───────────────────────────────────────
function SectionLabel({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <Text style={[t.typography.eyebrow, { color: t.colors.textMuted }]}>
      {children}
    </Text>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[t.typography.label, { color: t.colors.textMuted }]}>
        {label}
      </Text>
      {children}
      {helper ? (
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

type BareInputProps = ComponentProps<typeof TextInput> & {
  /** Render borderless — for use inside a wrapper row. */
  flex?: boolean;
};

function BareInput({ flex, style, ...props }: BareInputProps) {
  const t = useTheme();
  return (
    <TextInput
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
}

function PickerRow({
  value,
  placeholder,
  iconName,
  onPress,
}: {
  value: string | null;
  placeholder: string;
  iconName: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.pickerRow,
        { borderColor: t.colors.border, backgroundColor: t.colors.surface },
      ]}
    >
      <Text
        style={[
          t.typography.body,
          { color: value ? t.colors.text : t.colors.textMuted },
        ]}
      >
        {value ?? placeholder}
      </Text>
      <Ionicons name={iconName} size={18} color={t.colors.textMuted} />
    </Pressable>
  );
}

function StatePickerModal({
  visible,
  selectedCode,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const t = useTheme();
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
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              borderTopLeftRadius: t.radius.xxl,
              borderTopRightRadius: t.radius.xxl,
            },
          ]}
        >
          <View style={styles.handle} />
          <Text
            style={[
              t.typography.h2,
              { color: t.colors.text, paddingHorizontal: t.spacing.xl },
            ]}
          >
            Select state
          </Text>
          <FlatList
            data={US_STATES}
            keyExtractor={(s) => s.code}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: t.spacing.xl }}
            renderItem={({ item }) => {
              const active = item.code === selectedCode;
              return (
                <Pressable
                  onPress={() => onSelect(item.code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.stateRow, { borderTopColor: t.colors.divider }]}
                >
                  <Text
                    style={[
                      t.typography.body,
                      {
                        color: active ? t.colors.accent : t.colors.text,
                        fontFamily: active
                          ? t.fontFamily.sansSemiBold
                          : t.fontFamily.sans,
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={t.colors.accent}
                    />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  // 6A — trust screen
  trustRoot: {
    flex: 1,
    paddingBottom: 24,
  },
  trustHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  shieldBadge: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: {
    textAlign: 'center',
    maxWidth: 340,
  },
  trustFooter: {
    gap: 14,
  },
  skipLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  // 6B — KYC form
  formContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  errorBox: {
    borderRadius: 12,
    padding: 12,
  },
  // State picker modal
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
    maxHeight: '72%',
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(127,127,127,0.4)',
    marginBottom: 4,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
