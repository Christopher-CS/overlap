-- =====================================================================
-- Overlap — local development seed data
-- =====================================================================
-- Mirrors `app/data/mock-calendar-events.json`, `app/data/mock-group-chat.json`,
-- and `app/data/mock-profiles.json` so that local Supabase dev starts
-- with the same fixtures the mock repositories already use.
--
-- This file is intended to be run by `supabase db reset` (the Supabase
-- CLI runs every file in supabase/migrations/* and then seed.sql) or
-- manually against a *local* Supabase project. It is NOT for production
-- — it inserts demo users with a known shared password.
--
-- Layout:
--   1. Insert demo users into auth.users (the handle_new_user trigger
--      then creates the matching public.profiles rows).
--   2. Update the auto-created profile rows to match the mock data
--      (accent color, display name override).
--   3. Insert groups (the handle_new_group trigger inserts the creator
--      into group_members as owner).
--   4. Add additional members so other demo users belong to the groups.
--   5. Insert events (personal + group).
--   6. Insert group chat history.
-- =====================================================================

-- All seed users share this hashed password ("OverlapDev123!").
-- Generated via crypt('OverlapDev123!', gen_salt('bf')).
-- Do NOT reuse this hash anywhere outside local development.
do $$
declare
  -- Stable demo UUIDs. Keep them in the 0000…axx / bxx ranges so they
  -- never collide with real, randomly-generated rows.
  user_me_id      uuid := '00000000-0000-0000-0000-000000000a00';
  user_alex_id    uuid := '00000000-0000-0000-0000-000000000a01';
  user_jordan_id  uuid := '00000000-0000-0000-0000-000000000a02';
  user_avery_id   uuid := '00000000-0000-0000-0000-000000000a03';

  group1_id       uuid := '00000000-0000-0000-0000-000000000b01';
  group2_id       uuid := '00000000-0000-0000-0000-000000000b02';
  group3_id       uuid := '00000000-0000-0000-0000-000000000b03';

  hashed_password text := crypt('OverlapDev123!', gen_salt('bf'));
begin

  -- 1. ----------------------------------------------------------------
  -- Insert auth.users rows. The handle_new_user trigger fills in the
  -- corresponding profiles row. We pass display_name via raw_user_meta_data
  -- so the profile starts with a sensible name.
  -- ------------------------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values
    ('00000000-0000-0000-0000-000000000000', user_me_id,     'authenticated', 'authenticated',
     'me@overlap.local',     hashed_password, now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"display_name":"You"}'::jsonb,             now(), now()),
    ('00000000-0000-0000-0000-000000000000', user_alex_id,   'authenticated', 'authenticated',
     'alex@overlap.local',   hashed_password, now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"display_name":"Alex"}'::jsonb,            now(), now()),
    ('00000000-0000-0000-0000-000000000000', user_jordan_id, 'authenticated', 'authenticated',
     'jordan@overlap.local', hashed_password, now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"display_name":"Jordan Lee"}'::jsonb,      now(), now()),
    ('00000000-0000-0000-0000-000000000000', user_avery_id,  'authenticated', 'authenticated',
     'avery@overlap.local',  hashed_password, now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"display_name":"Avery Park"}'::jsonb,      now(), now())
  on conflict (id) do nothing;

  -- 2. ----------------------------------------------------------------
  -- Override accent colors / display names that the trigger filled in
  -- with defaults. Using update keeps the rows the trigger created
  -- intact (auth.users -> profiles FK).
  -- ------------------------------------------------------------------
  update public.profiles set display_name = 'You',         accent_color = '#2D6BFF' where id = user_me_id;
  update public.profiles set display_name = 'Alex',        accent_color = '#2D6BFF' where id = user_alex_id;
  update public.profiles set display_name = 'Jordan Lee',  accent_color = '#19A36B' where id = user_jordan_id;
  update public.profiles set display_name = 'Avery Park',  accent_color = '#DE7E19' where id = user_avery_id;

  -- 3. ----------------------------------------------------------------
  -- Groups. handle_new_group inserts the owner as a group_members row
  -- automatically, so we don't need to do that explicitly here.
  -- ------------------------------------------------------------------
  insert into public.groups (id, owner_id, name, color, chip_color, event_color)
  values
    (group1_id, user_alex_id,   'Product Launch Crew', '#A34DFF', '#F3E8FF', '#EEDBFF'),
    (group2_id, user_alex_id,   'Frontend Devs',       '#2B8EFF', '#E6F1FF', '#DCEBFF'),
    (group3_id, user_jordan_id, 'Design Critique',     '#DE7E19', '#FFF1E5', '#FFE9D5')
  on conflict (id) do nothing;

  -- 4. ----------------------------------------------------------------
  -- Add additional memberships so the demo users overlap.
  -- ------------------------------------------------------------------
  insert into public.group_members (group_id, user_id, role)
  values
    (group1_id, user_jordan_id, 'member'),
    (group1_id, user_me_id,     'member'),
    (group2_id, user_jordan_id, 'admin'),
    (group2_id, user_me_id,     'member'),
    (group3_id, user_alex_id,   'member'),
    (group3_id, user_me_id,     'member')
  on conflict (group_id, user_id) do nothing;

  -- 5. ----------------------------------------------------------------
  -- Events. Personal events use owner_user_id; group events use
  -- owner_group_id. The events_owner_xor check enforces exactly one.
  -- ------------------------------------------------------------------
  insert into public.events (owner_user_id, owner_group_id, title, subtitle, event_date, start_time, end_time)
  values
    -- personal events
    (user_alex_id,   null, 'Chemistry 101',    'Alex',                 '2026-04-17', '09:00', '11:00'),
    (user_jordan_id, null, 'Study Hall',       'Jordan',               '2026-04-18', '11:00', '12:30'),
    (user_alex_id,   null, 'Math Tutoring',    'Alex',                 '2026-04-18', '10:30', '11:30'),
    (user_alex_id,   null, 'Office Hours',     'Alex',                 '2026-04-19', '15:00', '16:00'),
    (user_jordan_id, null, 'Research Sync',    'Jordan',               '2026-04-19', '14:00', '15:15'),
    (user_alex_id,   null, 'Database Lab',     'Alex',                 '2026-04-20', '16:00', '17:00'),
    (user_jordan_id, null, 'Library Sprint',   'Jordan',               '2026-04-21', '10:00', '11:00'),
    -- group events
    (null, group1_id, 'Group Meeting',         'Product Launch Crew',  '2026-04-18', '09:00', '11:00'),
    (null, group1_id, 'Design Review',         'Product Launch Crew',  '2026-04-19', '13:30', '14:30'),
    (null, group3_id, 'Critique Sync',         'Design Critique',      '2026-04-19', '13:30', '14:15'),
    (null, group2_id, 'Frontend Standup',      'Frontend Devs',        '2026-04-20', '09:30', '10:00'),
    (null, group3_id, 'Prototype Review',      'Design Critique',      '2026-04-20', '13:00', '14:00'),
    (null, group2_id, 'API Planning',          'Frontend Devs',        '2026-04-21', '11:00', '12:00'),
    (null, group3_id, 'UI Handoff',            'Design Critique',      '2026-04-21', '11:30', '12:30'),
    (null, group1_id, 'Group Retro',           'Product Launch Crew',  '2026-04-24', '14:30', '15:30'),
    (null, group2_id, 'Sprint Demo',           'Frontend Devs',        '2026-04-24', '15:00', '16:00'),
    (null, group3_id, 'UX Polish Session',     'Design Critique',      '2026-04-26', '12:00', '13:00'),
    (null, group1_id, 'Stakeholder Brief',     'Product Launch Crew',  '2026-04-26', '13:00', '14:00'),
    (null, group2_id, 'Frontend Integration',  'Frontend Devs',        '2026-04-28', '10:00', '11:30'),
    (null, group3_id, 'Design QA Pass',        'Design Critique',      '2026-04-28', '10:30', '11:00'),
    (null, group1_id, 'Final Review',          'Product Launch Crew',  '2026-04-30', '16:00', '17:00')
  on conflict do nothing;

  -- 6. ----------------------------------------------------------------
  -- Group chat history.
  -- ------------------------------------------------------------------
  insert into public.group_messages (group_id, sender_id, text, created_at)
  values
    (group1_id, user_alex_id,   'I uploaded the launch deck draft. Please review before tonight.', '2026-04-24 14:05:00+00'),
    (group1_id, user_jordan_id, 'Looks good. I will tighten the timeline slide.',                  '2026-04-24 14:12:00+00'),
    (group2_id, user_alex_id,   'Frontend integration starts at 10. Blockers?',                    '2026-04-28 09:40:00+00'),
    (group2_id, user_jordan_id, 'No blockers here. API mock is ready.',                            '2026-04-28 09:48:00+00'),
    (group3_id, user_jordan_id, 'Can we lock the spacing system after UX polish?',                 '2026-04-26 12:15:00+00')
  on conflict do nothing;

end $$;
