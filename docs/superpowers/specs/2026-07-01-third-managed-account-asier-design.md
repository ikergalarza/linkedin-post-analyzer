# Design: Add Asier as a 3rd managed account + collapse per-person voice to one generic "Neety" voice

Date: 2026-07-01
Status: Approved (pending written-spec review)

## Context

The Accounts section currently tracks **2 managed LinkedIn accounts** (Iker and Unai),
each with its own Unipile `account_id` stored in `creators.unipile_account_id`. We are
starting to publish on a **third profile, Asier Olaizola**, and want it tracked with full
parity: analytics/outliers, the pending-comments inbox with reply + reaction generation,
and post writing in the Post Creator.

An exhaustive code map (verified by hand) showed the backend is already **multi-account
generic** for the heavy lifting — every background job and scraping path enumerates
managed accounts with `WHERE is_managed = TRUE AND unipile_account_id IS NOT NULL` and
uses each creator's own `unipile_account_id`. The only blockers are a handful of places
that **hardcode the names "Iker"/"Unai"** to pick a per-person writing voice.

Separately, the user has decided the per-person voice profiles are not worth maintaining
(only Iker's is decent, Unai's is wrong, the Network commenter voices are unused). Since
all three people (Unai = CEO, Iker + Asier = cofounders) post about B2B sales, we will
**collapse voice down to a single generic "Neety" voice** used everywhere, which also
removes every name-hardcoding in one move.

### Known facts
- 3rd profile: **Asier Olaizola** — `https://www.linkedin.com/in/asier-olaizola/`
- Asier's Unipile account id: **`tFnNGMBNQfG29z5yIF207g`**
- Generic voice row name in DB: **`Neety`** (rename existing `Iker` row → `Neety`, drop `Unai`)
- Voice editor UI: keep a **single editable form** ("Voz Neety")
- Asier onboarding: **performed by the implementer** via API calls against the live backend

## Goals
1. Asier tracked with the same depth as Iker/Unai (analytics, outliers, snapshots, followers, comments inbox, replies, reactions, Post Creator).
2. Replace all hardcoded Iker/Unai name-matching with a single generic voice, so no per-person wiring is needed for Asier or any future account.
3. Simplify the Network commenter UI: remove the Iker/Unai/Custom selector; comments always use the generic voice.

## Non-goals
- No changes to the outlier scoring algorithm.
- No new "add managed account" admin wizard — onboarding uses the existing `POST /api/creators` + `PATCH /api/accounts/:id` endpoints.
- Not removing the ability to edit the generic voice (we keep one editable form).
- Not deleting the `commenter_profile` table or its columns (only collapsing to one row).

## Two independent workstreams

The two workstreams do not depend on each other and can be verified separately. Onboarding
(A) uses endpoints already in production; the voice collapse (B) is a code change.

---

## Workstream A — Onboard Asier (data/operational, no code changes)

Uses existing, already-deployed, N-account-generic flows. Performed by the implementer via
API calls against the live backend (base URL to be read from the frontend config /
`VITE_API_URL`).

Steps (one-time):
1. **Create creator** — `POST /api/creators` with `{ "linkedin_url": "https://www.linkedin.com/in/asier-olaizola/" }`. Fetches his profile via the default Unipile account and kicks off an initial scrape. Returns the new `creator.id`.
2. **Mark managed + attach his Unipile account** — `PATCH /api/accounts/:creatorId` with `{ "is_managed": true, "unipile_account_id": "tFnNGMBNQfG29z5yIF207g" }`.
3. **Refresh with his own account** — `POST /api/creators/:creatorId/refresh` (or the Accounts "Get new posts" action), so the scrape now runs under Asier's own Unipile account and impressions/snapshots/followers come through.

After this, these auto-include Asier with zero further work (all query `is_managed = TRUE`):
- `services/postMonitor.ts` — 15-min post scrape + snapshots
- `services/followerSync.ts` — daily follower roster/growth
- `services/accountSnapshots.ts` — profile + WVMP snapshots
- `services/outliers.ts` — hybrid (impressions-based) outlier scoring for managed accounts
- Frontend `pages/Accounts.tsx` (account tabs/selector) and `components/accounts/RepliesPanel.tsx` (comments inbox) already render managed accounts dynamically.

Acceptance for A: Asier appears as a managed account in the Accounts UI; after refresh his
posts show impressions; his pending comments appear in the Comments inbox.

---

## Workstream B — One generic "Neety" voice

### B0. Data migration (`backend/src/db/migrate.ts`, new `v29`)

Idempotent block, appended to the migration function:
- Rename the existing best-filled voice row: `UPDATE commenter_profile SET name = 'Neety' WHERE LOWER(name) = 'iker';`
- Remove the unused/incorrect row: `DELETE FROM commenter_profile WHERE LOWER(name) = 'unai';`
- Safety net (in case neither exists on a fresh DB): `INSERT INTO commenter_profile (name) SELECT 'Neety' WHERE NOT EXISTS (SELECT 1 FROM commenter_profile WHERE LOWER(name) = 'neety');`

