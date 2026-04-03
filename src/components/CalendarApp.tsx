import React, { useState, useEffect, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateTime } from 'luxon';
import Select from 'react-select';
import { Event, ViewType, CalendarEvent } from '../types';
import {
  saveEvents,
  loadEvents,
  exportEvents,
  importEvents
} from '../utils/storage';
import {
  getTimezoneOptions,
  convertToViewerTimezone,
  getDefaultTimezone
} from '../utils/timezone';
// FIX: Import the new modal component
import DeleteConfirmModal from './DeleteConfirmModal';
import './CalendarApp.css';

const RECURRING_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' }
];

const EVENT_COLORS = {
  existing: {
    border: '#4a90d9',
    dot: '#4a90d9',
    title: '#2d6cb5',
    bg: 'rgba(74, 144, 217, 0.08)'
  },
  new: {
    border: '#77db68',
    dot: '#77db68',
    title: '#4cab3d',
    bg: 'rgba(74, 222, 128, 0.08)'
  }
};

const CalendarApp: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [viewerTimezone, setViewerTimezone] = useState<string>(getDefaultTimezone());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewType, setViewType] = useState<ViewType>('dayGridMonth');
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentDateDisplay, setCurrentDateDisplay] = useState<string>('');
  // FIX: Add modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'single' | 'recurring'>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    setEvents(loadEvents());
  }, []);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentDate = DateTime.fromJSDate(calendarApi.getDate());
      const displayText = viewType === 'dayGridMonth' 
        ? currentDate.toFormat('MMMM yyyy')
        : `Week of ${currentDate.toFormat('MMM d, yyyy')}`;
      setCurrentDateDisplay(displayText);
    }
  }, [viewType, events, viewerTimezone]);

  const handleViewChange = (view: ViewType) => {
    setViewType(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
      updateDateDisplay();
    }
  };

  const updateDateDisplay = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentDate = DateTime.fromJSDate(calendarApi.getDate());
      const displayText = viewType === 'dayGridMonth' 
        ? currentDate.toFormat('MMMM yyyy')
        : `Week of ${currentDate.toFormat('MMM d, yyyy')}`;
      setCurrentDateDisplay(displayText);
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
      updateDateDisplay();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
      updateDateDisplay();
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      updateDateDisplay();
    }
  };

  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setNewEvent(null);
      setSelectedDate(null);
    }
  };

  const handleDateClick = (clickInfo: any) => {
    const clickedDate = DateTime.fromISO(clickInfo.dateStr);
    
    const startTimeLocal = clickedDate.toFormat("yyyy-MM-dd") + "T09:00";
    const endTimeLocal = clickedDate.toFormat("yyyy-MM-dd") + "T10:00";
    
    const startTimeUTC = DateTime.fromISO(startTimeLocal, { zone: viewerTimezone })
      .toUTC()
      .toFormat("yyyy-MM-dd'T'HH:mm");
    const endTimeUTC = DateTime.fromISO(endTimeLocal, { zone: viewerTimezone })
      .toUTC()
      .toFormat("yyyy-MM-dd'T'HH:mm");

    setNewEvent({
      title: '',
      description: '',
      startTime: startTimeUTC,
      endTime: endTimeUTC,
      timezone: viewerTimezone,
      recurring: 'none',
      recurringUntil: ''
    });
    setSelectedEvent(null);
    setSelectedDate(clickInfo.dateStr);
  };

  const handleSelect = (selectInfo: any) => {
    const startDateTime = DateTime.fromISO(selectInfo.startStr);
    const endDateTime = DateTime.fromISO(selectInfo.endStr);
    
    const startTimeUTC = startDateTime.toUTC().toFormat("yyyy-MM-dd'T'HH:mm");
    const endTimeUTC = endDateTime.toUTC().toFormat("yyyy-MM-dd'T'HH:mm");

    setNewEvent({
      title: '',
      description: '',
      startTime: startTimeUTC,
      endTime: endTimeUTC,
      timezone: viewerTimezone,
      recurring: 'none',
      recurringUntil: ''
    });
    setSelectedEvent(null);
    setSelectedDate(selectInfo.startStr);
    
    if (calendarRef.current) {
      calendarRef.current.getApi().unselect();
    }
  };

  const handleAddEventClick = () => {
    const now = DateTime.now().setZone(viewerTimezone);
    const startTimeLocal = now.toFormat("yyyy-MM-dd'T'09:00");
    const endTimeLocal = now.toFormat("yyyy-MM-dd'T'10:00");
    
    const startTimeUTC = DateTime.fromISO(startTimeLocal, { zone: viewerTimezone })
      .toUTC()
      .toFormat("yyyy-MM-dd'T'HH:mm");
    const endTimeUTC = DateTime.fromISO(endTimeLocal, { zone: viewerTimezone })
      .toUTC()
      .toFormat("yyyy-MM-dd'T'HH:mm");

    setNewEvent({
      title: '',
      description: '',
      startTime: startTimeUTC,
      endTime: endTimeUTC,
      timezone: viewerTimezone,
      recurring: 'none',
      recurringUntil: ''
    });
    setSelectedEvent(null);
    setSelectedDate(now.toFormat("yyyy-MM-dd"));
  };

  const generateRecurringEvents = (baseEvent: Event): Event[] => {
    const recurring = baseEvent.recurring;
    const recurringUntil = baseEvent.recurringUntil;
    
    if (!recurring || recurring === 'none') {
      return [baseEvent];
    }

    const events: Event[] = [];
    const startDate = DateTime.fromISO(baseEvent.startTime, { zone: 'utc' });
    const endDate = DateTime.fromISO(baseEvent.endTime, { zone: 'utc' });
    const duration = endDate.diff(startDate);
    
    let currentDate = startDate;
    const untilDate = recurringUntil ? DateTime.fromISO(recurringUntil) : null;
    
    const maxIterations = 52;
    let iterations = 0;

    while (iterations < maxIterations) {
      if (untilDate && currentDate > untilDate) {
        break;
      }

      const newEvent: Event = {
        ...baseEvent,
        id: `${baseEvent.id}-${iterations}`,
        startTime: currentDate.toFormat("yyyy-MM-dd'T'HH:mm"),
        endTime: currentDate.plus(duration).toFormat("yyyy-MM-dd'T'HH:mm"),
        recurring: 'none',
        recurringUntil: ''
      };

      events.push(newEvent);

      switch (recurring) {
        case 'weekly':
          currentDate = currentDate.plus({ weeks: 1 });
          break;
        case 'biweekly':
          currentDate = currentDate.plus({ weeks: 2 });
          break;
        case 'monthly':
          currentDate = currentDate.plus({ months: 1 });
          break;
        default:
          iterations = maxIterations;
      }

      iterations++;
    }

    return events;
  };

  const handleAddEvent = () => {
    if (!newEvent || !newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    const baseEvent: Event = {
      ...newEvent,
      id: Date.now().toString()
    };

    const newEvents = generateRecurringEvents(baseEvent);
    const updatedEvents = [...events, ...newEvents];
    
    saveEvents(updatedEvents);
    setEvents(updatedEvents);
    setNewEvent(null);
    setSelectedDate(null);
  };

  const handleUpdateEvent = () => {
    if (!selectedEvent) return;

    const updatedEvents = events.map(e =>
      e.id === selectedEvent.id ? selectedEvent : e
    );
    saveEvents(updatedEvents);
    setEvents(updatedEvents);
    setSelectedEvent(null);
  };

  // FIX: Updated delete handler with modal
  const handleDeleteClick = () => {
    if (!selectedEvent) return;

    const isRecurringInstance = selectedEvent.id.includes('-');
    
    // Check if this event has recurring instances
    const hasRecurringInstances = events.some(e => 
      e.id !== selectedEvent.id && e.id.startsWith(selectedEvent.id + '-')
    );

    const isRecurring = isRecurringInstance || hasRecurringInstances || (selectedEvent.recurring && selectedEvent.recurring !== 'none');
    
    if (isRecurring) {
      setDeleteMode('recurring');
    } else {
      setDeleteMode('single');
    }
    
    setShowDeleteModal(true);
  };

  // FIX: Delete all occurrences
  const handleDeleteAll = () => {
    if (!selectedEvent) return;

    const baseId = selectedEvent.id.includes('-') 
      ? selectedEvent.id.split('-')[0] 
      : selectedEvent.id;
    
    const updatedEvents = events.filter(e => !e.id.startsWith(baseId));
    saveEvents(updatedEvents);
    setEvents(updatedEvents);
    setShowDeleteModal(false);
    setSelectedEvent(null);
  };

  // FIX: Delete only this instance
  const handleDeleteOnce = () => {
    if (!selectedEvent) return;

    const updatedEvents = events.filter(e => e.id !== selectedEvent.id);
    saveEvents(updatedEvents);
    setEvents(updatedEvents);
    setShowDeleteModal(false);
    setSelectedEvent(null);
  };

  // FIX: Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importEvents(file, (importedEvents) => {
        setEvents(importedEvents);
      });
    }
  };

  const eventsForCalendar = useMemo(() => {
    return events.map(event => convertToViewerTimezone(event, viewerTimezone));
  }, [events, viewerTimezone]);

  const updateNewEvent = (updates: Partial<Omit<Event, 'id'>>) => {
    if (!newEvent) return;
    setNewEvent({...newEvent, ...updates});
  };

  const getEventTimeInEventTimezone = (utcTime: string, eventTimezone: string) => {
    return DateTime.fromISO(utcTime, { zone: 'utc' })
      .setZone(eventTimezone)
      .toFormat("yyyy-MM-dd'T'HH:mm");
  };

  const convertToUTC = (localTime: string, timezone: string) => {
    return DateTime.fromISO(localTime, { zone: timezone })
      .toUTC()
      .toFormat("yyyy-MM-dd'T'HH:mm");
  };

  const parseDateTime = (dateTimeString: string) => {
    const tz = selectedEvent ? selectedEvent.timezone : newEvent?.timezone || viewerTimezone;
    const dt = DateTime.fromISO(dateTimeString, { zone: 'utc' }).setZone(tz);
    return {
      date: dt.toFormat("yyyy-MM-dd"),
      time: dt.toFormat("HH:mm")
    };
  };

  const combineDateTime = (date: string, time: string, timezone: string) => {
    return convertToUTC(`${date}T${time}`, timezone);
  };

  const getEventClassNames = (event: any) => {
    if (selectedEvent && event.id === selectedEvent.id) {
      return ['selected-event'];
    }
    return [];
  };

  const getDateClassNames = (date: any) => {
    if (selectedDate && date.date.toISOString().startsWith(selectedDate)) {
      return ['selected-date'];
    }
    return [];
  };

  const getPanelState = () => {
    if (selectedEvent) return 'existing';
    if (newEvent) return 'new';
    return 'none';
  };

  const panelState = getPanelState();
  const currentColors = panelState === 'existing' ? EVENT_COLORS.existing : 
                        panelState === 'new' ? EVENT_COLORS.new : null;

  return (
    <div className="calendar-app">
      <div className="header">
        <div className="controls">
          <button onClick={handlePrev} title="Previous">
            ◀ Prev
          </button>
          <button onClick={handleToday} title="Today">
            Today
          </button>
          <button onClick={handleNext} title="Next">
            Next ▶
          </button>
          
          <div className="view-separator"></div>
          
          <span className="date-display">{currentDateDisplay}</span>
          
          <div className="view-separator"></div>
          
          <button
            onClick={() => handleViewChange('timeGridWeek')}
            className={viewType === 'timeGridWeek' ? 'active' : ''}
          >
            Week
          </button>
          <button
            onClick={() => handleViewChange('dayGridMonth')}
            className={viewType === 'dayGridMonth' ? 'active' : ''}
          >
            Month
          </button>
        </div>

        <div className="actions">
          <button onClick={handleAddEventClick}>Add Event</button>
          <button onClick={exportEvents}>Export</button>
          <button onClick={handleImportClick}>Import</button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />
          <Select
            className="timezone-select"
            options={getTimezoneOptions()}
            value={{
              value: viewerTimezone,
              label: `${viewerTimezone} (UTC${DateTime.now().setZone(viewerTimezone).toFormat('ZZ')})`
            }}
            onChange={(selectedOption) => {
              if (selectedOption) {
                setViewerTimezone(selectedOption.value);
              }
            }}
            placeholder="Viewer Timezone..."
          />
        </div>
      </div>

      <div className="main-content">
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={viewType}
            headerToolbar={false}
            events={eventsForCalendar}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            select={handleSelect}
            selectable={true}
            nowIndicator={true}
            height="auto"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            timeZone={viewerTimezone}
            key={viewerTimezone}
            eventClassNames={getEventClassNames}
            dayCellClassNames={getDateClassNames}
          />
        </div>

        <div className={`event-details panel-state-${panelState}`}>
          <div className="panel-header">
            {currentColors && (
              <span 
                className="status-dot" 
                style={{ backgroundColor: currentColors.dot }}
              />
            )}
            <h3 style={currentColors ? { color: currentColors.title } : {}}>
              {selectedEvent ? 'Event Details' : newEvent ? 'New Event' : 'Event Details'}
            </h3>
          </div>

          {currentColors && (
            <div 
              className="panel-accent-bar" 
              style={{ backgroundColor: currentColors.border }}
            />
          )}

          {!selectedEvent && !newEvent && (
            <div className="no-selection-instruction">
              <p>📅 Click on an event to see details</p>
              <p>🕑 Click on a date to create a new event</p>
              <p>🫲🏻 In week view, drag to select a time slot</p>
            </div>
          )}

          {(selectedEvent || newEvent) && (
            <>
              <div className="form-group">
                <input
                  type="text"
                  value={selectedEvent ? selectedEvent.title : newEvent?.title || ''}
                  onChange={(e) => selectedEvent
                    ? setSelectedEvent({...selectedEvent, title: e.target.value})
                    : updateNewEvent({title: e.target.value})}
                  placeholder="Event title"
                  required
                  className="title-input"
                />
              </div>

              <div className="form-group">
                <textarea
                  value={selectedEvent ? selectedEvent.description : newEvent?.description || ''}
                  onChange={(e) => selectedEvent
                    ? setSelectedEvent({...selectedEvent, description: e.target.value})
                    : updateNewEvent({description: e.target.value})}
                  placeholder="Description (optional)"
                  className="description-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date*</label>
                  <input
                    type="date"
                    value={selectedEvent
                      ? parseDateTime(selectedEvent.startTime).date
                      : newEvent?.startTime
                        ? parseDateTime(newEvent.startTime).date
                        : ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const eventTz = selectedEvent ? selectedEvent.timezone : newEvent?.timezone || viewerTimezone;
                      const currentTime = selectedEvent
                        ? parseDateTime(selectedEvent.startTime).time
                        : newEvent?.startTime
                          ? parseDateTime(newEvent.startTime).time
                          : '09:00';
                      const valueUTC = combineDateTime(newDate, currentTime, eventTz);
                      
                      if (selectedEvent) {
                        setSelectedEvent({...selectedEvent, startTime: valueUTC});
                      } else {
                        updateNewEvent({startTime: valueUTC});
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Start Time*</label>
                  <input
                    type="time"
                    step="1800"
                    value={selectedEvent
                      ? parseDateTime(selectedEvent.startTime).time
                      : newEvent?.startTime
                        ? parseDateTime(newEvent.startTime).time
                        : '09:00'}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      const eventTz = selectedEvent ? selectedEvent.timezone : newEvent?.timezone || viewerTimezone;
                      const currentDate = selectedEvent
                        ? parseDateTime(selectedEvent.startTime).date
                        : newEvent?.startTime
                          ? parseDateTime(newEvent.startTime).date
                          : DateTime.now().toFormat("yyyy-MM-dd");
                      const valueUTC = combineDateTime(currentDate, newTime, eventTz);
                      
                      if (selectedEvent) {
                        setSelectedEvent({...selectedEvent, startTime: valueUTC});
                      } else {
                        updateNewEvent({startTime: valueUTC});
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>End Date*</label>
                  <input
                    type="date"
                    value={selectedEvent
                      ? parseDateTime(selectedEvent.endTime).date
                      : newEvent?.endTime
                        ? parseDateTime(newEvent.endTime).date
                        : ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const eventTz = selectedEvent ? selectedEvent.timezone : newEvent?.timezone || viewerTimezone;
                      const currentTime = selectedEvent
                        ? parseDateTime(selectedEvent.endTime).time
                        : newEvent?.endTime
                          ? parseDateTime(newEvent.endTime).time
                          : '10:00';
                      const valueUTC = combineDateTime(newDate, currentTime, eventTz);
                      
                      if (selectedEvent) {
                        setSelectedEvent({...selectedEvent, endTime: valueUTC});
                      } else {
                        updateNewEvent({endTime: valueUTC});
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time*</label>
                  <input
                    type="time"
                    step="1800"
                    value={selectedEvent
                      ? parseDateTime(selectedEvent.endTime).time
                      : newEvent?.endTime
                        ? parseDateTime(newEvent.endTime).time
                        : '10:00'}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      const eventTz = selectedEvent ? selectedEvent.timezone : newEvent?.timezone || viewerTimezone;
                      const currentDate = selectedEvent
                        ? parseDateTime(selectedEvent.endTime).date
                        : newEvent?.endTime
                          ? parseDateTime(newEvent.endTime).date
                          : DateTime.now().toFormat("yyyy-MM-dd");
                      const valueUTC = combineDateTime(currentDate, newTime, eventTz);
                      
                      if (selectedEvent) {
                        setSelectedEvent({...selectedEvent, endTime: valueUTC});
                      } else {
                        updateNewEvent({endTime: valueUTC});
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Recurring</label>
                <Select
                  options={RECURRING_OPTIONS}
                  value={{
                    value: selectedEvent ? selectedEvent.recurring || 'none' : newEvent?.recurring || 'none',
                    label: RECURRING_OPTIONS.find((opt: { value: string }) => opt.value === (selectedEvent ? selectedEvent.recurring || 'none' : newEvent?.recurring || 'none'))?.label || 'Does not repeat'
                  }}
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      if (selectedEvent) {
                        setSelectedEvent({...selectedEvent, recurring: selectedOption.value});
                      } else {
                        updateNewEvent({recurring: selectedOption.value});
                      }
                    }
                  }}
                />
              </div>

              {(selectedEvent ? selectedEvent.recurring : newEvent?.recurring) !== 'none' && (
                <div className="form-group">
                  <label>Recurring Until</label>
                  <input
                    type="date"
                    value={selectedEvent 
                      ? selectedEvent.recurringUntil || '' 
                      : newEvent?.recurringUntil || ''}
                    onChange={(e) => {
                      if (selectedEvent) {
                        setSelectedEvent({...selectedEvent, recurringUntil: e.target.value});
                      } else {
                        updateNewEvent({recurringUntil: e.target.value});
                      }
                    }}
                    min={selectedEvent 
                      ? parseDateTime(selectedEvent.startTime).date 
                      : newEvent?.startTime 
                        ? parseDateTime(newEvent.startTime).date 
                        : DateTime.now().toFormat("yyyy-MM-dd")}
                  />
                  <div className="timezone-note">
                    Leave empty for no end date
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Event Timezone</label>
                <Select
                  options={getTimezoneOptions()}
                  value={{
                    value: selectedEvent ? selectedEvent.timezone : newEvent?.timezone || viewerTimezone,
                    label: selectedEvent ? selectedEvent.timezone : newEvent?.timezone || viewerTimezone
                  }}
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      if (selectedEvent) {
                        const newStartTime = getEventTimeInEventTimezone(selectedEvent.startTime, selectedOption.value);
                        const newEndTime = getEventTimeInEventTimezone(selectedEvent.endTime, selectedOption.value);
                        
                        setSelectedEvent({
                          ...selectedEvent,
                          timezone: selectedOption.value,
                          startTime: convertToUTC(newStartTime, selectedOption.value),
                          endTime: convertToUTC(newEndTime, selectedOption.value)
                        });
                      } else {
                        updateNewEvent({timezone: selectedOption.value});
                      }
                    }
                  }}
                />
              </div>

              <div className="form-actions">
                {selectedEvent ? (
                  <>
                    <button onClick={handleUpdateEvent}>Save</button>
                    {/* FIX: Changed to use modal */}
                    <button onClick={handleDeleteClick}>Delete</button>
                    <button onClick={() => setSelectedEvent(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={handleAddEvent}>Add</button>
                    <button onClick={() => { setNewEvent(null); setSelectedDate(null); }}>Cancel</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* FIX: Add the delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        isRecurring={deleteMode === 'recurring'}
        onConfirm={handleDeleteAll}
        onConfirmOnce={handleDeleteOnce}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default CalendarApp;