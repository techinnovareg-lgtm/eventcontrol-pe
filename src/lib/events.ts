import { Event, EventStatus, GuestGroup } from '@/lib/supabase/types';

const EVENTS_STORAGE_KEY = 'eventcontrol_events';
const GROUPS_STORAGE_KEY = 'eventcontrol_guest_groups';

const INITIAL_EVENTS: Event[] = [];

const INITIAL_GROUPS: Record<string, GuestGroup[]> = {};

let eventsMemoryStore: Event[] | null = null;
let guestGroupsMemoryStore: Record<string, GuestGroup[]> | null = null;

function loadEventsFromStorage(): Event[] {
  if (typeof window === 'undefined') return INITIAL_EVENTS;
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Clean out legacy demo events (evt-101, evt-102) from browser storage
        const cleaned = parsed.filter(e => e.id !== 'evt-101' && e.id !== 'evt-102');
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('[EventsStore] Failed to load from localStorage', err);
  }
  saveEventsToStorage(INITIAL_EVENTS);
  return INITIAL_EVENTS;
}

function saveEventsToStorage(events: Event[]) {
  eventsMemoryStore = events;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      console.warn('[EventsStore] Failed to save to localStorage', err);
    }
  }
}

function loadGroupsFromStorage(): Record<string, GuestGroup[]> {
  if (typeof window === 'undefined') return INITIAL_GROUPS;
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        delete parsed['evt-102'];
        delete parsed['evt-101'];
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[GuestGroupsStore] Failed to load from localStorage', err);
  }
  saveGroupsToStorage(INITIAL_GROUPS);
  return INITIAL_GROUPS;
}

function saveGroupsToStorage(groups: Record<string, GuestGroup[]>) {
  guestGroupsMemoryStore = groups;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    } catch (err) {
      console.warn('[GuestGroupsStore] Failed to save to localStorage', err);
    }
  }
}

function getEventsStore(): Event[] {
  if (!eventsMemoryStore) {
    eventsMemoryStore = loadEventsFromStorage();
  }
  return eventsMemoryStore;
}

function getGroupsStore(): Record<string, GuestGroup[]> {
  if (!guestGroupsMemoryStore) {
    guestGroupsMemoryStore = loadGroupsFromStorage();
  }
  return guestGroupsMemoryStore;
}

export function getWorkspaceEvents(workspaceId: string): Event[] {
  const store = getEventsStore();
  if (!workspaceId) return store;
  return store.filter(e => e.workspace_id === workspaceId);
}

export function getEventById(eventId: string, workspaceId?: string): Event | undefined {
  const store = getEventsStore();
  let found = store.find(e => e.id === eventId);
  if (found) return found;
  if (workspaceId) {
    found = store.find(e => e.workspace_id === workspaceId);
    if (found) return found;
  }
  return undefined;
}

export function createEvent(data: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Event {
  const store = getEventsStore();
  const newEvt: Event = {
    ...data,
    id: `evt-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const updated = [newEvt, ...store];
  saveEventsToStorage(updated);
  return newEvt;
}

export function updateEvent(eventId: string, data: Partial<Omit<Event, 'id' | 'created_at'>>): Event | undefined {
  const store = getEventsStore();
  const evt = store.find(e => e.id === eventId);
  if (evt) {
    Object.assign(evt, data, { updated_at: new Date().toISOString() });
    saveEventsToStorage(store);
  }
  return evt;
}

export function deleteEvent(eventId: string): void {
  const store = getEventsStore();
  const idx = store.findIndex(e => e.id === eventId);
  if (idx !== -1) {
    store.splice(idx, 1);
    saveEventsToStorage(store);
  }
}

export function getEventGuestGroups(eventId: string): GuestGroup[] {
  const store = getGroupsStore();
  return store[eventId] || [];
}

export function saveEventGuestGroups(eventId: string, workspaceId: string, groups: Omit<GuestGroup, 'id' | 'created_at' | 'updated_at'>[]): GuestGroup[] {
  const store = getGroupsStore();
  const created: GuestGroup[] = groups.map((g, idx) => ({
    ...g,
    id: `gg-${eventId}-${idx + 1}-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  store[eventId] = created;
  saveGroupsToStorage(store);
  return created;
}

export function deleteEventGuestGroups(eventId: string): void {
  const store = getGroupsStore();
  delete store[eventId];
  saveGroupsToStorage(store);
}
