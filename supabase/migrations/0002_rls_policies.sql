-- =====================================================================
-- Overlap — row level security
-- =====================================================================
-- Run AFTER 0001_initial_schema.sql. Every table the client writes to
-- must have RLS enabled and at least one policy; otherwise PostgREST
-- will reject the request.
-- =====================================================================

alter table public.profiles       enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.events         enable row level security;
alter table public.group_messages enable row level security;

-- ---------------------------------------------------------------------
-- helper: is user a member of the given group?
-- ---------------------------------------------------------------------
create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'admin')
  );
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
-- Anyone signed in can read the directory (display name / avatar).
-- Only the row owner can update / insert their own record.
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

create policy profiles_insert_self
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_self
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------
-- Members (including the owner) can read the group. Only authenticated
-- users can create groups; only the owner/admins can update or delete.
create policy groups_select_members
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

create policy groups_insert_self_owner
  on public.groups for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy groups_update_admins
  on public.groups for update
  to authenticated
  using (public.is_group_admin(id))
  with check (public.is_group_admin(id));

create policy groups_delete_owner
  on public.groups for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------
-- Members can see the roster of their own groups. Admins manage it.
-- A user can always remove themselves (leave the group).
create policy group_members_select_members
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

create policy group_members_insert_admins
  on public.group_members for insert
  to authenticated
  with check (public.is_group_admin(group_id));

create policy group_members_update_admins
  on public.group_members for update
  to authenticated
  using (public.is_group_admin(group_id))
  with check (public.is_group_admin(group_id));

create policy group_members_delete_admins_or_self
  on public.group_members for delete
  to authenticated
  using (public.is_group_admin(group_id) or user_id = auth.uid());

-- ---------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------
-- Personal events: only the owner can read/write.
-- Group events: any member can read; only admins (or the creator) can
-- write. We deliberately keep write rules strict — the cutover plan
-- calls out relaxing this to "any member can create" if the product
-- requires it later.
create policy events_select_personal_or_group
  on public.events for select
  to authenticated
  using (
    (owner_user_id is not null and owner_user_id = auth.uid())
    or (owner_group_id is not null and public.is_group_member(owner_group_id))
  );

create policy events_insert_personal_or_group_admin
  on public.events for insert
  to authenticated
  with check (
    (owner_user_id = auth.uid() and owner_group_id is null)
    or (owner_group_id is not null and public.is_group_admin(owner_group_id))
  );

create policy events_update_personal_or_group_admin
  on public.events for update
  to authenticated
  using (
    (owner_user_id is not null and owner_user_id = auth.uid())
    or (owner_group_id is not null and public.is_group_admin(owner_group_id))
  )
  with check (
    (owner_user_id is not null and owner_user_id = auth.uid())
    or (owner_group_id is not null and public.is_group_admin(owner_group_id))
  );

create policy events_delete_personal_or_group_admin
  on public.events for delete
  to authenticated
  using (
    (owner_user_id is not null and owner_user_id = auth.uid())
    or (owner_group_id is not null and public.is_group_admin(owner_group_id))
  );

-- ---------------------------------------------------------------------
-- group_messages
-- ---------------------------------------------------------------------
-- Members can read history and post new messages. Senders can delete
-- their own messages; admins can delete any message in their groups.
create policy group_messages_select_members
  on public.group_messages for select
  to authenticated
  using (public.is_group_member(group_id));

create policy group_messages_insert_members
  on public.group_messages for insert
  to authenticated
  with check (
    public.is_group_member(group_id) and sender_id = auth.uid()
  );

create policy group_messages_delete_self_or_admin
  on public.group_messages for delete
  to authenticated
  using (sender_id = auth.uid() or public.is_group_admin(group_id));
