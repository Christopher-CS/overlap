import type { CalendarEventTemplate } from "../app/components/ScheduleCalendar";

export type EventRecord = CalendarEventTemplate;

export type CreateEventInput = {
  title: string;
  ownerId: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type EventsRepository = {
  listEvents: () => Promise<EventRecord[]>;
  createEvent: (input: CreateEventInput) => Promise<EventRecord>;
};
