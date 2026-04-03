import { Event } from '../types';

const STORAGE_KEY = 'calendar-events';

export const saveEvents = (events: Event[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

export const loadEvents = (): Event[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const exportEvents = (): void => {
  const events = loadEvents();
  const data = {
    version: "1.0",
    events
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `calendar-events-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importEvents = (file: File, callback: (events: Event[]) => void): void => {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target?.result as string);
      if (!data.events) throw new Error("Invalid file format");

      // Validate events
      data.events.forEach((event: Event) => {
        if (!event.startTime || !event.timezone) {
          throw new Error("Missing required fields in event");
        }
      });

      saveEvents(data.events);
      callback(data.events);
    } catch (error) {
      alert("Error importing file: " + (error as Error).message);
    }
  };
  reader.readAsText(file);
};