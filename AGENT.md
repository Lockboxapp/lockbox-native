# AGENT.md — LockBox Native Project Context
# ============================================================
# READ THIS ENTIRE FILE BEFORE WRITING ANY CODE.
# This file is the single source of truth for any AI agent
# working on the native (mobile) app, regardless of model or tool.
# Last updated: May 18, 2026 — design craft standard added to Section 5
# (the frontend-design skill). Sprints 1B–5 shipped.
# ============================================================

This file mirrors the web app's `AGENT.md` (in `lockbox-ui`) where the rule
applies on both sides, but is purpose-built for the React Native app. When
something is true of *both* repos, the web `AGENT.md` is the authoritative
source — read it before touching anything that crosses repo boundaries.

---

## SECTION 1 — WHAT LOCKBOX IS

LockBox is a behavioral accountability fintech app. Users lock real money into
named containers and optionally require a trusted "keyholder" (a partner,
friend, or family member) to approve any early withdrawal. The core value
proposition is making impulsive access to saved money genuinely difficult —
not simulated tracking, not virtual envelopes. Real money. Real friction.

**One-liner:** "Lock your bill money until due day — rent, guaranteed."

**Target user:** Renters and savers who struggle with impulse spending and need
hard guardrails. They've tried budgeting apps and failed. They need money to be
physically out of reach until it's needed.

**This repo:** the native mobile shell that delivers the same product on iOS
and Android. The web app (`lockbox-ui`) hosts the API, the keyholder approval
flow, the admin dashboard, and the marketing site. The native app calls
`lockbox-ui`'s API directly.

---

## SECTION 2 — NATIVE TECH STACK

| Layer            | Technology                                              |
|------------------|---------------------------------------------------------|
| Framework        | Expo SDK 54 (`expo`, `expo-router`)                     |
| Runtime          | React Native 0.81 (New Architecture enabled)            |
| Language         | TypeScript — `npx tsc --noEmit` must be clean           |
| Routing          | Expo Router (file-based, typed routes, anchor `(tabs)`) |
| Fonts            | DM Serif Display (display/h1) + DM Sans (everything    |
|                  | else) via `@expo-google-fonts/*`. Splash held until    |
|                  | fonts load.                                             |
| Theming          | Custom — `constants/theme.ts` (palette, spacing, radius,|
|                  | typography, shadows, light/dark variants).              |
| Storage          | `expo-secure-store` for auth token. AsyncStorage NOT   |
|                  | used for credentials.                                   |
| Icons            | `@expo/vector-icons` (Ionicons in the shell)            |
| Animation        | `react-native-reanimated` (loaded by Expo by default)  |
| Safe area        | `react-native-safe-area-context`                        |
| Navigation theme | React Navigation `ThemeProvider`, colors derived from  |
|                  | LockBox tokens (no defaults from RN/Navigation)         |
| Linting          | `expo lint` (ESLint 9 + `eslint-config-expo`)           |
| Hosting          | None. Native app is shipped through EAS/App Store.     |

**Backend the native app calls:** `lockbox-ui` (Next.js / Vercel /
Neon Postgres / Prisma 5.22 / NextAuth 4). See the web `AGENT.md` for the
authoritative breakdown.

---

## SECTION 3 — REPO LOCATION

| Field          | Value                                                  |
|----------------|--------------------------------------------------------|
| Local path     | `C:\LockBox\lockbox-native`                            |
| GitHub         | https://github.com/Lockboxapp/lockbox-native (private) |
| Default branch | `main`                                                 |
| Tags           | None yet (Sprint 1B = `c6eaa70`, 1C = `ba07802`)        |

The native app's git history is fully independent of `lockbox-ui`. Do not
nest, submodule, or share a working tree with the web repo.

---

## SECTION 4 — BACKEND INTEGRATION RULES

The native app talks to **`https://lockboxfinance.com/api/*`** only.

**Non-negotiable rules:**

1.  **Single client.** All network calls go through `services/api.ts`. No
    other file in this repo may import from `fetch`, `XMLHttpRequest`, or any
    HTTP library. If a screen needs a new endpoint, add it to `services/api.ts`
    and to `services/types.ts` first.

2.  **No direct `fetch()` in screens.** Screens consume `api.*` from
    `services/api.ts`. This indirection is what lets us move to a namespaced
    mobile API later without rewriting screen code.