The unique index on `LOWER(name)` (from v19) stays. The table keeps all columns; we simply
converge on one canonical row.

### B1. Model — repoint the default (`backend/src/models/commenterProfile.ts`)
- Change `const DEFAULT_NAME = 'Iker';` → `const DEFAULT_NAME = 'Neety';`
- `.get()` continues to return the single canonical profile. `getByName` / `listAll` /
  `upsertByName` are unchanged (generic).

### B2. Post Creator voice (`backend/src/routes/chat.ts`, `buildVoiceContext`, ~L453–492)
- Delete the `\biker\b` / `\bunai\b` regex trigger and the "later mention wins" logic.
- Always load the single generic voice via `CommenterProfileModel.get()` and inject it.
- Relabel the injected block header from `WRITE THIS POST IN <NAME>'S VOICE` to
  `WRITE THIS POST IN THE NEETY VOICE`. Keep the existing PRECEDENCE paragraph (viral data
  still outranks voice). If the profile has no usable fields, inject nothing (unchanged).
- Net effect: every Post Creator draft is written in the one generic voice, regardless of
  which name (if any) is mentioned.

### B3. Comment reply generator (`backend/src/routes/accounts.ts`)
- Delete `voiceProfileNameForCreator()` (~L1729–1734).
- In the reply `generate` endpoint (~L2146–2156): replace
  `voiceProfileNameForCreator(post.creator_name)` + `getByName(voiceName)` with a single
  `CommenterProfileModel.get()`. Remove the "No voice profile mapped for creator" 400 path.
  Replies on Asier's (and everyone's) comments use the generic voice.
- The generic emoji short-circuit for media-only/empty comments (added earlier) is unchanged.

### B4. Google Chat owner label (`backend/src/services/googleChat.ts` + call site)
- `detectOwner()` (~L19–24) currently maps the creator name to `Iker|Unai|unknown` and a
  `suggestedVoice`. The only consumer (`routes/accounts.ts` ~L1605) uses it **only for the
  notification header**; supportive comments already use a neutral voice. The
  `/google-chat-preview` endpoint returns `owner: ownerInfo.owner`, and the frontend
  `GoogleChatModal.buildHeader` renders `NUEVO POST <OWNER>` — first name only for Iker/Unai,
  but the full `creator_name` (uppercased) for the `unknown` fallback. So today Asier would
  show as `NUEVO POST ASIER OLAIZOLA` (name + surname), inconsistent with the others.
- Change so **all three read the same way — first name only**: the header shows
  `NUEVO POST <FIRST_NAME>` where `<FIRST_NAME>` is the first token of `creator_name`,
  uppercased (→ `NUEVO POST IKER` / `NUEVO POST UNAI` / `NUEVO POST ASIER`), with a generic
  fallback when `creator_name` is null.
- Implementation: drop `detectOwner`/`OwnerInfo`/`suggestedVoice`; the endpoint returns the
  real `creator_name` (already in the payload), and `GoogleChatModal.buildHeader` derives the
  first name from it. Update the `owner` field/type accordingly (or replace it with just
  `creator_name`).

### B5. Network comment generation (`backend/src/routes/network.ts`, `POST /posts/:id/generate-comments`, ~L287–333)
- Drop the `profile_name` and inline `override` branches. Always resolve the voice via
  `CommenterProfileModel.get()`.
- `GET /api/network/profiles`, `PUT /api/network/profiles/:name`, `GET/PUT /profile` remain
  (the single-form editor in B7 uses `GET/PUT /profile`, which already targets the default
  row). `listAll` may still be used by the editor; it will simply return the one row.

### B6. Frontend — Network commenter selector removal
- `components/network/WeeklyFeed.tsx` (~L45–53, L79, L225): remove `PROFILE_CHOICES`,
  `readStoredMode`, the `commenterMode` state + localStorage, and the selector buttons.
  Comment generation calls no longer pass a mode.
- `components/network/NetworkPostCard.tsx` (~L72–89): remove the `mode: 'Iker'|'Unai'`
  prop/type and the `profile_name` it sends; call `generate-comments` with no profile
  override (backend uses the generic voice).

### B4b. Name-display consistency across the Accounts section (audit result — no code change)

An audit of every name-display site in the Accounts section confirmed Asier will render
**consistently** with Iker/Unai everywhere, because names come from `creators.name` (the full
LinkedIn name, e.g. "Iker Galarza Rodríguez") applied generically:
- **Full name (all accounts):** account manager panel, account dropdown, per-account table
  (`Accounts.tsx`), Live/Top post headers (`creator_name`), Comments inbox selector + post
  group label (`RepliesPanel.tsx`), Google Chat modal subtitle.
