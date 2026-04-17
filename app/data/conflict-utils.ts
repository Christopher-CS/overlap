import type { CalendarEventTemplate } from "../app/components/ScheduleCalendar";

export type ConflictGroup = {
  date: string;
  startTime: string;
  endTime: string;
  eventKeys: string[];
};

export type ConflictSummary = {
  conflictEventKeys: Set<string>;
  highOverlapEventKeys: Set<string>;
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
  const highOverlapEventKeys = new Set<string>();
  const conflictGroupsByDate: Record<string, ConflictGroup[]> = {};
  const conflictCountByDate: Record<string, number> = {};
  const conflictCountByEventKey: Record<string, number> = {};

  Object.entries(eventsByDate).forEach(([dateValue, dateEvents]) => {
    const sortedEvents = [...dateEvents].sort((firstEvent, secondEvent) =>
      firstEvent.startTime.localeCompare(secondEvent.startTime),
    );
    const dateConflicts: ConflictGroup[] = [];
    const eventsWithBounds = sortedEvents.map((eventTemplate) => ({
      eventKey: toEventKey(eventTemplate),
      startMinutes: toMinutes(eventTemplate.startTime),
      endMinutes: toMinutes(eventTemplate.endTime),
    }));

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

    // Track events that are part of >=3 concurrent overlaps.
    const boundaries: Array<{ minute: number; type: "start" | "end"; eventKey: string }> = [];
    eventsWithBounds.forEach((eventWithBounds) => {
      boundaries.push({
        minute: eventWithBounds.startMinutes,
        type: "start",
        eventKey: eventWithBounds.eventKey,
      });
      boundaries.push({
        minute: eventWithBounds.endMinutes,
        type: "end",
        eventKey: eventWithBounds.eventKey,
      });
    });
    boundaries.sort((firstBoundary, secondBoundary) => {
      if (firstBoundary.minute !== secondBoundary.minute) {
        return firstBoundary.minute - secondBoundary.minute;
      }
      if (firstBoundary.type === secondBoundary.type) {
        return 0;
      }
      return firstBoundary.type === "end" ? -1 : 1;
    });

    const activeEventKeys = new Set<string>();
    boundaries.forEach((boundary) => {
      if (boundary.type === "end") {
        activeEventKeys.delete(boundary.eventKey);
        return;
      }

      activeEventKeys.add(boundary.eventKey);
      if (activeEventKeys.size >= 3) {
        activeEventKeys.forEach((eventKey) => {
          highOverlapEventKeys.add(eventKey);
        });
      }
    });

    if (dateConflicts.length > 0) {
      conflictGroupsByDate[dateValue] = dateConflicts;
      conflictCountByDate[dateValue] = dateConflicts.length;
    }
  });

  return {
    conflictEventKeys,
    highOverlapEventKeys,
    conflictGroupsByDate,
    conflictCountByDate,
    conflictCountByEventKey,
  };
};
