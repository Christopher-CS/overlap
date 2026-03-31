import { Feather } from "@expo/vector-icons";
import {
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type CalendarKitHandle,
  type EventItem,
  type PackedEvent,
} from "@howljs/calendar-kit";
import { useCallback, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { scheduleCalendarStyles as styles } from "./scheduleCalendarStyles";

export type CalendarActor = {
  id: string;
  name: string;
  entityType: "user" | "group";
  color: string;
  chipColor: string;
  eventColor: string;
};

export type CalendarEventTemplate = {
  id: string;
  ownerId: string;
  title: string;
  subtitle: string;
  date: string;
  startTime: string;
  endTime: string;
};

type ScheduleCalendarProps = {
  actors: CalendarActor[];
  eventTemplates: CalendarEventTemplate[];
};

type CalendarViewMode = "day" | "week" | "month";

type MockCalendarEvent = EventItem & {
  subtitle: string;
  accentColor: string;
  surfaceColor: string;
};

type SelectedEventDetail = {
  title: string;
  subtitle: string;
  dateLabel: string;
  timeLabel: string;
  accentColor: string;
  surfaceColor: string;
};

const CURRENT_TIME_ZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const MONTH_WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const CALENDAR_THEME = {
  colors: {
    primary: "#F2555A",
    onPrimary: "#FFFFFF",
    background: "#FFFFFF",
    onBackground: "#1A2746",
    border: "#E9EEF7",
    text: "#70809E",
    surface: "#F4F7FC",
    onSurface: "#6F7D95",
  },
  hourTextStyle: {
    color: "#98A6BF",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  hourBorderColor: "#E9EEF7",
  headerBackgroundColor: "#FFFFFF",
  headerBorderColor: "#E9EEF7",
  dayBarBorderColor: "#E9EEF7",
  nowIndicatorColor: "#F2555A",
};

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, amount: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const addMonths = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const startOfWeek = (date: Date) => {
  const day = date.getDay();
  return addDays(date, -day);
};

const buildDateTimeString = (date: Date, time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return `${formatDateOnly(date)}T${`${hours}`.padStart(2, "0")}:${`${minutes}`.padStart(2, "0")}:00`;
};

const isSameDay = (firstDate: Date, secondDate: Date) =>
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate();

const getInitialVisibleDate = (eventTemplates: CalendarEventTemplate[]) =>
  eventTemplates.length > 0
    ? parseDateOnly([...eventTemplates].map((event) => event.date).sort()[0])
    : new Date();

const formatRangeLabel = (startDate: Date, viewMode: CalendarViewMode) => {
  if (viewMode === "month") {
    return { title: monthFormatter.format(startDate), year: `${startDate.getFullYear()}` };
  }

  if (viewMode === "day") {
    return { title: monthDayFormatter.format(startDate), year: `${startDate.getFullYear()}` };
  }

  const weekStartDate = startOfWeek(startDate);
  const endDate = addDays(weekStartDate, 6);
  return {
    title:
      weekStartDate.getMonth() === endDate.getMonth()
        ? `${monthDayFormatter.format(weekStartDate)} - ${endDate.getDate()}`
        : `${monthDayFormatter.format(weekStartDate)} - ${monthDayFormatter.format(endDate)}`,
    year:
      weekStartDate.getFullYear() === endDate.getFullYear()
        ? `${weekStartDate.getFullYear()}`
        : `${weekStartDate.getFullYear()} - ${endDate.getFullYear()}`,
  };
};

const formatDisplayTime = (time: string) => {
  const [hoursText, minutesText] = time.split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${minutesText} ${suffix}`;
};

const buildEventDetail = ({
  title,
  subtitle,
  date,
  startTime,
  endTime,
  accentColor,
  surfaceColor,
}: {
  title: string;
  subtitle: string;
  date: string;
  startTime: string;
  endTime: string;
  accentColor: string;
  surfaceColor: string;
}): SelectedEventDetail => ({
  title,
  subtitle,
  dateLabel: new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseDateOnly(date)),
  timeLabel: `${formatDisplayTime(startTime)} - ${formatDisplayTime(endTime)}`,
  accentColor,
  surfaceColor,
});

const buildMonthGrid = (visibleDate: Date) => {
  const monthStart = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1);
  const firstVisibleDate = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(firstVisibleDate, index));
};

export default function ScheduleCalendar({
  actors,
  eventTemplates,
}: ScheduleCalendarProps) {
  const actorMap = Object.fromEntries(
    actors.map((actor) => [actor.id, actor]),
  ) as Record<string, CalendarActor>;
  const initialVisibleDate = getInitialVisibleDate(eventTemplates);
  const calendarRef = useRef<CalendarKitHandle>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [visibleDate, setVisibleDate] = useState(initialVisibleDate);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEventDetail | null>(null);
  const [activeActors, setActiveActors] = useState<Record<string, boolean>>(
    () => Object.fromEntries(actors.map((actor) => [actor.id, true])) as Record<string, boolean>,
  );

  const filteredEventTemplates = eventTemplates.filter(
    (eventTemplate) => activeActors[eventTemplate.ownerId],
  );

  const calendarEvents: MockCalendarEvent[] = filteredEventTemplates.map((eventTemplate) => {
    const actor = actorMap[eventTemplate.ownerId];
    const eventDate = parseDateOnly(eventTemplate.date);
    return {
      id: `${eventTemplate.id}-${formatDateOnly(eventDate)}`,
      title: eventTemplate.title,
      subtitle: eventTemplate.subtitle,
      accentColor: actor.color,
      surfaceColor: actor.eventColor,
      start: {
        dateTime: buildDateTimeString(eventDate, eventTemplate.startTime),
        timeZone: CURRENT_TIME_ZONE,
      },
      end: {
        dateTime: buildDateTimeString(eventDate, eventTemplate.endTime),
        timeZone: CURRENT_TIME_ZONE,
      },
    };
  });

  const monthEventsByDate = filteredEventTemplates.reduce<Record<string, CalendarEventTemplate[]>>(
    (eventMap, eventTemplate) => {
      if (!eventMap[eventTemplate.date]) {
        eventMap[eventTemplate.date] = [];
      }
      eventMap[eventTemplate.date].push(eventTemplate);
      return eventMap;
    },
    {},
  );

  const selectedDayEvents = (
    monthEventsByDate[formatDateOnly(visibleDate)] ?? []
  ).sort((firstEvent, secondEvent) => firstEvent.startTime.localeCompare(secondEvent.startTime));

  const renderDayItem = useCallback(({ dateUnix }: { dateUnix: number }) => {
    const dayDate = new Date(dateUnix);
    const isToday = isSameDay(dayDate, new Date());
    return (
      <View style={[styles.dayHeaderCell, isToday && styles.dayHeaderCellCurrent]}>
        <Text style={[styles.dayHeaderLabel, isToday && styles.dayHeaderLabelCurrent]}>
          {weekdayFormatter.format(dayDate).toUpperCase()}
        </Text>
        <Text style={[styles.dayHeaderValue, isToday && styles.dayHeaderValueCurrent]}>
          {dayDate.getDate()}
        </Text>
      </View>
    );
  }, []);

  const renderEvent = useCallback((event: PackedEvent) => {
    const calendarEvent = event as PackedEvent & MockCalendarEvent;
    return (
      <View
        style={[
          styles.eventCard,
          {
            backgroundColor: calendarEvent.surfaceColor,
            borderLeftColor: calendarEvent.accentColor,
          },
        ]}
      >
        <Text numberOfLines={1} style={styles.eventTitle}>
          {calendarEvent.title}
        </Text>
        <Text numberOfLines={1} style={[styles.eventSubtitle, { color: calendarEvent.accentColor }]}>
          {calendarEvent.subtitle}
        </Text>
      </View>
    );
  }, []);

  const rangeLabel = formatRangeLabel(visibleDate, viewMode);
  const monthGrid = buildMonthGrid(visibleDate);
  const timelineDays = viewMode === "day" ? 1 : 7;
  const timelineDate = viewMode === "week" ? startOfWeek(visibleDate) : visibleDate;

  const openEventDetailFromTemplate = (eventTemplate: CalendarEventTemplate) => {
    const actor = actorMap[eventTemplate.ownerId];
    setSelectedEvent(
      buildEventDetail({
        title: eventTemplate.title,
        subtitle: eventTemplate.subtitle,
        date: eventTemplate.date,
        startTime: eventTemplate.startTime,
        endTime: eventTemplate.endTime,
        accentColor: actor.color,
        surfaceColor: actor.eventColor,
      }),
    );
  };

  const handlePrev = () => {
    if (viewMode === "month") {
      setVisibleDate((currentDate) => addMonths(currentDate, -1));
      return;
    }

    if (viewMode === "week") {
      const previousWeek = addDays(startOfWeek(visibleDate), -7);
      setVisibleDate(previousWeek);
      calendarRef.current?.goToDate({ date: formatDateOnly(previousWeek) });
      return;
    }

    calendarRef.current?.goToPrevPage(true);
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setVisibleDate((currentDate) => addMonths(currentDate, 1));
      return;
    }

    if (viewMode === "week") {
      const nextWeek = addDays(startOfWeek(visibleDate), 7);
      setVisibleDate(nextWeek);
      calendarRef.current?.goToDate({ date: formatDateOnly(nextWeek) });
      return;
    }

    calendarRef.current?.goToNextPage(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.rangeRow}>
          <TouchableOpacity onPress={handlePrev} style={styles.arrowButton}>
            <Feather color="#22304D" name="chevron-left" size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.rangeText}>{rangeLabel.title}</Text>
            <Text style={styles.rangeYear}>{rangeLabel.year}</Text>
          </View>
          <TouchableOpacity onPress={handleNext} style={styles.arrowButton}>
            <Feather color="#22304D" name="chevron-right" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.segmentedControl}>
          {(["day", "week", "month"] as CalendarViewMode[]).map((mode) => {
            const isActive = mode === viewMode;
            return (
              <Pressable
                key={mode}
                onPress={() => {
                  setViewMode(mode);
                  if (mode === "week") {
                    setVisibleDate((currentDate) => startOfWeek(currentDate));
                  }
                }}
                style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actorRow}>
        {actors.map((actor) => {
          const isActive = activeActors[actor.id];
          return (
            <Pressable
              key={actor.id}
              onPress={() =>
                setActiveActors((currentActors) => ({
                  ...currentActors,
                  [actor.id]: !currentActors[actor.id],
                }))
              }
              style={[
                styles.actorChip,
                {
                  backgroundColor: isActive ? actor.chipColor : "#FFFFFF",
                  borderColor: actor.color,
                  opacity: isActive ? 1 : 0.45,
                },
              ]}
            >
              <View
                style={[
                  styles.actorChipIcon,
                  {
                    borderColor: actor.color,
                    backgroundColor: isActive ? "#FFFFFF" : "transparent",
                  },
                ]}
              >
                <Feather color={actor.color} name="check" size={12} />
              </View>
              <Text style={[styles.actorChipText, { color: actor.color }]}>
                {actor.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {viewMode === "month" ? (
        <ScrollView contentContainerStyle={styles.monthContent} style={styles.monthShell}>
          <View style={styles.monthWeekdayRow}>
            {MONTH_WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.monthWeekdayLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {monthGrid.map((date) => {
              const dateKey = formatDateOnly(date);
              const dayEvents = monthEventsByDate[dateKey] ?? [];
              const isCurrentMonth = date.getMonth() === visibleDate.getMonth();
              const isSelected = isSameDay(date, visibleDate);
              const isToday = isSameDay(date, new Date());
              return (
                <Pressable
                  key={dateKey}
                  onPress={() => setVisibleDate(date)}
                  style={[
                    styles.monthCell,
                    isSelected && styles.monthCellSelected,
                    isToday && styles.monthCellToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.monthCellNumber,
                      !isCurrentMonth && styles.monthCellNumberMuted,
                      isSelected && styles.monthCellNumberSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  <View style={styles.monthEventDots}>
                    {dayEvents.slice(0, 3).map((eventTemplate) => (
                      <View
                        key={eventTemplate.id}
                        style={[
                          styles.monthEventDot,
                          { backgroundColor: actorMap[eventTemplate.ownerId].color },
                        ]}
                      />
                    ))}
                  </View>
                  {dayEvents.length > 3 ? (
                    <Text style={styles.monthMoreText}>+{dayEvents.length - 3}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.agendaSection}>
            <Text style={styles.agendaTitle}>
              {monthDayFormatter.format(visibleDate)} agenda
            </Text>
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((eventTemplate) => {
                const actor = actorMap[eventTemplate.ownerId];
                return (
                  <Pressable
                    key={`${eventTemplate.id}-${eventTemplate.date}`}
                    onPress={() => openEventDetailFromTemplate(eventTemplate)}
                    style={[
                      styles.agendaCard,
                      { backgroundColor: actor.eventColor, borderLeftColor: actor.color },
                    ]}
                  >
                    <Text style={styles.agendaTime}>
                      {formatDisplayTime(eventTemplate.startTime)} - {formatDisplayTime(eventTemplate.endTime)}
                    </Text>
                    <Text style={styles.agendaEventTitle}>{eventTemplate.title}</Text>
                    <Text style={[styles.agendaSubtitle, { color: actor.color }]}>
                      {eventTemplate.subtitle}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyAgenda}>
                <Text style={styles.emptyAgendaTitle}>No events for this day</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.calendarShell}>
          <CalendarContainer
            key={viewMode}
            allowHorizontalSwipe={viewMode !== "week"}
            events={calendarEvents}
            firstDay={viewMode === "week" ? 7 : 1}
            initialDate={formatDateOnly(timelineDate)}
            initialTimeIntervalHeight={58}
            numberOfDays={timelineDays}
            onDateChanged={(dateValue) => setVisibleDate(parseDateOnly(dateValue.slice(0, 10)))}
            onPressEvent={(event) => {
              const typedEvent = event as typeof event & MockCalendarEvent;
              if (!typedEvent.start.dateTime || !typedEvent.end.dateTime) {
                return;
              }
              const eventDate = typedEvent.start.dateTime.slice(0, 10);
              const startTime = typedEvent.start.dateTime.slice(11, 16);
              const endTime = typedEvent.end.dateTime.slice(11, 16);

              setSelectedEvent(
                buildEventDetail({
                  title: typedEvent.title ?? "Untitled event",
                  subtitle: typedEvent.subtitle,
                  date: eventDate,
                  startTime,
                  endTime,
                  accentColor: typedEvent.accentColor,
                  surfaceColor: typedEvent.surfaceColor,
                }),
              );
            }}
            overlapType="no-overlap"
            pagesPerSide={1}
            ref={calendarRef}
            scrollByDay={viewMode === "day"}
            scrollToNow
            spaceFromBottom={16}
            spaceFromTop={10}
            start={0}
            end={24 * 60}
            timeInterval={60}
            timeZone={CURRENT_TIME_ZONE}
            theme={CALENDAR_THEME}
            hourWidth={46}
          >
            <CalendarHeader
              dayBarHeight={60}
              headerBottomHeight={0}
              renderDayItem={renderDayItem}
            />
            <CalendarBody
              hourFormat="hh:mm A"
              renderEvent={renderEvent}
              showNowIndicator
              showTimeColumnRightLine
            />
          </CalendarContainer>
        </View>
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
        transparent
        visible={selectedEvent !== null}
      >
        <Pressable
          onPress={() => setSelectedEvent(null)}
          style={styles.eventModalBackdrop}
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.eventModalCard,
              selectedEvent && {
                backgroundColor: selectedEvent.surfaceColor,
                borderLeftColor: selectedEvent.accentColor,
              },
            ]}
          >
            <View style={styles.eventModalHeader}>
              <View style={styles.eventModalTitleBlock}>
                <Text style={styles.eventModalTitle}>{selectedEvent?.title}</Text>
                <Text
                  style={[
                    styles.eventModalSubtitle,
                    selectedEvent && { color: selectedEvent.accentColor },
                  ]}
                >
                  {selectedEvent?.subtitle}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedEvent(null)}
                style={styles.eventModalClose}
              >
                <Feather color="#42516D" name="x" size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.eventModalMeta}>
              <Text style={styles.eventModalMetaLabel}>Date</Text>
              <Text style={styles.eventModalMetaValue}>{selectedEvent?.dateLabel}</Text>
            </View>

            <View style={styles.eventModalMeta}>
              <Text style={styles.eventModalMetaLabel}>Time</Text>
              <Text style={styles.eventModalMetaValue}>{selectedEvent?.timeLabel}</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