- **First name only, but derived generically:** the engagement chart tooltip + pencil title
  (`AccountsEngagementChart.tsx`, `firstName(name) = name.split(/\s+/)[0]`) → Asier → "Asier"
  automatically.
- **Google Chat notification header:** made first-name-for-all in B4 (`NUEVO POST ASIER`).

No per-account special-casing exists or is needed. Verification item: after onboarding,
spot-check that Asier shows full name where Iker/Unai do and "Asier" in the chart tooltip /
Google Chat header (i.e. never full-name where the others are first-name, and never
first-name where the others are full-name).

### B6b. Post Creator LinkedIn preview persona (audit result — no code change for the preview)

The Post Creator's LinkedIn preview is already fully dynamic and will show Asier's identity
automatically once he is onboarded (Workstream A):
- `pages/PostCreator.tsx` loads the persona list from `GET /api/accounts` (~L188–205) and
  renders one **"Ver como: <name>"** button per managed account (`personas.map`, ~L802).
- The active persona's `name` / `headline` / `profile_image_url` / `followers_count` are fed
  into `components/postcreator/LinkedInPostPreview.tsx` (~L847–851), which renders the card
  (avatar, name, headline, followers) purely from those props — no hardcoded names.
- So Asier appears as a third "Ver como: Asier" button and the preview shows his real name +
  photo + headline + followers, with zero preview code changes.

Cosmetic cleanup (part of B, so the UI stops implying voice-by-name):
- Update the empty-state help line (`PostCreator.tsx` ~L495) that reads
  *"Say Iker or Unai to write in that person's voice"* — after the generic-voice change,
  saying a name no longer changes the voice. Reword to reflect that the "Ver como" picker only
  chooses the **preview identity** (name + photo), not the writing voice (which is now the one
  Neety voice). Also refresh the stale comments at ~L466–468 and ~L797 that reference
  "Iker & Unai".

### B7. Frontend — collapse the voice editor (`components/network/CommenterProfileForm.tsx`)
- Remove `DEFAULT_PROFILES = ['Iker','Unai']`, the two-tab state, and the `activeName`
  tab switching (~L26–43, L94).
- Render a **single editable form** labelled "Voz Neety" bound to the one generic profile,
  loaded via `GET /api/network/profile` and saved via `PUT /api/network/profile` (the
  default-row endpoints, which resolve to the `Neety` row after B1). No tabs, no per-person
  buttons.

---

## Rollout order
1. Ship Workstream B backend (migration v29 runs on boot; endpoints stop requiring a name).
2. Ship Workstream B frontend (selector removed, single voice form).
3. Run Workstream A onboarding calls against the live backend; refresh Asier.

B and A are independent; A can also be run first (it uses already-deployed endpoints). The
migration is idempotent and safe to redeploy.

## Verification checklist
- **Asier tracking:** appears as managed in Accounts with stats; after refresh his posts
  show impressions; `postMonitor`/`followerSync` pick him up (next tick / next day); his
  pending comments list in the Comments inbox.
- **Replies:** generating a reply to a comment on Asier's post returns a draft (no "no voice
  mapped" error) in the generic voice; media-only comments still return a support emoji.
- **Post Creator:** a new post is written in the Neety voice with no name mention needed;
  mentioning "Iker"/"Unai"/"Asier" no longer changes the voice.
- **Network:** the Iker/Unai/Custom selector is gone; generating comments still works and
  uses the generic voice; the "Voz Neety" editor loads and saves.
- **Google Chat:** a managed-post notification header shows the real creator name
  (incl. "Asier Olaizola").
- **Typecheck:** `npx tsc --noEmit` green in `backend` and `frontend`.

## Risks & mitigations
- **Onboarding needs the live backend URL / auth.** The comment-inbox and creator endpoints
  are called by the frontend without an auth token, so a direct API call should work; the
  base URL is read from the frontend `VITE_API_URL`. If the `POST /api/creators` initial
  scrape uses the default account and misses impressions, step A3 (refresh under Asier's own
  account) fixes it. Mitigation: verify Asier's row has `unipile_account_id` set before the
  refresh.
- **Losing Iker's/Unai's stored voice content.** The migration keeps Iker's content (renamed
  to Neety) and only drops the unused Unai row. Reversible by re-seeding if needed.
- **Any other consumer of the named profiles.** The code map found only the consumers listed
  above (chat, accounts reply, network, googleChat). The migration + `DEFAULT_NAME` repoint
  keep `.get()` working for all of them.
- **Frontend references to removed props.** After removing `mode`/`profile_name`, a compile
  pass (`tsc --noEmit`) catches any stragglers in `NetworkPostCard`/`WeeklyFeed`.

## Out-of-scope follow-ups (not doing now)
- A dedicated "add managed account" UI wizard.
- Reintroducing per-person voices (explicitly rejected).
