import type { CalendarEventTemplate } from "../app/components/ScheduleCalendar";

export type ConflictGroup = {
  date: string;
  startTime: string;
  endTime: string;
  eventKeys: string[];
};

export type ConflictSummary = {
  conflictEventKeys: Set<string>;
  conflictGroupsByDate: Record<string, ConflictGroup[]>;
  conflictCountByDate: Record<string, number>;
  conflictCountByEventKey: Record<string, number>;
};

const toEventKey = (eventTemplate: CalendarEventTemplate) =>
  `${eventTemplate.id}-${eventTemplate.date}`;

const toMinutes = (timeValue: string) => {
  const [hoursText, minutesText] = timeValue.split(":");
  return Number(hoursText) * 60 + Number(minutesText);
};

const fromMinutes = (minutesValue: number) => {
  const normalized = Math.max(0, minutesValue);
  const hours = `${Math.floor(normalized / 60)}`.padStart(2, "0");
  const minutes = `${normalized % 60}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const detectConflicts = (
  eventTemplates: CalendarEventTemplate[],
): ConflictSummary => {
  const eventsByDate = eventTemplates.reduce<Record<string, CalendarEventTemplate[]>>(
    (eventMap, eventTemplate) => {
      if (!eventMap[eventTemplate.date]) {
        eventMap[eventTemplate.date] = [];
      }
      eventMap[eventTemplate.date].push(eventTemplate);
      return eventMap;
    },
    {},
  );

  const conflictEventKeys = new Set<string>();
  const conflictGroupsByDate: Record<string, ConflictGroup[]> = {};
  const conflictCountByDate: Record<string, number> = {};
  const conflictCountByEventKey: Record<string, number> = {};

  Object.entries(eventsByDate).forEach(([dateValue, dateEvents]) => {
    const sortedEvents = [...dateEvents].sort((firstEvent, secondEvent) =>
      firstEvent.startTime.localeCompare(secondEvent.startTime),
    );
    const dateConflicts: ConflictGroup[] = [];

    let index = 0;
    while (index < sortedEvents.length) {
      const groupEvents = [sortedEvents[index]];
      let groupEndMinutes = toMinutes(sortedEvents[index].endTime);
      let nextIndex = index + 1;

      while (
        nextIndex < sortedEvents.length &&
        toMinutes(sortedEvents[nextIndex].startTime) < groupEndMinutes
      ) {
        groupEvents.push(sortedEvents[nextIndex]);
        groupEndMinutes = Math.max(
          groupEndMinutes,
          toMinutes(sortedEvents[nextIndex].endTime),
        );
        nextIndex += 1;
      }

      if (groupEvents.length > 1) {
        const eventKeys = groupEvents.map((eventTemplate) => toEventKey(eventTemplate));
        dateConflicts.push({
          date: dateValue,
          startTime: groupEvents[0].startTime,
          endTime: fromMinutes(groupEndMinutes),
          eventKeys,
        });

        eventKeys.forEach((eventKey) => {
          conflictEventKeys.add(eventKey);
          conflictCountByEventKey[eventKey] = (conflictCountByEventKey[eventKey] ?? 0) + (groupEvents.length - 1);
        });
      }

      index = Math.max(nextIndex, index + 1);
    }

    if (dateConflicts.length > 0) {
      conflictGroupsByDate[dateValue] = dateConflicts;
      conflictCountByDate[dateValue] = dateConflicts.length;
    }
  });

  return {
    conflictEventKeys,
    conflictGroupsByDate,
    conflictCountByDate,
    conflictCountByEventKey,
  };
};
