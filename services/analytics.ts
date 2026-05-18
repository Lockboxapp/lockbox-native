// ============================================================
// services/analytics.ts
//
// Thin PostHog wrapper. Screens call `track(event, props)` —
// they never touch the PostHog client directly.
//
// The client initialises from EXPO_PUBLIC_POSTHOG_KEY. When the
// key is absent (e.g. local dev without analytics provisioned)
// every call is a safe no-op — the funnel still works, events
// just aren't sent. Wire the key in app config to go live.
// ============================================================

import PostHog from 'posthog-react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

const client: PostHog | null = POSTHOG_KEY
  ? new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST })
  : null;

let warnedMissingKey = false;

// PostHog's capture() wants a JSON-typed property bag. Our callers
// only ever pass JSON-serializable values (strings, numbers, bools,
// null), so a single cast at the boundary is safe and keeps the
// public `track` signature ergonomic.
type EventProps = Record<string, unknown>;
type PosthogProps = Parameters<PostHog['capture']>[1];

/** Fire a PostHog event. No-ops cleanly when no key is configured. */
export function track(event: string, properties?: EventProps): void {
  if (!client) {
    if (__DEV__ && !warnedMissingKey) {
      warnedMissingKey = true;
      console.log(
        '[analytics] EXPO_PUBLIC_POSTHOG_KEY not set — events are no-ops.',
      );
    }
    return;
  }
  client.capture(event, properties as PosthogProps);
}

/** Associate subsequent events with a user id. */
export function identify(userId: string, properties?: EventProps): void {
  client?.identify(userId, properties as PosthogProps);
}
