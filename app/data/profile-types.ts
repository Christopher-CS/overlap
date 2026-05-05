import type { UserId } from "./ids";

/**
 * Profile record. Mirrors what we expect the `profiles` table in
 * Supabase to expose via RLS-restricted selects. IDs line up with
 * {@link SessionUser.id} so we can join profiles against session state
 * without extra lookups.
 */
export type ProfileRecord = {
  id: UserId;
  displayName: string;
  avatarUrl: string | null;
  accentColor: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertProfileInput = {
  id: UserId;
  displayName: string;
  avatarUrl?: string | null;
  accentColor?: string;
};

export type ProfileRepository = {
  getProfile: (userId: UserId) => Promise<ProfileRecord | null>;
  listProfiles: (userIds: UserId[]) => Promise<ProfileRecord[]>;
  upsertProfile: (input: UpsertProfileInput) => Promise<ProfileRecord>;
};
