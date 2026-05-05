import { localActorsRepository } from "../actors-repository";
import { localAuthRepository } from "../auth-repository";
import { chatRepository as localChatRepository } from "../chat-repository";
import { eventsRepository as localEventsRepository } from "../events-repository";
import { groupsRepository as localGroupsRepository } from "../groups-repository";
import { localProfileRepository } from "../profile-repository";
import type { RepositoryBundle } from "../repository-provider";
import { runRepositoryContract } from "./repositories.contract";

const buildLocalBundle = (): RepositoryBundle => ({
  auth: localAuthRepository,
  profiles: localProfileRepository,
  actors: localActorsRepository,
  groups: localGroupsRepository,
  events: localEventsRepository,
  chat: localChatRepository,
});

runRepositoryContract("local mock bundle", buildLocalBundle);
