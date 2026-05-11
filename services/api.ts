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
  DepositResponse,
  HomeSummary,
  LoginResponse,
  TransactionsListResponse,
  TransferResponse,
  UserProfileResponse,
} from './types';

const BASE_URL = 'https://lockboxfinance.com';
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

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    let payload: { error?: string; code?: string } = {};
    try {
      payload = (await res.json()) as { error?: string; code?: string };
    } catch {
      // Response body wasn't JSON — fall back to status text.
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
};
