# Overlap — Supabase backend implementation guide

This document is a **step-by-step plan** for standing up the real Supabase backend for the Overlap mobile app. It assumes the implementer will use the **Supabase Dashboard (web UI)** as much as possible: SQL Editor, Table Editor, Authentication, and Project Settings.

For staged app cutover (auth → profiles → groups → events → chat), see also:

- [`app/.codex/CloudCutoverPlan.md`](../app/.codex/CloudCutoverPlan.md) — repository flags and exit criteria per stage.
- [`supabase/README.md`](README.md) — schema summary, env vars, applying migrations.

The SQL in this repo is the **source of truth** for tables, RLS, and triggers. The Dashboard is how you **apply and verify** that SQL without requiring the CLI.

---

## Table of contents

1. [Create and configure the project](#1-create-and-configure-the-project)
2. [Apply schema, RLS, and triggers](#2-apply-schema-rls-and-triggers)
3. [Seed development data](#3-seed-development-data)
4. [Configure authentication](#4-configure-authentication)
5. [Verify RLS and debug issues](#5-verify-rls-and-debug-issues)
6. [Implement the app repositories (staged)](#6-implement-the-app-repositories-staged)
7. [Security checklist](#7-security-checklist)
8. [Environments (dev / staging / prod)](#8-environments-dev--staging--prod)
9. [Definition of done](#9-definition-of-done)
10. [When to leave the Dashboard](#10-when-to-leave-the-dashboard)

---

## 1. Create and configure the project

### 1.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → choose organization, name, database password, and **region** (pick one close to your users).
3. Store the database password in a password manager; you will need it for direct Postgres access later (optional).

### 1.2 Get API credentials for the Expo app

1. Open **Project Settings** (gear icon) → **API**.
2. Copy:
   - **Project URL**
   - **anon public** key (safe to embed in a mobile client)
3. In the Overlap repo, copy `app/.env.example` to `app/.env` (if needed) and set:

   | Variable | Value |
   |----------|--------|
   | `EXPO_PUBLIC_SUPABASE_URL` | Project URL from Dashboard |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `EXPO_PUBLIC_USE_LOCAL_REPOSITORIES` | `false` only when you are ready to hit the cloud (see `app/config/env.ts`) |

**Important:** Never put the **service_role** key in the Expo app or any file that ships in the bundle. Service role is for server-side or Edge Functions only.

### 1.3 Enable required extensions

1. Open **Database** → **Extensions**.
2. Ensure **pgcrypto** is available. Migrations use `gen_random_uuid()`; if SQL errors mention missing functions, enable **pgcrypto** here first, then re-run the migration SQL.

---

## 2. Apply schema, RLS, and triggers

Your migrations live in:

| Order | File | Purpose |
|-------|------|---------|
| 1 | [`migrations/0001_initial_schema.sql`](migrations/0001_initial_schema.sql) | Tables, constraints, indexes, `updated_at` triggers |
| 2 | [`migrations/0002_rls_policies.sql`](migrations/0002_rls_policies.sql) | Row Level Security policies and helpers |
| 3 | [`migrations/0003_bootstrap_triggers.sql`](migrations/0003_bootstrap_triggers.sql) | `handle_new_user`, `handle_new_group` |

### 2.1 Run migrations in the SQL Editor

1. Open **SQL Editor** in the Dashboard.
2. **New query** → paste the **entire** contents of `0001_initial_schema.sql` → **Run**.
3. Repeat for `0002_rls_policies.sql`, then `0003_bootstrap_triggers.sql`.

Run them **in order**. If a statement fails, read the error, fix the cause (often extension or duplicate object), then re-run from a clean state if needed.

### 2.2 Verify in the UI

1. **Database** → **Tables**: you should see at least:
   - `profiles`
   - `groups`
   - `group_members`
   - `events`
   - `group_messages`
2. Open **Table Editor** → pick `profiles` and confirm columns match the migration (`id`, `display_name`, `avatar_url`, `accent_color`, `created_at`, `updated_at`).

### 2.3 Table Editor vs SQL Editor

| Use case | Tool |
|----------|------|
| Create/alter schema, RLS, functions, triggers | **SQL Editor** (use the files in `migrations/`) |
| Inspect or manually edit a few rows | **Table Editor** |
| Bulk fixture data | **SQL Editor** (`seed.sql`) |

---

## 3. Seed development data

For local development parity with the app’s mock JSON fixtures, the repo includes [`seed.sql`](seed.sql).

### 3.1 Run the seed (dev only)

1. Open **SQL Editor**.
2. Paste the contents of `seed.sql` and **Run**.

This script is intended for **local / dev** projects. It creates demo users with a **known password** documented in [`README.md`](README.md). Do **not** run this against production.

### 3.2 Verify

1. **Authentication** → **Users**: demo accounts should appear.
2. **Table Editor**: spot-check `profiles`, `groups`, `group_members`, `events`, and `group_messages`.

If the seed fails (for example `crypt`, `auth.users` columns, or trigger conflicts), fix the script in the repo and re-apply on a fresh dev database. The Dashboard error message usually points to the exact line.

---

## 4. Configure authentication

### 4.1 Email provider

1. **Authentication** → **Providers** → **Email**.
2. Enable **Email** provider.
3. For fastest **development**, you may disable “Confirm email”; tighten this for production.

### 4.2 URLs and mobile

1. **Authentication** → **URL configuration**: set **Site URL** as appropriate for your app (placeholder is fine until you add magic links or OAuth).
2. When you add deep links or OAuth, follow [Expo’s linking docs](https://docs.expo.dev/guides/authentication/) and add redirect URLs Supabase expects.

### 4.3 Smoke test

After the mobile app implements Supabase auth (see Stage 1 below), sign up from the device and confirm a new user appears under **Authentication** → **Users** and a matching row exists in `profiles` (via `handle_new_user`).

---

## 5. Verify RLS and debug issues

Row Level Security is defined in `0002_rls_policies.sql`. The client only uses the **anon** key; every table the app writes to must allow the operation for the **authenticated** role under a policy.

### 5.1 When something fails

1. **Logs** → **Postgres** or **API**: look for permission errors (often Postgres `42501` or PostgREST-related codes).
2. In the app, failures may already surface via `app/data/logger.ts` and `app/data/toast.ts` once repositories use Supabase.

### 5.2 Policy inspection (SQL Editor)

Example (run as a superuser in SQL Editor to list policies):

```sql
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Note: `auth.uid()` in the SQL Editor **does not** represent a logged-in app user. End-to-end RLS tests happen **from the app** with a real session, or via tooling that impersonates a JWT if you add it later.

### 5.3 Advisors

Use **Database** → **Advisors** (if available) to catch common security or performance issues (indexes, RLS gaps, etc.).

---

## 6. Implement the app repositories (staged)

The Expo app resolves data through [`app/data/repository-provider.ts`](../app/data/repository-provider.ts). Today, `buildSupabaseRepositories()` is a placeholder; you will implement real repositories and flip flags per [`CloudCutoverPlan.md`](../app/.codex/CloudCutoverPlan.md).

Recommended order:

| Stage | Domain | Implementation notes | Dashboard verification |
|-------|--------|----------------------|-------------------------|
| **1** | Auth | `AuthRepository` backed by `supabase.auth`, `onAuthStateChange` → app `AuthSession` | **Users** list, auth logs |
| **2** | Profiles | CRUD / read `profiles` for current user | **Table Editor** on `profiles`; new signup creates row via trigger |
| **3** | Groups | `groups` + `group_members`; `listGroups()` only for memberships | Rows in both tables; two test accounts |
| **4** | Events | `events` with **either** `owner_user_id` **or** `owner_group_id` (XOR) | Table Editor; test personal vs group events |
| **5** | Chat | `group_messages`; optional Realtime channel | Table Editor; **Realtime** settings if used |

### 6.1 Actors repository

The local app uses an `actors` list for calendar chips. For Supabase, pick one approach:

- **Recommended (no extra table):** Build the actor list in the client from **current user profile** + **groups the user belongs to**, matching the shape expected by the calendar UI.
- **Later:** Add a database view or RPC if you need server-side composition.

### 6.2 Feature flags

Keep `EXPO_PUBLIC_USE_LOCAL_REPOSITORIES` as the master kill switch. Add per-domain flags in `app/config/env.ts` (e.g. `useSupabaseAuth`, `useSupabaseProfiles`) so you can ship **one** repository at a time without breaking the rest of the app.

---

## 7. Security checklist

- [ ] **anon** key only in the Expo app; **service_role** never in the client.
- [ ] RLS **enabled** on all client-facing tables (already in `0002`).
- [ ] Bootstrap triggers applied (`0003`): new auth user → `profiles`; new group → owner in `group_members`.
- [ ] Production: email confirmation, rate limits, and password policy reviewed under **Authentication** settings.
- [ ] If you add **Storage** for avatars: create a bucket and policies under **Storage**; align `avatar_url` with public vs signed URL strategy.

---

## 8. Environments (dev / staging / prod)

Use **separate Supabase projects** per environment. Each has its own URL and anon key.

- **Local dev:** `.env` in `app/` (gitignored).
- **EAS / CI:** use EAS secrets or your CI’s secret store for `EXPO_PUBLIC_*` variables.

Re-apply migrations (and optional `seed.sql`) when creating a **new** dev project.

---

## 9. Definition of done

You can consider the backend “properly” integrated when:

1. **Sign up / sign in / sign out** works from the app with real Supabase Auth.
2. **New user** gets a **`profiles`** row automatically (trigger), and the UI shows display name and accent color from the database.
3. **Create group** inserts **`groups`** and **`group_members`** (owner via trigger); a second member can be added per RLS; both users see the group only when allowed.
4. **Events** respect personal vs group ownership; members see group events; non-members do not.
5. **Chat** messages insert with `sender_id` matching the authenticated user; RLS allows read/write as designed; optional Realtime updates other clients.
6. **Errors** (especially RLS denials) are visible in dev logs and surfaced in the UI without crashing.

---

## 10. When to leave the Dashboard

You can complete **MVP** using only:

- SQL Editor, Table Editor, Authentication, Project Settings, Logs, and Advisors.

Consider the **Supabase CLI** or **GitHub integration** when you need:

- Repeatable migration runs in CI,
- Branched databases per PR,
- Or automated deploy pipelines.

Until then, treating `supabase/migrations/*.sql` and `seed.sql` as copy-paste sources into the SQL Editor is a valid, readable workflow for a small team.

---

## Related files in this repo

| Path | Role |
|------|------|
| `supabase/migrations/0001_initial_schema.sql` | Tables and constraints |
| `supabase/migrations/0002_rls_policies.sql` | RLS policies |
| `supabase/migrations/0003_bootstrap_triggers.sql` | Auth/group bootstrap |
| `supabase/seed.sql` | Dev fixtures |
| `app/config/env.ts` | `EXPO_PUBLIC_*` and repository mode |
| `app/data/supabase-client.ts` | Supabase JS client construction |
| `app/data/repository-provider.ts` | Local vs cloud repository bundle |
| `app/.codex/CloudCutoverPlan.md` | Staged app rollout |
