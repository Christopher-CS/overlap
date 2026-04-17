import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "./auth-context";
import { getRepositories } from "./repository-provider";
import type { ProfileRecord } from "./profile-types";

type ProfileContextValue = {
  profile: ProfileRecord | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const profiles = getRepositories().profiles;
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadProfile = async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const loadedProfile = await profiles.getProfile(user.id);
      setProfile(loadedProfile);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [isAuthenticated, user?.id]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      isLoading,
      refresh: loadProfile,
    }),
    [profile, isLoading],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useCurrentProfile = (): ProfileContextValue => {
  const value = useContext(ProfileContext);
  if (!value) {
    throw new Error("useCurrentProfile must be used inside a <ProfileProvider>.");
  }
  return value;
};

/**
 * Returns the two-letter initials for the given display name.
 * Exposed so the top bar / avatars can render consistent placeholders
 * until real avatar images are wired in.
 */
export const getDisplayInitials = (displayName: string | null | undefined): string => {
  if (!displayName) {
    return "";
  }
  const parts = displayName.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
};
