// ============================================================
// hooks/use-onboarding.tsx
//
// Cross-screen state for the onboarding funnel. Holds the user's
// choices from Welcome → Locked In so a single box-creation call
// can fire on Screen 5 with the full picture.
//
// The provider wraps `app/(onboarding)/_layout.tsx` ONLY — never
// the whole app. Once onboarding finishes, the screens unmount
// and this state is gone, which is correct: nothing here should
// outlive the funnel.
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type OnboardingIntent = 'rent' | 'bills' | 'savings' | 'control';
export type OnboardingLockType = 'SOFT' | 'HARD' | 'KEYHOLDER';

export type OnboardingKycStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SKIPPED'
  | 'VERIFIED'
  | 'FAILED';

export type OnboardingState = {
  intent: OnboardingIntent | null;
  boxName: string;
  /** Full name captured on Screen 3 — pre-fills the KYC form. */
  fullName: string;
  /** Display dollars. Convert to cents before any API call. */
  amount: number | null;
  targetDate: Date | null;
  lockType: OnboardingLockType | null;
  /** Set only after the Screen 5 box-creation call succeeds. */
  boxId: string | null;
  kycStatus: OnboardingKycStatus;
  kycSkipped: boolean;
  bankLinkSkipped: boolean;
  bankLinked: boolean;
  signupSessionId: string | null;
  /**
   * Epoch ms stamped when signup starts (Screen 3). Drives the
   * `timeToComplete` analytics property on later events.
   */
  signupStartedAt: number | null;
};

/**
 * Common PostHog properties every onboarding event must carry
 * (spec — "All events must include"). Built from current state.
 */
export type OnboardingEventProps = {
  onboardingIntent: OnboardingIntent | null;
  lockTypeSelected: OnboardingLockType | null;
  targetDateSet: boolean;
  onboardingSource: string;
  onboardingVersion: 'v2';
  kycStatus: OnboardingKycStatus;
  bankLinked: boolean;
  timeToComplete: number | null;
  platform: 'native';
};

const INITIAL: OnboardingState = {
  intent: null,
  boxName: '',
  fullName: '',
  amount: null,
  targetDate: null,
  lockType: null,
  boxId: null,
  kycStatus: 'NOT_STARTED',
  kycSkipped: false,
  bankLinkSkipped: false,
  bankLinked: false,
  signupSessionId: null,
  signupStartedAt: null,
};

/** Default box name for a given intent (spec Screen 2 mapping). */
export function boxNameForIntent(intent: OnboardingIntent): string {
  switch (intent) {
    case 'rent':
      return 'Rent Box';
    case 'bills':
      return 'Bills Box';
    case 'savings':
      return 'Savings Box';
    case 'control':
      return 'My Box';
  }
}

/** Emoji paired with each intent — used on the Screen 4 box pill. */
export function emojiForIntent(intent: OnboardingIntent | null): string {
  switch (intent) {
    case 'rent':
      return '🏠';
    case 'bills':
      return '🧾';
    case 'savings':
      return '💰';
    case 'control':
      return '🎯';
    default:
      return '📦';
  }
}

type OnboardingValue = {
  state: OnboardingState;
  /** Shallow-merge a partial update into onboarding state. */
  patch: (partial: Partial<OnboardingState>) => void;
  /** Seconds since signup started — null until signup begins. */
  secondsSinceSignup: () => number | null;
  /** Common PostHog props every onboarding event must carry. */
  eventProps: () => OnboardingEventProps;
};

const Context = createContext<OnboardingValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(INITIAL);

  const patch = useCallback((partial: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const secondsSinceSignup = useCallback(() => {
    if (state.signupStartedAt == null) return null;
    return Math.max(0, Math.floor((Date.now() - state.signupStartedAt) / 1000));
  }, [state.signupStartedAt]);

  const eventProps = useCallback<() => OnboardingEventProps>(
    () => ({
      onboardingIntent: state.intent,
      lockTypeSelected: state.lockType,
      targetDateSet: state.targetDate != null,
      // No campaign attribution captured in v2 — default organic.
      onboardingSource: 'organic',
      onboardingVersion: 'v2',
      kycStatus: state.kycStatus,
      bankLinked: state.bankLinked,
      timeToComplete: secondsSinceSignup(),
      platform: 'native',
    }),
    [state, secondsSinceSignup],
  );

  const value = useMemo<OnboardingValue>(
    () => ({ state, patch, secondsSinceSignup, eventProps }),
    [state, patch, secondsSinceSignup, eventProps],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useOnboarding(): OnboardingValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('useOnboarding must be used within <OnboardingProvider>');
  }
  return ctx;
}
