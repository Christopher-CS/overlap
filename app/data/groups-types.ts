export type GroupRecord = {
  id: string;
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
  removeGroup: (groupId: string) => Promise<void>;
};
