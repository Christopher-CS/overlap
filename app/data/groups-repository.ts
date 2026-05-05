import mockCalendarDataJson from "./mock-calendar-events.json";
import type { CreateGroupInput, GroupRecord, GroupsRepository } from "./groups-types";
import { toGroupId, type GroupId } from "./ids";

type MockActor = {
  id: string;
  name: string;
  entityType: "user" | "group";
  color: string;
  chipColor: string;
  eventColor: string;
};

type MockCalendarData = {
  actors: MockActor[];
};

const mockCalendarData = mockCalendarDataJson as MockCalendarData;

const seedGroups: GroupRecord[] = mockCalendarData.actors
  .filter((actor) => actor.entityType === "group")
  .map((actor) => ({
    id: toGroupId(actor.id),
    name: actor.name,
    color: actor.color,
    chipColor: actor.chipColor,
    eventColor: actor.eventColor,
  }));

const overlayGroups: GroupRecord[] = [];
const removedGroupIds = new Set<GroupId>();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

const buildGroupId = (name: string): GroupId => {
  const slug = slugify(name) || "group";
  return toGroupId(`group-${slug}-${Date.now().toString(36)}`);
};

const createLocalGroupsRepository = (): GroupsRepository => ({
  async listGroups() {
    const allGroups = [...seedGroups, ...overlayGroups];
    return allGroups.filter((group) => !removedGroupIds.has(group.id));
  },
  async addGroup(input: CreateGroupInput) {
    const newGroup: GroupRecord = {
      id: buildGroupId(input.name),
      name: input.name.trim(),
      color: "#2D6BFF",
      chipColor: "#EAF1FF",
      eventColor: "#DCE8FF",
    };

    overlayGroups.push(newGroup);
    removedGroupIds.delete(newGroup.id);
    return newGroup;
  },
  async removeGroup(groupId: GroupId) {
    removedGroupIds.add(groupId);
  },
});

export const groupsRepository = createLocalGroupsRepository();
