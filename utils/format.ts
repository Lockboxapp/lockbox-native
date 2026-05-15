// ============================================================
// utils/format.ts — display-layer formatters only.
//
// All money in the API is integer CENTS. Screens never store
// dollars. This is where the cents → display string conversion
// lives, and the only place. See AGENT.md Section 8.
// ============================================================

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const USD_WHOLE = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Format a cent value as a USD string. */
export function formatCents(cents: number, opts?: { whole?: boolean }): string {
  const f = opts?.whole ? USD_WHOLE : USD;
  return f.format((cents ?? 0) / 100);
}

/** Format a cent delta with explicit sign. */
export function formatCentsSigned(cents: number): string {
  const sign = cents > 0 ? '+' : cents < 0 ? '−' : '';
  return `${sign}${formatCents(Math.abs(cents))}`;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

/** "Apr 28" */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return dateFormatter.format(d);
}

/** "Apr 28 · 6:14 PM" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${dateFormatter.format(d)} · ${timeFormatter.format(d)}`;
}

/**
 * Format a non-negative seconds value as `m:ss` (or `h:mm:ss` past
 * an hour, though Sprint 4's window maxes at 30 minutes). Negative
 * values clamp to `0:00`.
 */
export function formatCountdown(secondsRemaining: number): string {
  const s = Math.max(0, Math.floor(secondsRemaining));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const ss = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    const mm = minutes.toString().padStart(2, '0');
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}
