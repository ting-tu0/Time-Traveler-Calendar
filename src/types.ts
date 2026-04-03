// In ../types.ts
export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  recurring?: string;
  recurringUntil?: string;
}

export type ViewType = 'timeGridWeek' | 'dayGridMonth';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps?: {
    originalTimezone?: string;
    originalStart?: string;
    originalEnd?: string;
    description?: string;      // Add this
    timezone?: string;         // Add this
  };
}