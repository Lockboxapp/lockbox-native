// ============================================================
// services/api.ts
//
// THE ONLY FILE IN THIS REPO THAT MAKES NETWORK CALLS.
//
// Every screen imports from here. Adding a new endpoint? Add the
// type to services/types.ts and the method to `api` below. Do not
// call `fetch` directly from a screen — see AGENT.md Section 4.
//
// Auth: the token is stored in expo-secure-store under
// `lockbox_token` and sent on every request as
// `Authorization: Bearer <token>`. lockbox-ui's getRequestUserId
// helper (lib/mobile-auth.ts) handles both this header and the
// NextAuth session cookie, so server-side logic is unified.
// ============================================================

import * as SecureStore from 'expo-secure-store';

import type {
  BankerInsightsResponse,
  BankerNudgeResponse,
  Box,
  BoxDetail,
  CreateBoxInput,
  DepositResponse,
  HomeSummary,
  KeyholderApproveResponse,
  KeyholderDenyResponse,
  KeyholderInviteResult,
  KeyholderRelationship,
  KeyholderRemoveResult,
  KeyholderRequestDetail,
  KeyholderRequestsResponse,
  KeyholderScope,
  KeyholderStatus,
  KycProgressPatch,
  KycSubmitInput,
  KycSubmitResult,
  LockBoxInput,
  LoginResponse,
  OnboardingAnalyticsInput,
  OnboardingCompleteResult,
  OnboardingStatePatch,
  OwnerRequestsResponse,
  PlaidLinkCompleteInput,
  PlaidLinkTokenResult,
  ResendOtpResult,
  SignupStartInput,
  SignupStartResult,
  SignupVerifyInput,
  SignupVerifyResult,
  TransactionsListResponse,
  TransferResponse,
  UnlockRequestInput,
  UnlockRequestResult,
  UserPatchInput,
  UserProfileResponse,
} from './types';

const BASE_URL = 'https://lockbox-ui-git-main-darian-garretts-projects.vercel.app';
const TOKEN_KEY = 'lockbox_token';

// ─── Token helpers (token storage is private to this module) ────────────
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── 401 interceptor ────────────────────────────────────────────────────
// When the server says the token is bad, we want to immediately clear it
// from secure-store AND notify the auth context so the React state flips
// to `token: null` — which causes the tab layout's auth gate to redirect
// to /login. AuthProvider registers a handler here on mount.
type UnauthorizedHandler = (() => void) | null;
let unauthorizedHandler: UnauthorizedHandler = null;
export function setUnauthorizedHandler(fn: UnauthorizedHandler): void {
  unauthorizedHandler = fn;
}

// ─── ApiError — what screens see when a request fails ───────────────────
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

