-- =====================================================================
-- Overlap — initial schema
-- =====================================================================
-- Mirrors the local repository contracts found in app/data/*-types.ts.
-- Run via:  supabase db push       (uses the Supabase CLI workflow)
-- or:      psql ... -f 0001_initial_schema.sql
-- =====================================================================

-- Useful extension for UUID defaults. Supabase projects already ship
-- with pgcrypto enabled on the "extensions" schema.
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
-- Each row is owned by exactly one auth.users row. Users can read and
-- update their own row; everyone else can read the public display
-- fields via an RLS-controlled view if we need directory features.
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 80),
  avatar_url    text,
  accent_color  text not null default '#2D6BFF',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_display_name_idx
  on public.profiles (lower(display_name));

-- ---------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------
-- Each group has exactly one owner (the creator). Membership lives in
-- group_members so multiple users can belong to it without duplicating
-- denormalized arrays.
create table if not exists public.groups (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  color         text not null default '#2D6BFF',
  chip_color    text not null default '#EAF1FF',
  event_color   text not null default '#DCE8FF',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists groups_owner_idx on public.groups (owner_id);

-- ---------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------
create type public.group_member_role as enum ('owner', 'admin', 'member');

create table if not exists public.group_members (
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.group_member_role not null default 'member',
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on public.group_members (user_id);

-- ---------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------
-- An event belongs to exactly one actor (owner). The owner is either a
-- profile (personal event) or a group. We model that with two nullable
-- columns + a check constraint so joins and RLS stay straightforward.
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid references public.profiles (id) on delete cascade,
  owner_group_id uuid references public.groups (id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 200),
  subtitle       text,
  event_date     date not null,
  start_time     time not null,
  end_time       time not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint events_owner_xor check (
    (owner_user_id is not null and owner_group_id is null)
    or (owner_user_id is null and owner_group_id is not null)
  ),
  constraint events_time_order check (end_time > start_time)
);

create index if not exists events_user_date_idx
  on public.events (owner_user_id, event_date);

create index if not exists events_group_date_idx
  on public.events (owner_group_id, event_date);

-- ---------------------------------------------------------------------
-- group_messages
-- ---------------------------------------------------------------------
create table if not exists public.group_messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists group_messages_group_created_idx
  on public.group_messages (group_id, created_at);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();
