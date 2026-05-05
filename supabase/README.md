# Supabase

This folder holds the database-first artifacts for the Overlap cloud
backend. Nothing here ships in the mobile bundle.

**Step-by-step (Dashboard-first):** see [BackendImplementationGuide.md](BackendImplementationGuide.md) for creating the project, running migrations in the SQL Editor, seeding dev data, auth setup, RLS debugging, and staged app integration.

## Layout

```
supabase/
  migrations/
    0001_initial_schema.sql       -- tables, constraints, indexes, updated_at triggers
    0002_rls_policies.sql         -- row-level security + helper functions
    0003_bootstrap_triggers.sql   -- handle_new_user, handle_new_group
```

## Schema at a glance

- `profiles` — 1:1 with `auth.users`. Display name, avatar, accent.
- `groups` — owned by a profile, styled with the same color tokens the
  mock calendar uses today.
- `group_members` — many-to-many with a `role` enum (`owner | admin |
  member`). Drives every RLS decision for group-scoped tables.
- `events` — exactly one owner via the `events_owner_xor` constraint
  (personal OR group). Times are stored as `date + time` pairs so the
  current local shape (`YYYY-MM-DD`, `HH:mm`) translates cleanly.
- `group_messages` — append-only chat log per group.

## Ownership & access rules

See `migrations/0002_rls_policies.sql`. In summary:

| Table            | Read                             | Write                                     |
| ---------------- | -------------------------------- | ----------------------------------------- |
| profiles         | Any authenticated user           | Only the row owner (`id = auth.uid()`)    |
| groups           | Group members                    | Owner/admin only (update); creator only (insert/delete) |
| group_members    | Group members                    | Admins; users may delete themselves       |
| events (personal)| Owner                            | Owner                                     |
| events (group)   | Group members                    | Group admins                              |
| group_messages   | Group members                    | Group members (insert); self or admin (delete) |

## Environment variables (mobile client)

The Expo app reads the following from `app/.env` (see `app/.env.example`):

| Variable                              | Purpose                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`            | Project URL. Must match the Supabase project that ran these migrations. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`       | Project anon key (safe to ship with the bundle).                        |
| `EXPO_PUBLIC_USE_LOCAL_REPOSITORIES`  | Master switch. `true` (default) ignores Supabase entirely.              |
| `EXPO_PUBLIC_ENV`                     | `development` / `staging` / `production` — drives logging / flags.      |

> **Silent fallback warning.** `app/config/env.ts` will refuse to use the
> Supabase repositories when either `EXPO_PUBLIC_SUPABASE_URL` or
> `EXPO_PUBLIC_SUPABASE_ANON_KEY` is missing — even if
> `EXPO_PUBLIC_USE_LOCAL_REPOSITORIES=false`. A `console.warn` is logged
> in that case so you can spot the misconfiguration in dev. Once you set
> both values, restart the Expo dev server (env vars are inlined at
> build time).

## Applying

### With the Supabase CLI

```bash
supabase db reset       # local dev only — wipes the DB
supabase db push        # applies migrations to the linked project
```

### Without the CLI

```bash
psql "$DATABASE_URL" -f supabase/migrations/0001_initial_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/0002_rls_policies.sql
psql "$DATABASE_URL" -f supabase/migrations/0003_bootstrap_triggers.sql
```

## Seeding dev data

`supabase/seed.sql` mirrors the mock JSON in `app/data/`
(`mock-calendar-events.json`, `mock-group-chat.json`,
`mock-profiles.json`) so local Supabase dev starts with the same
fixtures the mock repositories already use.

Demo accounts:

| Email                  | Password         |
| ---------------------- | ---------------- |
| `me@overlap.local`     | `OverlapDev123!` |
| `alex@overlap.local`   | `OverlapDev123!` |
| `jordan@overlap.local` | `OverlapDev123!` |
| `avery@overlap.local`  | `OverlapDev123!` |

`supabase db reset` runs every migration and then `seed.sql`
automatically. The seed file is **for local development only** — it
inserts known-password users via `auth.users`, which never belongs in
production.
