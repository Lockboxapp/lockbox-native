// ============================================================
// hooks/use-countdown.ts
//
// One-second countdown driver for temporary-unlock UIs (Sprint 4).
// Given an ISO datetime, returns `secondsRemaining` and re-renders
// the consumer every second until expiry, then optionally fires
// `onExpire` once.
//
// The hook clamps to zero when the target is null, in the past,
// or unparseable — UI doesn't need to special-case those.
// ============================================================

import { useEffect, useRef, useState } from 'react';

type Options = {
  /**
   * Fired exactly once when the countdown crosses from > 0 to <= 0
   * during the lifetime of this hook. Intended for screens that
   * want to refetch their data the moment the timer hits zero.
   */
  onExpire?: () => void;
};

function secondsUntil(targetIso: string | null | undefined): number {
  if (!targetIso) return 0;
  const t = Date.parse(targetIso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((t - Date.now()) / 1000));
}

export function useCountdown(
  targetIso: string | null | undefined,
  options?: Options,
): number {
  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    secondsUntil(targetIso),
  );
  // `onExpire` lives in a ref so callers can pass a new closure
  // every render without restarting the interval.
  const onExpireRef = useRef(options?.onExpire);
  onExpireRef.current = options?.onExpire;
  const hasFiredExpiry = useRef(false);

  useEffect(() => {
    // Reset on target change so a new unlock window starts fresh.
    hasFiredExpiry.current = false;
    setSecondsRemaining(secondsUntil(targetIso));
    if (!targetIso) return;

    const interval = setInterval(() => {
      const next = secondsUntil(targetIso);
      setSecondsRemaining(next);
      if (next <= 0 && !hasFiredExpiry.current) {
        hasFiredExpiry.current = true;
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetIso]);

  return secondsRemaining;
}
