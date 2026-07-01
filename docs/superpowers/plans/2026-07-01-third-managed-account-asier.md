# Add Asier as 3rd Managed Account + Single Generic "Neety" Voice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track a third LinkedIn profile (Asier Olaizola) with full parity to Iker/Unai, and replace all hardcoded per-person voice matching with one generic "Neety" voice used everywhere.

**Architecture:** The backend is already multi-account-generic (background jobs enumerate `is_managed = TRUE` creators and use each creator's own `unipile_account_id`). This plan (a) removes the handful of hardcoded Iker/Unai name→voice mappings, collapsing them to a single `commenter_profile` row named `Neety`, and (b) onboards Asier via existing endpoints. Onboarding uses already-deployed API routes; the voice collapse is code.

**Tech Stack:** Node/Express + TypeScript + PostgreSQL (backend, Railway), React + TypeScript + Vite (frontend). Unipile API for LinkedIn scraping. Anthropic Claude API for generation.

## Global Constraints

- **No test framework exists.** Verification per task = `npx tsc --noEmit` (backend and/or frontend) with **zero** output/errors, plus the task-specific manual/API check. Do NOT invent jest/vitest suites.
- **Before editing any file:** `git pull --ff-only` (repo convention).
- **Commit messages in English**, substantive, ending with the trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Migrations are idempotent** (safe on redeploy and fresh DB); they run automatically on backend boot.
- **Do NOT touch outlier scoring** (`services/outliers.ts`).
- Generic voice row name is exactly **`Neety`**; `DEFAULT_NAME` in the model must match it.
- Asier facts (verbatim): name **`Asier Olaizola`**, URL **`https://www.linkedin.com/in/asier-olaizola/`**, Unipile **`account_id = tFnNGMBNQfG29z5yIF207g`**.
- Backend commands run from `backend/`, frontend commands from `frontend/`.
- Spec of record: `docs/superpowers/specs/2026-07-01-third-managed-account-asier-design.md`.

---

## File Structure

Backend (voice collapse):
- Modify `backend/src/db/migrate.ts` — replace the v19 seed block with one idempotent block that converges on a single `Neety` row (rename Iker→Neety, drop Unai, stop re-seeding).
- Modify `backend/src/models/commenterProfile.ts` — `DEFAULT_NAME = 'Neety'`.
- Modify `backend/src/routes/chat.ts` — Post Creator always injects the generic voice.
- Modify `backend/src/routes/accounts.ts` — reply endpoint uses the generic voice; delete `voiceProfileNameForCreator`; drop `detectOwner` usage.
- Modify `backend/src/services/googleChat.ts` — delete `detectOwner`/`OwnerInfo`.
- Modify `backend/src/routes/network.ts` — generate-comments always uses the generic voice.

Frontend (voice UI simplification):
- Modify `frontend/src/components/network/WeeklyFeed.tsx` — remove commenter selector.
- Modify `frontend/src/components/network/NetworkPostCard.tsx` — remove commenter prop/types.
- Modify `frontend/src/components/network/CommenterProfileForm.tsx` — collapse to one "Voz Neety" form.
- Modify `frontend/src/components/accounts/GoogleChatModal.tsx` — header shows first name for all.
- Modify `frontend/src/pages/PostCreator.tsx` — reword the voice-by-name help line.

Operational (onboarding, no code):
- One-time API calls against the live backend.

---

## Task 1: Collapse the commenter-profile seed to one "Neety" row + default

**Files:**
- Modify: `backend/src/db/migrate.ts` (REPLACE the v19 commenter-profile seed block, ~L235–247)
- Modify: `backend/src/models/commenterProfile.ts:22`

**Interfaces:**
- Consumes: existing `commenter_profile` table (cols `name, headline, voice_style, worldview, signature_moves, avoid`).
- Produces: a single canonical row named `Neety`; `CommenterProfileModel.get()` / `.upsert()` resolve to it via `DEFAULT_NAME = 'Neety'`.

> **Why replace, not append:** the migrate function runs on every boot. The current v19 block RE-SEEDS `Iker`/`Unai` each boot (`INSERT ... WHERE NOT EXISTS`). A separate v29 that renames `Iker`→`Neety` would, on the second boot, see a freshly re-seeded `Iker` alongside the existing `Neety` and violate the unique index on rename. So we replace the v19 seed with a single self-idempotent block that stops re-seeding the retired names and converges on `Neety`.

- [ ] **Step 1: Pull latest**

Run: `git pull --ff-only`

- [ ] **Step 2: Replace the v19 seed block in `backend/src/db/migrate.ts`**

Replace this exact block (currently ~L235–247):

```sql
  -- v19: Multiple named commenter profiles — Iker + Unai by default, plus room
  -- for more. The old singleton becomes 'Iker'; 'Unai' is seeded blank so it can
  -- be edited from the Profile tab. A profile selector above the Network feed
  -- lets the user pick which voice generates the comments.
  ALTER TABLE commenter_profile ADD COLUMN IF NOT EXISTS name TEXT;
  UPDATE commenter_profile SET name = 'Iker' WHERE name IS NULL;
  INSERT INTO commenter_profile (name)
    SELECT 'Iker'
    WHERE NOT EXISTS (SELECT 1 FROM commenter_profile WHERE LOWER(name) = 'iker');
  INSERT INTO commenter_profile (name)
    SELECT 'Unai'
    WHERE NOT EXISTS (SELECT 1 FROM commenter_profile WHERE LOWER(name) = 'unai');
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_commenter_profile_name ON commenter_profile (LOWER(name));
```

with:

```sql
  -- v19 + v29: single canonical commenter voice named 'Neety'. v19 originally
  -- seeded per-person 'Iker'/'Unai' rows; v29 collapses to ONE generic voice.
  -- Fully idempotent and safe to run on every boot (no re-seeding of the retired
  -- names, and the rename is guarded so it never collides with the unique index).
  ALTER TABLE commenter_profile ADD COLUMN IF NOT EXISTS name TEXT;
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_commenter_profile_name ON commenter_profile (LOWER(name));
  -- Legacy singleton (pre-v19, name IS NULL) becomes the Neety row.
  UPDATE commenter_profile SET name = 'Neety' WHERE name IS NULL;
  -- One-time rename of the previously-seeded 'Iker' row → 'Neety' (keeps its
  -- filled-in content), only when a 'Neety' row does not already exist.
  UPDATE commenter_profile SET name = 'Neety'
    WHERE LOWER(name) = 'iker'
      AND NOT EXISTS (SELECT 1 FROM commenter_profile WHERE LOWER(name) = 'neety');
  -- Remove the retired per-person rows: 'Unai' always; a stray 'Iker' only once a
  -- 'Neety' row already exists (so we never delete the sole content row).
  DELETE FROM commenter_profile WHERE LOWER(name) = 'unai';
  DELETE FROM commenter_profile WHERE LOWER(name) = 'iker'
    AND EXISTS (SELECT 1 FROM commenter_profile WHERE LOWER(name) = 'neety');
  -- Ensure a 'Neety' row exists on a fresh DB.
  INSERT INTO commenter_profile (name)
    SELECT 'Neety'
    WHERE NOT EXISTS (SELECT 1 FROM commenter_profile WHERE LOWER(name) = 'neety');
```

- [ ] **Step 3: Repoint the model default in `backend/src/models/commenterProfile.ts`**

Change line 22 from:

```ts
const DEFAULT_NAME = 'Iker';
```

to:

```ts
const DEFAULT_NAME = 'Neety';
```

Also update the two stale comments so future readers aren't misled:
- Line ~40: `// Legacy singleton accessor — returns the default profile (Iker).` → `// Legacy singleton accessor — returns the default profile (Neety).`
- Line ~85: `// Legacy singleton upsert — writes to the default profile (Iker).` → `// Legacy singleton upsert — writes to the default profile (Neety).`

- [ ] **Step 4: Typecheck backend**

Run: `cd backend && npx tsc --noEmit`
Expected: no output (success).

- [ ] **Step 5: Review idempotency (no DB needed locally)**

Re-read the block and confirm all three boot scenarios converge on exactly one `Neety` row with no unique-index violation:
- **Fresh DB:** no NULL/iker/unai/neety rows → the final INSERT seeds `Neety`.
- **Existing prod (has Iker+Unai, no Neety):** rename `Iker`→`Neety` (guarded, no `Neety` yet → runs), delete `Unai`, delete-stray-`Iker` (no `Iker` left) → one `Neety` row keeping Iker's content.
- **Redeploy (has only Neety):** rename guarded off (`Neety` exists), no `Iker`/`Unai` rows, INSERT no-op → unchanged. No collision.

The migration runs on backend boot in production; no manual run required.

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/migrate.ts backend/src/models/commenterProfile.ts
git commit -m "$(printf 'Voice: collapse commenter profiles to a single generic Neety row (migration v29)\n\nRename the Iker row to Neety, drop the unused Unai row, and repoint\nDEFAULT_NAME so .get()/.upsert() resolve to the one canonical voice.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 2: Post Creator always writes in the generic voice

**Files:**
- Modify: `backend/src/routes/chat.ts` — `buildVoiceContext` (L453–492) and its call site (L811)

**Interfaces:**
- Consumes: `CommenterProfileModel.get()` (Task 1) → the `Neety` row.
- Produces: `buildVoiceContext(): Promise<string>` (no args) returning the voice block or `''`.

- [ ] **Step 1: Pull latest**

Run: `git pull --ff-only`

- [ ] **Step 2: Replace `buildVoiceContext` in `backend/src/routes/chat.ts`**

Replace the entire function (currently L453–492) with:

```ts
// Loads the single generic "Neety" voice from Network (commenter_profile) and
// returns a voice block that steers HOW the post is written. Empty string when
// no profile / no usable fields exist. Voice no longer depends on any name
// mentioned in the message — every post is written in the one generic voice.
async function buildVoiceContext(): Promise<string> {
  try {
    const p = await CommenterProfileModel.get();
    if (!p) return '';
    const v: string[] = [];
    if (p.headline) v.push(`Identity: ${p.headline}`);
    if (p.voice_style) v.push(`Writing style (match exactly): ${p.voice_style}`);
    if (p.worldview) v.push(`Worldview / lens: ${p.worldview}`);
    if (p.signature_moves) v.push(`Signature moves: ${p.signature_moves}`);
    if (p.avoid) v.push(`Never do: ${p.avoid}`);
    if (v.length === 0) return '';
    return `\n\n═══ WRITE THIS POST IN THE NEETY VOICE (from Network → My Profile) ═══
${v.join('\n')}

PRECEDENCE — READ CAREFULLY: The voice profile above only controls HOW the post is written (tone, phrasing, rhythm, vocabulary). It does NOT decide WHAT the post is. The hook type, post structure, archetype, angle and the virality tag MUST still come from the real outlier data above — viral data ALWAYS takes priority. Voice is the paint; the data is the blueprint.`;
  } catch (err) {
    console.warn('[buildVoiceContext] failed:', (err as Error).message);
    return '';
  }
}
```

- [ ] **Step 3: Drop the argument at the call site (L811)**

Change:

```ts
    const voiceContext = await buildVoiceContext(messages);
```

to:

```ts
    const voiceContext = await buildVoiceContext();
```

- [ ] **Step 4: Typecheck backend**

Run: `cd backend && npx tsc --noEmit`
Expected: no output. (If it complains that `messages` is now unused at that scope, ignore — `messages` is used elsewhere in the handler; only the `buildVoiceContext` argument was removed.)

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/chat.ts
git commit -m "$(printf 'Post Creator: always write in the single generic Neety voice\n\nRemove the Iker/Unai name-trigger in buildVoiceContext; always inject the\ngeneric voice from commenter_profile. Mentioning a name no longer changes\nthe voice.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 3: Comment replies use the generic voice

**Files:**
- Modify: `backend/src/routes/accounts.ts` — delete `voiceProfileNameForCreator` (L1729–1734); reply `generate` endpoint (~L2131–2156)

**Interfaces:**
- Consumes: `CommenterProfileModel.get()` (Task 1); `generateReply(...)` (unchanged signature: `authorName`, `authorVoice.{voice_style,worldview,signature_moves,avoid}`).
- Produces: reply endpoint response `{ reply, voice, comment_id, mention }` where `voice` is the generic profile name.

- [ ] **Step 1: Pull latest**

Run: `git pull --ff-only`

- [ ] **Step 2: Delete `voiceProfileNameForCreator`**

Remove the whole function block at L1729–1734 (and its preceding comment at ~L1725–1728):

```ts
// Map a creator's stored name to the commenter_profile voice entry. ...
function voiceProfileNameForCreator(creatorName: string | null | undefined): 'Iker' | 'Unai' | null {
  const n = (creatorName || '').toLowerCase();
  if (n.includes('iker')) return 'Iker';
  if (n.includes('unai')) return 'Unai';
  return null;
}
```

- [ ] **Step 3: Rewrite the voice lookup in the reply `generate` endpoint**

In the `POST /posts/:postId/comments/:commentId/generate` handler, replace this block:

```ts
    const voiceName = voiceProfileNameForCreator(post.creator_name);
    if (!voiceName) {
      return res
        .status(400)
        .json({ error: `No voice profile mapped for creator "${post.creator_name}"` });
    }
    const profile = await CommenterProfileModel.getByName(voiceName);
    if (!profile) {
      return res
        .status(400)
        .json({ error: `commenter_profile entry for "${voiceName}" is missing — seed it first` });
    }

    const reply = await generateReply({
      postContent: post.content_text || '',
      commentText: String(comment_text),
      commenterName: commenter_name || null,
      commenterHeadline: commenter_headline || null,
      authorName: voiceName,
      authorVoice: {
        voice_style: profile.voice_style,
        worldview: profile.worldview,
        signature_moves: profile.signature_moves,
        avoid: profile.avoid,
      },
    });
```

with:

```ts
    const profile = await CommenterProfileModel.get();
    if (!profile) {
      return res
        .status(400)
        .json({ error: 'Generic voice profile (Neety) is missing — seed it first' });
    }

    const reply = await generateReply({
      postContent: post.content_text || '',
      commentText: String(comment_text),
      commenterName: commenter_name || null,
      commenterHeadline: commenter_headline || null,
      // The reply is authored by the real post owner (Iker / Unai / Asier),
      // styled with the single generic Neety voice.
      authorName: post.creator_name || 'Neety',
      authorVoice: {
        voice_style: profile.voice_style,
        worldview: profile.worldview,
        signature_moves: profile.signature_moves,
        avoid: profile.avoid,
      },
    });
```

- [ ] **Step 4: Update the `voice` field in the response**

In the same handler's `res.json({...})`, change `voice: voiceName,` to `voice: profile.name,`. Leave the `mention` object and everything else unchanged.

- [ ] **Step 5: Typecheck backend**

Run: `cd backend && npx tsc --noEmit`
Expected: no output. (If `getByName` is now unused in this file, that is fine — it is a model method, not a local.)

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/accounts.ts
git commit -m "$(printf 'Comments: generate replies in the generic Neety voice for any account\n\nDelete voiceProfileNameForCreator; the reply endpoint now loads the single\ngeneric profile and authors the reply as the real post owner (so Asier\ncomments no longer 400 with no-voice-mapped).\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 4: Google Chat header shows first name for all three accounts

**Files:**
- Modify: `backend/src/services/googleChat.ts` — delete `OwnerInfo` + `detectOwner` (L14–24)
- Modify: `backend/src/routes/accounts.ts` — the `google-chat-preview` handler (import at L10, usage ~L1605, response field ~L1652)
- Modify: `frontend/src/components/accounts/GoogleChatModal.tsx` — `PreviewData` type (L13), `buildHeader` (L25–29), call site (L93)

**Interfaces:**
- Consumes: `post.creator_name` from the preview query (already selected).
- Produces: `/google-chat-preview` response no longer includes `owner`; the frontend derives `NUEVO POST <FIRST_NAME>` from `creator_name`.

- [ ] **Step 1: Pull latest**

Run: `git pull --ff-only`

- [ ] **Step 2: Delete `detectOwner` + `OwnerInfo` in `backend/src/services/googleChat.ts`**

Remove L14–24 (the `OwnerInfo` interface and the `detectOwner` function). Keep `sendToGoogleChat`.

- [ ] **Step 3: Update the import in `backend/src/routes/accounts.ts`**

Change:

```ts
import { sendToGoogleChat, detectOwner } from '../services/googleChat';
```

to:

```ts
import { sendToGoogleChat } from '../services/googleChat';
```

- [ ] **Step 4: Remove the `detectOwner` call and the `owner` response field**

In the `google-chat-preview` handler, delete these lines (~L1603–1605):

```ts
    // Owner is still detected — but only to label the header
    // ("NUEVO POST IKER/UNAI"), not to pick a commenter voice.
    const ownerInfo = detectOwner(post.creator_name);
```

Then in the `res.json({...})` for this handler, delete the line:

```ts
      owner: ownerInfo.owner,
```

(The `post.creator_name` field in the response is already present — leave it.)

- [ ] **Step 5: Update the frontend `GoogleChatModal.tsx`**

Remove `owner` from the `PreviewData` interface (delete L13 `owner: 'Iker' | 'Unai' | 'unknown';`).

Replace `buildHeader` (L25–29):

```ts
function buildHeader(owner: 'Iker' | 'Unai' | 'unknown', creatorName: string | null, url: string | null): string {
  const label = owner === 'unknown'
    ? `NUEVO POST ${(creatorName || 'ACCOUNT').toUpperCase()}`
    : `NUEVO POST ${owner.toUpperCase()}`;
  return `🐝 ${label}:\n${url || '(sin URL)'}`;
}
```

with:

```ts
function buildHeader(creatorName: string | null, url: string | null): string {
  // First name only, so all managed accounts read the same way
  // (NUEVO POST IKER / UNAI / ASIER), never name + surname.
  const first = (creatorName || '').trim().split(/\s+/)[0] || 'ACCOUNT';
  return `🐝 NUEVO POST ${first.toUpperCase()}:\n${url || '(sin URL)'}`;
}
```

Update the call site (L93):

```ts
    return buildMessage(buildHeader(data.post.creator_name, data.post.url), comments);
```

- [ ] **Step 6: Typecheck backend and frontend**

Run: `cd backend && npx tsc --noEmit`
Expected: no output.
Run: `cd frontend && npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/googleChat.ts backend/src/routes/accounts.ts frontend/src/components/accounts/GoogleChatModal.tsx
git commit -m "$(printf 'Google Chat: header shows first name for all accounts (NUEVO POST ASIER)\n\nDrop detectOwner/OwnerInfo and derive the header owner label from the first\ntoken of creator_name, so Iker/Unai/Asier render consistently.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 5: Network comment generation uses the generic voice

**Files:**
- Modify: `backend/src/routes/network.ts` — `POST /posts/:id/generate-comments` (L287–333)

**Interfaces:**
- Consumes: `CommenterProfileModel.get()` (Task 1).
- Produces: endpoint ignores any `profile_name`/`override` in the body; always uses the generic voice. The rest of the handler (post lookup, `generateComments`, bulk insert) is unchanged.

- [ ] **Step 1: Pull latest**

Run: `git pull --ff-only`

- [ ] **Step 2: Replace the profile-resolution block**

Replace everything from the comment `// Pick the commenter profile:` down to the end of the `else { ... }` block (the section that reads `override`, `profile_name`, and builds `profilePayload`, currently L289–333) with:

```ts
    // Single generic "Neety" voice for all network comments — per-person
    // voices and inline overrides were removed.
    const profile = await CommenterProfileModel.get();
    if (!profile) {
      return res.status(400).json({ error: 'Please configure your commenter profile first' });
    }
    const profilePayload = {
      headline: profile.headline,
      voice_style: profile.voice_style,
      worldview: profile.worldview,
      signature_moves: profile.signature_moves,
      avoid: profile.avoid,
      tone: profile.tone,
      expertise: profile.expertise,
    };
```

Leave the lines that follow unchanged (`const post = await NetworkPostModel.findByIdWithCreator(...)`, the `generateComments({...})` call using `profile: profilePayload`, the delete + bulk insert, and the `res.json(comments)`).

- [ ] **Step 3: Typecheck backend**

Run: `cd backend && npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/network.ts
git commit -m "$(printf 'Network: generate comments with the single generic Neety voice\n\nDrop the profile_name/override branches; always resolve the one generic\nvoice via CommenterProfileModel.get().\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 6: Remove the Network commenter selector (frontend)

**Files:**
- Modify: `frontend/src/components/network/WeeklyFeed.tsx`
- Modify: `frontend/src/components/network/NetworkPostCard.tsx`

**Interfaces:**
- Consumes: `POST /api/network/posts/:id/generate-comments` (Task 5) — now called with an empty body `{}`.
- Produces: `NetworkPostCard` no longer takes a `commenter` prop; `CommenterChoice`/`CustomCommenter` types removed.

- [ ] **Step 1: Pull latest**

Run: `git pull --ff-only`

- [ ] **Step 2: Edit `NetworkPostCard.tsx` — remove commenter types, prop, and body builder**

Delete these blocks:
- `CustomCommenter` interface (L65–69)
- `CommenterChoice` type (L71–73)
- `buildGenerateBody` function (L81–92)
- The `commenter?: CommenterChoice;` line inside `Props` (L78)

Change the component signature (L94) from:

```ts
export default function NetworkPostCard({ post, onUpdate, commenter }: Props) {
```

to:

```ts
export default function NetworkPostCard({ post, onUpdate }: Props) {
```

Change the generate call (L117) from:

```ts
      await apiPost(`/api/network/posts/${post.id}/generate-comments`, buildGenerateBody(commenter));
```

to:

```ts
      await apiPost(`/api/network/posts/${post.id}/generate-comments`, {});
```

- [ ] **Step 3: Edit `WeeklyFeed.tsx` — remove the selector, state, and storage**

- Change the import (L3) from
  `import NetworkPostCard, { CommenterChoice, CustomCommenter } from './NetworkPostCard';`
  to
  `import NetworkPostCard from './NetworkPostCard';`
- Delete `PROFILE_CHOICES` (L45) and `EMPTY_CUSTOM` (L46).
- Delete `readStoredMode` (L48–54) and `readStoredCustom` (L56–69).
- Delete the state + effects + derived choice (L79–92): the two `useState` lines for `commenterMode` and `customCommenter`, the two `useEffect` localStorage writers, and the `commenterChoice` const.
- Delete the entire "Commenter selector" JSX block (L221–279, the `<div className="bg-bg-card ...">` that contains "Commenting as:" and the Custom fields).
- Change the card render (L310) from
  `<NetworkPostCard key={post.id} post={post} onUpdate={fetchFeed} commenter={commenterChoice} />`
  to
  `<NetworkPostCard key={post.id} post={post} onUpdate={fetchFeed} />`

- [ ] **Step 4: Typecheck + lint frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: no output (this catches any leftover reference to the removed symbols).
Run: `cd frontend && npm run lint`
Expected: no new errors introduced by these files.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/network/WeeklyFeed.tsx frontend/src/components/network/NetworkPostCard.tsx
git commit -m "$(printf 'Network UI: remove the Iker/Unai/Custom commenter selector\n\nComments always use the single generic Neety voice; drop the selector,\nits localStorage state, and the CommenterChoice/CustomCommenter types.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 7: Collapse the voice editor to one "Voz Neety" form

**Files:**
- Modify: `frontend/src/components/network/CommenterProfileForm.tsx` (full rewrite of the component)

**Interfaces:**
- Consumes: `GET /api/network/profile` (returns the default `Neety` row) and `PUT /api/network/profile` (upserts it) — both already exist and resolve to `Neety` after Task 1.
- Produces: a single editable form, no per-person tabs.

- [ ] **Step 1: Pull latest**

Run: `git pull --ff-only`

- [ ] **Step 2: Replace the whole file contents**

Replace `frontend/src/components/network/CommenterProfileForm.tsx` with:

```tsx
import { useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

interface CommenterProfile {
  headline: string;
  voice_style: string;
  worldview: string;
  signature_moves: string;
  avoid: string;
}

const EMPTY: CommenterProfile = {
  headline: '',
  voice_style: '',
  worldview: '',
  signature_moves: '',
  avoid: '',
};

// Single generic "Voz Neety" — the one voice used for every generated comment
// and reply. Per-person profiles were removed.
export default function CommenterProfileForm() {
  const [profile, setProfile] = useState<CommenterProfile>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/network/profile`)
      .then((r) => r.json())
      .then((row: Partial<CommenterProfile> | null) => {
        setProfile({
          headline: row?.headline || '',
          voice_style: row?.voice_style || '',
          worldview: row?.worldview || '',
          signature_moves: row?.signature_moves || '',
          avoid: row?.avoid || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof CommenterProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProfile((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`${BASE}/api/network/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-text-muted text-sm">Loading...</div>;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <p className="text-text-secondary text-sm">
        Define <strong className="text-text-primary">how you comment</strong>, not what about. This is the single{' '}
        <strong className="text-text-primary">Neety voice</strong> used for every generated comment and reply.
      </p>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Who you are <span className="text-text-muted font-normal">(shown in comments)</span>
        </label>
        <input
          type="text"
          value={profile.headline}
          onChange={set('headline')}
          placeholder="ej. Founder @Neety · B2B Sales"
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm"
        />
      </div>

      {/* Voice style */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Your writing style
        </label>
        <textarea
          value={profile.voice_style}
          onChange={set('voice_style')}
          rows={3}
          placeholder={`Describe how you write, not what about.\n\ne.g. "Direct and to the point. Short sentences. I prefer data over opinions. Always first person. Never condescending."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1">
          Rhythm, tone, sentence structure, data vs. opinion, first/third person…
        </p>
      </div>

      {/* Worldview */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Your worldview <span className="text-text-muted font-normal">(the lens through which you see things)</span>
        </label>
        <textarea
          value={profile.worldview}
          onChange={set('worldview')}
          rows={3}
          placeholder={`e.g. "I think most B2B sales advice is wrong because it ignores positioning. I believe SDRs aren't dying — they're evolving. I'm skeptical of AI hype but optimistic about real applications."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1">
          The angle from which you analyze any topic — regardless of the specific post subject.
        </p>
      </div>

      {/* Signature moves */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Your signature commenting moves
        </label>
        <textarea
          value={profile.signature_moves}
          onChange={set('signature_moves')}
          rows={3}
          placeholder={`e.g. "I usually cite a specific number from my experience. I like to flip the main argument. I end with a provocative open question. Sometimes I share what the post is missing."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1">
          Patterns you repeat: how you open, how you close, what kind of value you add.
        </p>
      </div>

      {/* Avoid */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          What you never do
        </label>
        <textarea
          value={profile.avoid}
          onChange={set('avoid')}
          rows={2}
          placeholder={`e.g. "I never say 'great post'. I never self-promote directly. I never ask basic questions. I avoid being condescending or using corporate jargon."`}
          className="w-full px-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-sm resize-none"
        />
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-accent text-bg-primary rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Typecheck + lint frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: no output.
Run: `cd frontend && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/network/CommenterProfileForm.tsx
git commit -m "$(printf 'Network UI: collapse voice editor to a single Voz Neety form\n\nRemove the Iker/Unai tabs; one editable form bound to GET/PUT\n/api/network/profile (the default Neety row).\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 8: Reword the Post Creator voice-by-name help line

**Files:**
- Modify: `frontend/src/pages/PostCreator.tsx` (empty-state help line ~L495; stale comments ~L466–468 and ~L797)

**Interfaces:**
- Consumes: nothing new. The persona picker (already dynamic) is unchanged — Asier appears automatically once onboarded (Task 9).
- Produces: help copy that no longer implies "say a name to change the voice".

- [ ] **Step 1: Pull latest**

Run: `git pull --ff-only`

- [ ] **Step 2: Replace the help line (~L495)**

Change:

```tsx
                    <p>🧑 Say <span className="text-accent">"Iker"</span> or <span className="text-accent">"Unai"</span> to write in that person's voice.</p>
```

to:

```tsx
                    <p>🧑 Elige <span className="text-accent">"Ver como"</span> en el preview para verlo con el nombre y la foto de esa cuenta (Iker, Unai o Asier).</p>
```

- [ ] **Step 3: Refresh the two stale comments**

- The comment block at ~L465–468 that says
  `we post for both Iker & Unai and that standalone profile was ...`
  → reword the "for both Iker & Unai" phrase to "for our managed accounts (Iker, Unai, Asier)".
- The comment at ~L797 `{/* Persona picker — preview the post as Iker or Unai`
  → change to `{/* Persona picker — preview the post as any managed account`.

(These are comments only; keep them accurate but don't change behavior.)

- [ ] **Step 4: Typecheck frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/PostCreator.tsx
git commit -m "$(printf 'Post Creator: reword voice help — Ver como picks the preview identity\n\nVoice is now the single Neety voice, so saying a name does not change it.\nClarify that the Ver como picker only chooses the preview name+photo.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 9: Onboard Asier as a managed account (operational)

**Files:** none (API calls against the live backend).

**Interfaces:**
- Consumes: deployed endpoints `POST /api/creators`, `PATCH /api/accounts/:id`, `POST /api/creators/:id/refresh`, `GET /api/accounts`.
- Produces: a managed creator row for Asier with `is_managed = TRUE` and `unipile_account_id = tFnNGMBNQfG29z5yIF207g`, scraped under his own account.

> Run this AFTER Tasks 1–8 are deployed (so replies/Post Creator/Network already use the generic voice). It can technically run earlier since it uses already-deployed endpoints, but running it last keeps the whole feature consistent. Replace `<API>` below with the backend base URL from the frontend config (`frontend/.env` `VITE_API_URL`, or the Railway backend URL). All endpoints are called by the frontend without an auth token, so a plain request works.

- [ ] **Step 1: Find the backend base URL**

Read `VITE_API_URL` from the frontend environment (e.g. `frontend/.env` / Railway frontend vars). Confirm it responds:

Run: `curl -s <API>/api/accounts | head -c 400`
Expected: JSON array of the current managed accounts (Iker, Unai).

- [ ] **Step 2: Create Asier's creator row**

Run:

```bash
curl -s -X POST <API>/api/creators \
  -H "Content-Type: application/json" \
  -d '{"linkedin_url":"https://www.linkedin.com/in/asier-olaizola/"}'
```

Expected: `201` with a JSON creator object. **Record its `id`** (call it `<ASIER_ID>`). If it returns `409 Creator already exists`, take the `creator.id` from the response body instead.

- [ ] **Step 3: Mark managed + attach his Unipile account**

Run:

```bash
curl -s -X PATCH <API>/api/accounts/<ASIER_ID> \
  -H "Content-Type: application/json" \
  -d '{"is_managed":true,"unipile_account_id":"tFnNGMBNQfG29z5yIF207g"}'
```

Expected: `200` with the updated creator showing `is_managed: true` and the `unipile_account_id` set.

- [ ] **Step 4: Refresh under his own account (pulls posts + impressions)**

Run:

```bash
curl -s -X POST <API>/api/creators/<ASIER_ID>/refresh
```

Expected: `200 {"message":"Refresh complete"}`. (This re-scrapes using Asier's own Unipile account, so impressions/snapshots/followers flow.)

- [ ] **Step 5: Verify he is tracked**

Run: `curl -s <API>/api/accounts | grep -i asier`
Expected: Asier present with `is_managed: true` and his `unipile_account_id`.

Then in the app UI, confirm:
- **Accounts** tab lists Asier with stats; after the refresh his posts show impressions.
- **Comments** tab: selecting Asier lists his pending comments; "Generar respuesta" returns a draft (generic voice); a media-only/GIF comment returns a support emoji.
- **Post Creator**: a third **"Ver como: Asier"** persona button appears and the preview shows his name + photo; a generated post reads in the Neety voice.
- **Google Chat** preview for one of Asier's posts shows header `🐝 NUEVO POST ASIER:`.

- [ ] **Step 6: (No commit — operational task.)** Record the resulting `<ASIER_ID>` in the PR/notes for reference.

---

## Verification Checklist (whole feature)

- `cd backend && npx tsc --noEmit` → clean.
- `cd frontend && npx tsc --noEmit` → clean; `cd frontend && npm run lint` → no new errors.
- After deploy, migration v29 has run: `commenter_profile` has exactly one relevant row named `Neety` (no `Iker`/`Unai`).
- Asier appears as a managed account with stats + impressions; his comments inbox works; replies generate in the generic voice.
- Post Creator writes in the Neety voice regardless of any name mentioned; the "Ver como: Asier" persona renders his card.
- Network comments still generate (generic voice); the "Voz Neety" editor loads and saves.
- Google Chat header reads `NUEVO POST <FIRST_NAME>` for all three accounts.

## Notes / Risks

- **Onboarding needs the live backend + Unipile connection for Asier.** His Unipile `account_id` is provided; the endpoints are unauthenticated (same ones the frontend calls). If the initial `POST /api/creators` scrape (default account) misses impressions, Step 4's refresh under Asier's own account fixes it.
- **Order:** Tasks 1–5 (backend) should deploy together (the migration + the code that depends on `Neety`). Frontend Tasks 6–8 can deploy with them or right after. Task 9 runs against the deployed backend.
- **No test framework** — verification is typecheck + lint + manual/API checks, by design.