3.  **No `/api/native/*` routes.** Board decision (Notion: Native Sprint 2
    handoff). Reuse existing `lockbox-ui` routes. Composed mobile-shaped
    endpoints (`/api/home/summary`, `/api/banker/nudge`,
    `/api/banker/insights`) live under their normal namespaces and are also
    callable by the web app.

4.  **Auth is Bearer-token over HTTPS.** Login goes through
    `POST /api/auth/mobile/token` (returns a NextAuth-compatible JWT). The
    token is stored in `expo-secure-store` under key `lockbox_token` and
    sent on every request as `Authorization: Bearer <token>`. The token
    must never be stored in `AsyncStorage`, `localStorage`, files on disk,
    or logged.

5.  **Error shape:** lockbox-ui returns `{ error: 'message', code?: '…' }`
    on failure. `services/api.ts` rethrows these as `Error`s — screens render
    via `<ErrorState message={…} />`. Do not swallow errors silently.

6.  **No mocked endpoints.** If the API isn't ready, render an empty/loading
    state and add the endpoint to `lockbox-ui`. Do not hardcode response
    shapes in the native app.

---

## SECTION 5 — DESIGN SYSTEM

`constants/theme.ts` is the **single source of truth** for visual tokens.

| Token group     | Lives in                          | How to use                          |
|-----------------|-----------------------------------|-------------------------------------|
| Colors          | `theme.colors` (light + dark)     | `useTheme().colors.{accent,text,…}` |
| Spacing         | `theme.spacing` (xs → huge)       | `useTheme().spacing.lg`             |
| Radius          | `theme.radius` (sm → pill)        | `useTheme().radius.xl`              |
| Typography      | `theme.typography` (display, h1,  | `style={t.typography.display}`      |
|                 |  h2, title, body, bodyStrong,     |                                     |
|                 |  label, eyebrow, caption, stat)   |                                     |
| Font families   | `theme.fontFamily.{serif,sans,…}` | typography variants use these       |
| Shadows         | `theme.colors.shadow`             | applied automatically by `AppCard`  |
| Mode            | `theme.mode` ('light' \| 'dark')  | `if (t.mode === 'dark') …`          |

**Hard rules:**

1.  **No hardcoded hex anywhere outside `constants/theme.ts`.** `grep` for
    `#[0-9a-fA-F]{3,6}` in `app/` and `components/` must return zero results.
2.  **Every screen uses `useTheme()`.** Screens may not import `Colors`
    directly. They consume the active theme via the hook.
3.  **Dark mode is not optional.** Anything you build must work in both
    light and dark, driven by the device color scheme through `useTheme()`.
4.  **No tone overrides except via the theme.** If a screen needs a new
    color or variant, add a token in `theme.ts` first.

### Design craft — the `frontend-design` skill

The Anthropic `frontend-design` skill (installed 2026-05-18, global) is
the standard for every native screen and component. It pushes for
distinctive, intentional, non-generic interfaces.

