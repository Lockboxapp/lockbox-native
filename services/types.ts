// ============================================================
// services/types.ts
//
// Response types for every endpoint the native app calls. Derived
// from `lockbox-ui/prisma/schema.prisma` and the route handlers in
// `lockbox-ui/app/api/*`. Keep this file in sync when an endpoint
// shape changes — screens import directly from here.
//
// MONEY RULE: every `*Cents` field is an integer cent value. The
// display layer divides by 100. Never store or pass floats.
// ============================================================

export type LockType = 'SOFT' | 'HARD' | 'KEYHOLDER';

export type BoxStatus =
  | 'CREATED'
  | 'FUNDING'
  | 'LOCKED'
  | 'UNLOCK_PENDING'
  | 'UNLOCKED';

export type Box = {
  id: string;
  name: string;
  description: string | null;
  status: BoxStatus;
  lockType: LockType;
  balance: number; // cents
  lockedAmount: number; // cents
  targetAmount: number | null; // cents
  lockUntil: string | null;
  isPriority: boolean;
  isWallet: boolean;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
  unlockRequests?: {
    id: string;
    status: string;
    requestedAt: string;
  }[];
  /**
   * Sprint 4 — set when a keyholder approves an UNLOCK request.
   * Null outside an active 30-minute temporary unlock window.
   */
  temporaryUnlockExpiresAt: string | null;
  originalLockType: LockType | null;
  /**
   * Server-computed at response time. Native re-derives freshness
   * via its own per-second countdown so the badge can update
   * between API refreshes.
   */
  isTemporarilyUnlocked: boolean;
};

export type BankerNudge = {
  headline: string;
  body: string;
  ctaLabel: string;
  ctaAction: 'transfer' | 'deposit' | 'open_chat';
  ctaAmountCents: number;
  ctaTargetBoxId: string | null;
} | null;

export type ActivityItem = {
  id: string;
  type: string;
  amountCents: number;
  description: string;
  postedAt: string;
  box: { id: string; name: string } | null;
};

export type HomeSummary = {
  /** Wallet box id, or null when the wallet hasn't been backfilled yet. */
  walletBoxId: string | null;
  totalLockedCents: number;
  walletBalanceCents: number;
  connectedBalanceCents: number;
  totalLockedDeltaCents: number;
  nextBill: {
    boxId: string;
    boxName: string;
    amountCents: number;
    dueAt: string | null;
  } | null;
  bankerNudge: BankerNudge;
  recentActivity: ActivityItem[];
  /** Sprint 3 — drives the keyholder-action banner on Home. */
  pendingKeyholderRequestsCount: number;
  /** Sprint 3 — drives the owner-status banner on Home. */
  pendingOwnerRequestsCount: number;
  /**
   * Sprint 4 — boxes currently inside an active 30-minute
   * temporary unlock window. Sorted by soonest expiry. The
   * server stamps `secondsRemaining` at response time; the
   * client re-derives every second via setInterval.
   */
  temporarilyUnlockedBoxes: {
    id: string;
    name: string;
    expiresAt: string;
    secondsRemaining: number;
  }[];
};

// ─── Keyholder + owner request types (Sprint 3) ──────────────────────────

export type UnlockRequestType = 'UNLOCK' | 'TRANSFER';

export type UnlockRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'EXPIRED'
  | 'PENDING_USER_ACCEPTANCE'
  | 'CANCELLED_BY_USER'
  | 'FAILED';

export type KeyholderRequestSummary = {
  id: string;
  requestType: UnlockRequestType;
  status: UnlockRequestStatus;
  reason: string | null;
  reflection: string | null;
  transferAmountCents: number | null;
  requestedAt: string;
  box: {
    id: string;
    name: string;
    lockType: LockType;
    balanceCents: number;
  };
  owner: {
    name: string | null;
    email: string | null;
  };
};

export type KeyholderRequestsResponse = {
  requests: KeyholderRequestSummary[];
};

export type KeyholderRequestDetail = {
  id: string;
  status: UnlockRequestStatus;
  requestType: UnlockRequestType;
  reason: string | null;
  reflection: string | null;
  transferAmountCents: number | null;
  destinationBoxName: string | null;
  requestedAt: string;
  resolvedAt: string | null;
  cooldownUntil: string | null;
  box: {
    id: string;
    name: string;
    lockType: LockType;
    balanceCents: number;
    lockUntil: string | null;
    status: BoxStatus;
  };
  owner: {
    name: string | null;
    email: string | null;
  };
};

export type KeyholderApproveResponse = {
  approved: true;
  pendingUserAcceptance: boolean;
  boxName: string;
  destinationBoxName: string | null;
};

export type KeyholderDenyResponse = {
  denied: true;
  boxName: string;
  cooldownUntil: string;
};

export type OwnerRequestSummary = {
  id: string;
  requestType: UnlockRequestType;
  status: UnlockRequestStatus;
  reason: string | null;
  transferAmountCents: number | null;
  destinationBoxName: string | null;
  requestedAt: string;
  resolvedAt: string | null;
  cooldownUntil: string | null;
  box: {
    id: string;
    name: string;
    lockType: LockType;
    balanceCents: number;
  };
  keyholder: {
    email: string;
    name: string | null;
  } | null;
};

export type OwnerRequestsResponse = {
  requests: OwnerRequestSummary[];
};

export type InsightTone = 'success' | 'warning' | 'neutral';

export type BankerInsight = {
  key: 'income' | 'locked' | 'available';
  label: string;
  valueCents: number;
  caption: string;
  tone: InsightTone;
  badge: string;
};

export type BankerInsightsResponse = { insights: BankerInsight[] };

export type BankerNudgeResponse = { nudge: BankerNudge };

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  timezone: string | null;
  createdAt: string;
};

export type Subscription = {
  plan: string;
  priceCents: number;
  renewsAt: string | null;
  status: 'active' | 'canceled' | 'past_due';
};

export type ProfileCounts = {
  boxCount: number;
  keyholdersCount: number;
  connectedBanksCount: number;
};

export type UserProfileResponse = {
  user: UserProfile;
  subscription: Subscription;
  counts: ProfileCounts;
};

export type LoginResponse = {
  token: string;
  userId: string;
  email: string | null;
  name: string | null;
  expiresInSeconds: number;
};

export type TransactionsListResponse = {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  transactions: {
    id: string;
    type: string;
    amountCents: number;
    description: string;
    postedAt: string;
    box: { id: string; name: string; lockType: LockType } | null;
  }[];
};

export type DepositResponse = {
  ok: boolean;
  newBalance: number;
  amount: number;
};

export type TransferResponse = {
  ok: boolean;
  fromBalance: number;
  amount: number;
};
