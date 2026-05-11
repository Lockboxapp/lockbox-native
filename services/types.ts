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
