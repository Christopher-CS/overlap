import type { CalendarEventTemplate } from "../app/components/ScheduleCalendar";
import type { ActorId } from "./ids";

export type EventRecord = CalendarEventTemplate;

export type CreateEventInput = {
  title: string;
  ownerId: ActorId;
  date: string;
  startTime: string;
  endTime: string;
};

export type EventsRepository = {
  listEvents: () => Promise<EventRecord[]>;
  createEvent: (input: CreateEventInput) => Promise<EventRecord>;
};
