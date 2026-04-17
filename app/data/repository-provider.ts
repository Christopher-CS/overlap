import { appEnv } from "../config/env";

import { localAuthRepository } from "./auth-repository";
import type { AuthRepository } from "./auth-types";
import { chatRepository as localChatRepository } from "./chat-repository";
import type { ChatRepository } from "./chat-types";
import { eventsRepository as localEventsRepository } from "./events-repository";
import type { EventsRepository } from "./events-types";
import { groupsRepository as localGroupsRepository } from "./groups-repository";
import type { GroupsRepository } from "./groups-types";
import { localProfileRepository } from "./profile-repository";
import type { ProfileRepository } from "./profile-types";

/**
 * Every concrete backend (local mock, Supabase, …) must fulfill this
 * bundle so screens only ever depend on {@link getRepositories}.
 */
export type RepositoryBundle = {
  auth: AuthRepository;
  profiles: ProfileRepository;
  groups: GroupsRepository;
  events: EventsRepository;
  chat: ChatRepository;
};

const buildLocalRepositories = (): RepositoryBundle => ({
  auth: localAuthRepository,
  profiles: localProfileRepository,
  groups: localGroupsRepository,
  events: localEventsRepository,
  chat: localChatRepository,
});

/**
 * Placeholder for when we wire up Supabase. We deliberately throw at
 * resolution time so a misconfigured build fails loudly instead of
 * silently using mock data in production.
 */
const buildSupabaseRepositories = (): RepositoryBundle => {
  throw new Error(
    "Supabase repositories are not implemented yet. Set EXPO_PUBLIC_USE_LOCAL_REPOSITORIES=true until the migration lands.",
  );
};

let cachedRepositories: RepositoryBundle | null = null;

/**
 * Returns the active repository bundle for the current runtime.
 * Memoized so every hook/screen sees the same instances and so local
 * overlay state (mock group/event writes) is shared everywhere.
 */
export const getRepositories = (): RepositoryBundle => {
  if (cachedRepositories) {
    return cachedRepositories;
  }
  cachedRepositories = appEnv.useLocalRepositories
    ? buildLocalRepositories()
    : buildSupabaseRepositories();
  return cachedRepositories;
};

/**
 * Test-only hook to swap in a custom repository bundle (e.g. fakes in
 * unit tests). Do not call from production code paths.
 */
export const __setRepositoriesForTesting = (overrides: Partial<RepositoryBundle>) => {
  cachedRepositories = {
    ...buildLocalRepositories(),
    ...overrides,
  };
};
