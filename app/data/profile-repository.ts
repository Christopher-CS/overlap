import { toUserId, type UserId } from "./ids";
import mockProfilesJson from "./mock-profiles.json";
import type { ProfileRecord, ProfileRepository, UpsertProfileInput } from "./profile-types";

type RawMockProfile = Omit<ProfileRecord, "id"> & { id: string };

type MockProfilesData = {
  profiles: RawMockProfile[];
};

const seedProfiles: ProfileRecord[] = (mockProfilesJson as MockProfilesData).profiles.map(
  (profile) => ({
    ...profile,
    id: toUserId(profile.id),
  }),
);

const overlayProfiles = new Map<UserId, ProfileRecord>();

const readProfile = (userId: UserId): ProfileRecord | null => {
  const overlay = overlayProfiles.get(userId);
  if (overlay) {
    return overlay;
  }
  return seedProfiles.find((profile) => profile.id === userId) ?? null;
};

const createLocalProfileRepository = (): ProfileRepository => ({
  async getProfile(userId: UserId) {
    return readProfile(userId);
  },
  async listProfiles(userIds: UserId[]) {
    const uniqueIds = Array.from(new Set(userIds));
    return uniqueIds
      .map((userId) => readProfile(userId))
      .filter((profile): profile is ProfileRecord => profile !== null);
  },
  async upsertProfile(input: UpsertProfileInput) {
    const existing = readProfile(input.id);
    const now = new Date().toISOString();
    const nextProfile: ProfileRecord = {
      id: input.id,
      displayName: input.displayName.trim() || existing?.displayName || "Unnamed",
      avatarUrl: input.avatarUrl ?? existing?.avatarUrl ?? null,
      accentColor: input.accentColor ?? existing?.accentColor ?? "#2D6BFF",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    overlayProfiles.set(input.id, nextProfile);
    return nextProfile;
  },
});

export const localProfileRepository: ProfileRepository = createLocalProfileRepository();
