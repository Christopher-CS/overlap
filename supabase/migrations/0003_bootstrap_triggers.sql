-- =====================================================================
-- Overlap — bootstrap triggers
-- =====================================================================
-- Two automations the RLS policies in 0002 implicitly rely on:
--
--   1. handle_new_user — creates the matching `public.profiles` row
--      whenever Supabase Auth inserts a new `auth.users` row. Without
--      this, every screen that reads a profile (top bar, settings,
--      chat headers) would break for new sign-ups until the client
--      also called `upsertProfile` manually.
--
--   2. handle_new_group — inserts the creator into `public.group_members`
--      with the `owner` role whenever a new `public.groups` row is
--      created. Without this, the very first member of a brand-new
--      group cannot be inserted by the client because the
--      `group_members_insert_admins` policy requires existing
--      membership (chicken-and-egg).
--
-- Both functions use SECURITY DEFINER so they bypass RLS at trigger
-- time. They explicitly pin `search_path` so an attacker cannot shadow
-- our schema-qualified objects with their own.
-- =====================================================================

-- ---------------------------------------------------------------------
-- handle_new_user
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_display_name text;
begin
  -- Prefer a display name supplied via auth.users.raw_user_meta_data
  -- (`display_name` key); fall back to the local-part of the email,
  -- and finally to the literal "Member" so the row never violates the
  -- char_length check on profiles.display_name.
  fallback_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Member'
  );

  insert into public.profiles (id, display_name)
  values (new.id, fallback_display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- handle_new_group
-- ---------------------------------------------------------------------
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();
