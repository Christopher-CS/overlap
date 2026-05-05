import type { ActorId } from "./ids";

/**
 * Display-oriented record for any "owner" of a calendar event. In the
 * cloud schema this maps to either a `profiles` row (entityType =
 * `"user"`) or a `groups` row (entityType = `"group"`). The two are
 * unioned at the repository boundary so calendar UI does not have to
 * branch on which table the row came from.
 */
export type ActorRecord = {
  id: ActorId;
  name: string;
  entityType: "user" | "group";
  color: string;
  chipColor: string;
  eventColor: string;
};

export type ActorsRepository = {
  listActors: () => Promise<ActorRecord[]>;
};
