import mockCalendarDataJson from "./mock-calendar-events.json";
import type { CreateEventInput, EventRecord, EventsRepository } from "./events-types";
import { toActorId, toEventId, type EventId } from "./ids";

type RawMockEvent = Omit<EventRecord, "id" | "ownerId"> & {
  id: string;
  ownerId: string;
};

type MockCalendarData = {
  eventTemplates: RawMockEvent[];
};

const mockCalendarData = mockCalendarDataJson as MockCalendarData;
const seedEvents: EventRecord[] = mockCalendarData.eventTemplates.map((eventTemplate) => ({
  ...eventTemplate,
  id: toEventId(eventTemplate.id),
  ownerId: toActorId(eventTemplate.ownerId),
}));
const overlayEvents: EventRecord[] = [];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

const buildEventId = (title: string): EventId => {
  const slug = slugify(title) || "event";
  return toEventId(`event-${slug}-${Date.now().toString(36)}`);
};

const createLocalEventsRepository = (): EventsRepository => ({
  async listEvents() {
    return [...seedEvents, ...overlayEvents].sort((firstEvent, secondEvent) => {
      const firstKey = `${firstEvent.date}T${firstEvent.startTime}`;
      const secondKey = `${secondEvent.date}T${secondEvent.startTime}`;
      return firstKey.localeCompare(secondKey);
    });
  },
  async createEvent(input: CreateEventInput) {
    const trimmedTitle = input.title.trim();
    const newEvent: EventRecord = {
      id: buildEventId(trimmedTitle),
      ownerId: input.ownerId,
      title: trimmedTitle,
      subtitle: "New Event",
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
    };
    overlayEvents.push(newEvent);
    return newEvent;
  },
});

export const eventsRepository = createLocalEventsRepository();