// ─── Core request helper ────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) baseHeaders.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...baseHeaders,
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  } finally {
    clearTimeout(timeout);
  }



  if (!res.ok) {
    let payload: { error?: string; code?: string } = {};
    try {
      payload = (await res.json()) as { error?: string; code?: string };
    } catch {
      // Response body wasn't JSON — fall back to status text.
    }
    // Auto-logout on 401 when a token was attached. A stale or
    // server-invalid token would otherwise leave the user stranded on
    // every tab (Account's sign-out only renders in the happy path).
    if (res.status === 401 && token) {
      await clearToken();
      unauthorizedHandler?.();
    }
    throw new ApiError(
      res.status,
      payload.error ?? `Request failed (${res.status})`,
      payload.code,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ─── Public api surface ─────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>('/api/auth/mobile/token', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  home: {
    summary: () => request<HomeSummary>('/api/home/summary'),
  },

  boxes: {
    list: () => request<Box[]>('/api/boxes'),
    detail: (id: string) => request<BoxDetail>(`/api/boxes/${id}`),
    create: (data: CreateBoxInput) =>
      request<Box>('/api/boxes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    lock: (id: string, data: LockBoxInput) =>
      request<Box>(`/api/boxes/${id}/lock`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deposit: (boxId: string, amountInDollars: number) =>
      request<DepositResponse>(`/api/boxes/${boxId}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ amountInDollars }),
      }),
    transfer: (fromBoxId: string, toBoxId: string, amountInDollars: number) =>
      request<TransferResponse>('/api/boxes/transfer', {
        method: 'POST',
        body: JSON.stringify({ fromBoxId, toBoxId, amountInDollars }),
      }),
    keyholderStatus: (id: string) =>
      request<KeyholderStatus>(`/api/boxes/${id}/keyholder-status`),
    requestUnlock: (data: UnlockRequestInput) =>
      request<UnlockRequestResult>('/api/unlock-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  transactions: {
    list: (limit = 10) =>
      request<TransactionsListResponse>(
        `/api/transactions/list?limit=${limit}`,
      ),
  },

  banker: {
    nudge: () => request<BankerNudgeResponse>('/api/banker/nudge'),
    insights: () => request<BankerInsightsResponse>('/api/banker/insights'),
  },

  account: {
    profile: () => request<UserProfileResponse>('/api/user/profile'),
  },

  // Sprint 3 — keyholder approval flow. Identifies requests by
  // UnlockRequest.id only; the approvalToken is never sent to the
  // mobile client (board rule §16 #2).
  keyholder: {
    requests: () =>
      request<KeyholderRequestsResponse>('/api/keyholder/requests'),
    requestDetail: (id: string) =>
      request<KeyholderRequestDetail>(`/api/keyholder/requests/${id}`),
    approve: (id: string) =>
      request<KeyholderApproveResponse>(
        `/api/keyholder/requests/${id}/approve`,
        { method: 'POST' },
      ),
    deny: (id: string, reason?: string) =>
      request<KeyholderDenyResponse>(
        `/api/keyholder/requests/${id}/deny`,
        {
          method: 'POST',
          body: JSON.stringify(reason ? { reason } : {}),
        },
      ),
  },

  // Sprint 3 — read-only owner-side view of own pending and
  // recent requests. No cancel in this sprint.
  owner: {
    requests: () => request<OwnerRequestsResponse>('/api/owner/requests'),
  },

  // Sprint 5 — keyholder management surface (owner-side). For
  // the keyholder-side approval flow, see `api.keyholder` above.
  keyholders: {
    list: () => request<KeyholderRelationship[]>('/api/keyholders'),
    invite: (data: {
      email: string;
      name?: string;
      scopeType: KeyholderScope;
      boxIds?: string[];
    }) =>
      request<KeyholderInviteResult>('/api/keyholders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    remove: (relationshipId: string) =>
      request<KeyholderRemoveResult>(
        `/api/keyholders/manage/${relationshipId}`,
        { method: 'DELETE' },
      ),
  },

  // ─── Onboarding sprint (v2) ────────────────────────────────────────────
  // Two-endpoint signup: `start` validates + sends the OTP, `verify`
  // checks the code and creates the user. Neither carries a Bearer
  // token (the user doesn't exist yet) — `request` omits the header
  // automatically when no token is stored.
  signup: {
    start: (data: SignupStartInput) =>
      request<SignupStartResult>('/api/signup/start', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verify: (data: SignupVerifyInput) =>
      request<SignupVerifyResult>('/api/signup/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resendOtp: (signupSessionId: string) =>
      request<ResendOtpResult>('/api/signup/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ signupSessionId }),
      }),
  },

  onboarding: {
    /** Sync funnel state to the server for cross-device recovery. */
    syncState: (data: OnboardingStatePatch) =>
      request<{ ok: boolean }>('/api/onboarding/state', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    analytics: (data: OnboardingAnalyticsInput) =>
      request<{ ok: boolean }>('/api/onboarding/analytics', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    complete: () =>
      request<OnboardingCompleteResult>('/api/onboarding/complete', {
        method: 'POST',
      }),
  },

  kyc: {
    /** Per-field-blur partial save so a resuming user keeps progress. */
    saveProgress: (data: KycProgressPatch) =>
      request<{ ok: boolean }>('/api/kyc/progress', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    submit: (data: KycSubmitInput) =>
      request<KycSubmitResult>('/api/kyc/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  users: {
    /** Patch the current user — used for skip timestamps. */
    patch: (data: UserPatchInput) =>
      request<{ ok: boolean }>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  plaid: {
    /** Fetch a short-lived Plaid Link token to open the Link sheet. */
    createLinkToken: () =>
      request<PlaidLinkTokenResult>('/api/plaid/create-link-token', {
        method: 'POST',
      }),
    /** Exchange the Plaid Link public token; server stores access token. */
    linkComplete: (data: PlaidLinkCompleteInput) =>
      request<{ ok: boolean }>('/api/plaid/link-complete', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