**Reconciliation with the board direction.** LockBox's aesthetic is a
board-locked decision: *calm, minimal, premium, high-trust, no
decorative clutter* — it is a fintech app handling real money. The skill
explicitly blesses *"refined minimalism"* as a first-class execution
path ("restraint, precision, and careful attention to spacing,
typography, and subtle details"). So the two reconcile: **apply the
skill as precise, high-craft restraint — never maximalist chaos.** If a
task ever seems to call for a genuinely bold/maximalist treatment, flag
the conflict with the board direction; do not silently diverge.

**Web → React Native translation.** The skill is written for web. Map
its concepts: CSS variables → `constants/theme.ts` tokens; Motion
library → `react-native-reanimated`; web grain/noise textures → real RN
depth (layered surfaces, the theme shadow, hairline dividers) — never
faux-texture hacks.

Apply on every screen and component:

a.  **Typographic hierarchy is deliberate.** Use the `typography` scale
    only — never ad-hoc font sizes. DM Serif Display carries display/h1;
    DM Sans carries body and UI text. One clear focal point per screen.
b.  **Spacing has rhythm.** Use the `spacing` scale exclusively.
    Generous negative space is the default; density is a deliberate,
    justified exception.
c.  **Color is disciplined.** Forest green is the single dominant
    accent — one or two sharp accent moments beat an evenly-tinted UI.
    `badge.*` status colors carry status meaning only.
d.  **Motion is purposeful.** Favor one well-orchestrated moment (a
    staggered reveal, a smooth state transition) over scattered
    micro-animations. Never animate just to animate.
e.  **Depth comes from real surfaces** — layered cards, theme shadow,
    hairline dividers. Not faux web textures.
f.  **No generic AI aesthetics.** No system-default fonts, no
    purple-on-white gradients, no cookie-cutter layouts. Every screen
    should feel specifically designed for a money app people trust.
g.  **Match craft to the surface.** A confirmation sheet, an empty
    state, and a primary flow each deserve attention proportional to how
    often the user sees them — but none may feel unfinished.

---

## SECTION 6 — COMPONENT LIBRARY

Reusable primitives live under **`components/ui/`** and are barrel-exported
through `components/ui/index.ts`.

| Component       | Purpose                                                   |
|-----------------|-----------------------------------------------------------|
| `AppScreen`     | Safe-area + scroll wrapper, themed bg, consistent padding |
| `AppCard`       | Card surface, three tones (default/accent/subtle)         |
| `SectionHeader` | Eyebrow + title + subtitle + optional trailing slot       |
| `Badge`         | Pill status badge: flexible/locked/keyholder/neutral/     |
|                 | success/warning/danger                                    |
| `ActionButton`  | Button hierarchy: primary / secondary / ghost             |
| `LoadingState`  | Themed loading spinner + caption — Sprint 2               |
| `ErrorState`    | Themed error card with retry CTA — Sprint 2               |

**Hard rules:**

1.  **All reusable primitives live in `components/ui/`.** Do not stuff
    them in `app/(tabs)/_components/` or alongside screen files.
2.  **No one-off styled components in screen files.** If you find yourself
    declaring a wrapper that another screen would want, lift it into
    `components/ui/`.
3.  **Always import via the barrel:** `import { AppScreen, AppCard } from
    '@/components/ui'`. Do not deep-import the individual file.

---

## SECTION 7 — TAB STRUCTURE

The shell is a 4-tab bottom navigator (`app/(tabs)/_layout.tsx`).

| Tab     | File                       | Ionicon (active / outline)              |
|---------|----------------------------|-----------------------------------------|
| Home    | `app/(tabs)/index.tsx`     | `home` / `home-outline`                 |
| Boxes   | `app/(tabs)/boxes.tsx`     | `cube` / `cube-outline`                 |
| Banker  | `app/(tabs)/banker.tsx`    | `chatbubble-ellipses` / `…-outline`     |
| Account | `app/(tabs)/account.tsx`   | `person-circle` / `person-circle-outline` |

**Hard rules:**

1.  **The 4-tab architecture is fixed for v1.** Do not add, rename, reorder,
    or remove tabs without a board-level decision. The web app uses Home /
    Vaults / Card / Banker — the native app intentionally diverges (Boxes
    instead of Vaults; no Card tab in Sprint 1).
2.  **Tab labels and icons read from `useTheme()`.** Do not hardcode tab
    bar colors or padding.
3.  **Sub-routes hang off the tab files.** Modal screens, full-screen
    flows, and detail pages should live under `app/` and be opened by
    pushing on the tab's stack — not by adding new tabs.

---

## SECTION 8 — MONEY DISPLAY RULE

Money values come from `lockbox-ui` in **cents** (`Int` in Prisma). The
native app:

1.  **Never stores floats for money.** Cents in, cents in state.
2.  **Divides by 100 at the display layer only** — typically inside a small
    formatter like `formatCents(cents)` colocated with the screen, OR by
    passing cents to a `<MoneyText>` primitive (Sprint 3+).
3.  **Sends amounts back to the API in dollars** when the existing route
    accepts `amountInDollars` (e.g. `/api/boxes/transfer`,
    `/api/boxes/:id/deposit`). The route converts to cents server-side via
    `Math.round(amount * 100)`. Do not pre-multiply on the client.
4.  **Currency formatting uses `Intl.NumberFormat`** with `style: 'currency',
    currency: 'USD'`. Don't roll your own.

If the API returns a float for a money field, treat that as a bug in the
API — fix it in `lockbox-ui`, don't paper over it in the native app.

---

## SECTION 9 — LOCK ENFORCEMENT RULE

**All lock logic is server-side only.** This is a board-level non-negotiable
rule (web `AGENT.md` Section 16, item 1).

1.  **Never replicate lock enforcement in the native app.** The native app
    *displays* lock state (badges, copy, disabled CTAs). It does not decide
    whether a transfer / withdrawal is allowed — the server does.
2.  **Never short-circuit a server response.** If the server returns 403
    with `{ locked: true, lockType: 'HARD' }`, show the message and stop.
    Do not retry, do not bypass, do not transform the error into something
    softer.
3.  **The keyholder approval token is never visible to the requesting user.**
    The native app must not request, store, or display the keyholder's
    `approvalToken`. This is enforced server-side; the native app must not
    work around it.
4.  **`available = balance - lockedAmount`** is the only money figure a
    screen may display as "spendable." If a screen needs another aggregate,
    compute it server-side and expose it via the API.

---

## SECTION 10 — TYPESCRIPT RULE

`npx tsc --noEmit` **must exit 0 before every commit.**

- Strict mode is on in `tsconfig.json`. Do not loosen it.
- No `@ts-ignore` / `@ts-expect-error` without a one-line comment explaining
  why and what would let us remove it.
- API response types live in `services/types.ts`. Derive them from the
  Prisma schema (read `lockbox-ui/prisma/schema.prisma` — do not infer
  from a single response).
- Component props are typed inline. No `any` in screen props.

---

## SECTION 11 — PRE-TASK CHECKLIST FOR EVERY AI AGENT

Adapted from the web `AGENT.md` Section 20. Before writing any code in
this repo, confirm:

  [ ] Have I read the existing screen / component / hook this task touches?
  [ ] Does the API call I'm about to make already exist in `services/api.ts`?
      If not, am I adding it there *first* (along with its type in
      `services/types.ts`)?
  [ ] Am I rendering money via `cents / 100`, NEVER storing or passing
      floats for money?
  [ ] Am I sending the API the shape it expects (e.g. `amountInDollars`
      not pre-multiplied cents)?
  [ ] Am I trusting the server's lock decision rather than re-deciding it
      on the client?
  [ ] Am I using `useTheme()` and `components/ui/*`, with zero hardcoded
      hex / spacing / font-family?
  [ ] Am I importing reusable primitives via the `@/components/ui` barrel?
  [ ] Does this screen handle the three core states: loading, error, empty?
  [ ] Is the auth token coming from `expo-secure-store` only, never
      `AsyncStorage` or in-memory module state that survives logout?
  [ ] Will `npx tsc --noEmit` pass after my changes?
  [ ] If I'm touching `lockbox-ui` files, am I reading the web `AGENT.md`
      Section 20 too?

If any answer is uncertain, read the relevant section of this file (or the
web `AGENT.md`) before proceeding. Do not guess. Do not assume.

---

## SECTION 12 — SPRINT LOG

| Sprint           | Date         | Commit       | One-liner                                                       |
|------------------|--------------|--------------|-----------------------------------------------------------------|
| Native 1B        | 2026-05-11   | `c6eaa70`    | Design system + reusable UI primitives + tab shell polish.       |
| Native 1C        | 2026-05-11   | `ba07802`    | DM Serif Display + DM Sans wired; per-screen polish; demo cleanup.|
| Native 2         | 2026-05-11   | `7cb791e`    | Backend integration: services/api.ts, JWT auth, all 4 tabs wired.|

Update this table at the end of each sprint with the final commit hash.

---

## SECTION 13 — WHEN TO UPDATE THIS FILE

Update after:
  - Sprint completes (Section 12)
  - New dependency added (Section 2)
  - New backend rule or endpoint convention (Section 4)
  - New reusable primitive added to `components/ui/` (Section 6)
  - Tab structure changes (Section 7) — requires board-level approval
  - Board decision changes a rule (Sections 4, 5, 8, 9, 10)

Do NOT update after every small code change. Only meaningful shifts.

---

AGENT.md — LockBox Native | Maintained by Darian Garrett, Founder
Do not remove, abbreviate, or summarize this file. It is the project memory
for the native build.
