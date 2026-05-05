import type { GroupId } from "./ids";

export type GroupRecord = {
  id: GroupId;
  name: string;
  color: string;
  chipColor: string;
  eventColor: string;
};

export type CreateGroupInput = {
  name: string;
};

export type GroupsRepository = {
  listGroups: () => Promise<GroupRecord[]>;
  addGroup: (input: CreateGroupInput) => Promise<GroupRecord>;
  removeGroup: (groupId: GroupId) => Promise<void>;
};
