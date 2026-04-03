import { DateTime } from 'luxon';
import { Event, CalendarEvent } from '../types';

// Fallback list of timezones
const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney'
];

export const getTimezoneOptions = () => {
  const hasSupportedValuesOf = typeof Intl === 'object' &&
                              'supportedValuesOf' in Intl;

  const timezones = hasSupportedValuesOf
    ? (Intl as any).supportedValuesOf('timeZone')
    : TIMEZONES;

  return timezones.map((tz: string) => ({
    value: tz,
    label: `${tz} (UTC${DateTime.now().setZone(tz).toFormat('ZZ')})`
  }));
};

export const getDefaultTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const convertToViewerTimezone = (event: Event, viewerTimezone: string): CalendarEvent => {
  // Convert from event's stored timezone to viewer's timezone
  const startInViewerTz = DateTime.fromISO(event.startTime, { zone: 'utc' })
    .setZone(viewerTimezone);
  const endInViewerTz = DateTime.fromISO(event.endTime, { zone: 'utc' })
    .setZone(viewerTimezone);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start: startInViewerTz.toISO() || '',
    end: endInViewerTz.toISO() || '',
    allDay: false,
    extendedProps: {
      originalTimezone: event.timezone,
      originalStart: event.startTime,
      originalEnd: event.endTime,
      // Remove description and timezone from extendedProps 
      // since they're already top-level properties in CalendarEvent
    }
  };
};

export const formatLocalTime = (isoString: string, timezone: string): string => {
  return DateTime.fromISO(isoString, { zone: timezone }).toFormat("yyyy-MM-dd'T'HH:mm");
};