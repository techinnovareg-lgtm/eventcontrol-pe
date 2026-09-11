import { Event, EventStatus, GuestGroup } from '@/lib/supabase/types';
import { checkInRealtimeChannel } from '@/lib/realtime';
import { deleteEventTables, deleteEventAssignments, deleteEventVenueElements } from '@/lib/tables';
import { deleteEventCuts } from '@/lib/cuts';
import { deleteEventQRTokens } from '@/lib/qr-engine';

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
        // Clean out legacy demo/phantom events (evt-101, evt-102, evt-principal-01) from browser storage
        const cleaned = parsed.filter(e => e.id !== 'evt-101' && e.id !== 'evt-102' && e.id !== 'evt-principal-01');
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

function autoSyncLocalStoresToServer() {
  if (typeof window === 'undefined') return;
  try {
    const localEvents = eventsMemoryStore || loadEventsFromStorage();
    localEvents.forEach(evt => {
      fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_EVENT', event: evt }),
      }).catch(() => {});
    });

    const localGroups = guestGroupsMemoryStore || loadGroupsFromStorage();
    Object.entries(localGroups).forEach(([evtId, grps]) => {
      if (grps && grps.length > 0) {
        const workspaceId = grps[0]?.workspace_id || '';
        fetch('/api/events/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'SYNC_GROUPS', eventId: evtId, workspaceId, groups: grps }),
        }).catch(() => {});
      }
    });
  } catch (err) {}
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
  const res = !workspaceId ? store : store.filter(e => e.workspace_id === workspaceId);
  return res.sort((a, b) => new Date(b.created_at || b.event_date || 0).getTime() - new Date(a.created_at || a.event_date || 0).getTime());
}

export async function getWorkspaceEventsAsync(workspaceId: string): Promise<Event[]> {
  // 1. Primary: Query Central Online Database API first
  try {
    const res = await fetch(`/api/events/sync?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        const serverEvents = data.events.filter((e: Event) => e.id !== 'evt-101' && e.id !== 'evt-102' && e.id !== 'evt-principal-01');
        const localStore = getEventsStore().filter(e => e.id !== 'evt-101' && e.id !== 'evt-102' && e.id !== 'evt-principal-01');
        
        // Preserve ONLY newly created offline local events (created < 15 seconds ago) that are not yet on the server
        const now = Date.now();
        const localWorkspaceEvents = localStore.filter(e => e.workspace_id === workspaceId);
        const unsyncedLocalEvents = localWorkspaceEvents.filter(le => {
          const isServerMatch = serverEvents.some((se: Event) => se.id === le.id);
          const isNewlyCreated = le.created_at ? (now - new Date(le.created_at).getTime() < 15000) : false;
          return !isServerMatch && isNewlyCreated;
        });
        
        // Immediately sync unsynced newly created local events to the central server
        unsyncedLocalEvents.forEach(evt => {
          fetch('/api/events/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SYNC_EVENT', event: evt }),
          }).catch(() => {});
        });

        const otherWorkspaceEvents = localStore.filter(e => e.workspace_id !== workspaceId);
        const mergedWorkspaceEvents = [...serverEvents, ...unsyncedLocalEvents].sort(
          (a, b) => new Date(b.created_at || b.event_date || 0).getTime() - new Date(a.created_at || a.event_date || 0).getTime()
        );
        const finalMerged = [...otherWorkspaceEvents, ...mergedWorkspaceEvents];
        
        // Save authoritative list to local storage, purging any deleted past events
        saveEventsToStorage(finalMerged);
        return mergedWorkspaceEvents;
      }
    }
  } catch (err) {
    console.warn('[Sync Events API Online Fetch Warning - Switching to Offline Contingency Cache]', err);
  }

  // 2. Secondary: Offline Contingency Fallback Cache
  return getWorkspaceEvents(workspaceId);
}

export function getEventById(eventId: string, workspaceId?: string): Event | undefined {
  if (!eventId) return undefined;
  const store = getEventsStore();
  const found = store.find(e => e.id === eventId);
  if (found) return found;
  return undefined;
}

export async function getEventByIdAsync(eventId: string, workspaceId?: string): Promise<Event | undefined> {
  // 1. Primary: Query Central Online Database API first
  try {
    const res = await fetch(`/api/events/sync?eventId=${encodeURIComponent(eventId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.event && data.event.id !== 'evt-principal-01') {
        const store = getEventsStore();
        const idx = store.findIndex(e => e.id === data.event.id);
        if (idx !== -1) {
          store[idx] = data.event;
        } else {
          store.unshift(data.event);
        }
        saveEventsToStorage(store);

        // Save fetched guest groups if present
        if (Array.isArray(data.groups) && data.groups.length > 0) {
          const gStore = getGroupsStore();
          gStore[eventId] = data.groups;
          saveGroupsToStorage(gStore);
        }

        return data.event;
      }
    }
  } catch (err) {
    console.warn('[Sync EventById Online Fetch Warning - Switching to Offline Contingency Cache]', err);
  }

  // 2. Secondary: Offline Contingency Fallback Cache
  return getEventById(eventId, workspaceId);
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

  if (typeof window !== 'undefined') {
    fetch('/api/events/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_EVENT', event: newEvt }),
    }).catch(err => console.warn('[Sync Event API dispatch warning]', err));
  }

  return newEvt;
}

export async function createEventAsync(data: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
  const newEvt = createEvent(data);
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_EVENT', event: newEvt }),
      });
    } catch (err) {
      console.warn('[Sync Event API dispatch error]', err);
    }
  }
  return newEvt;
}

export function updateEvent(eventId: string, data: Partial<Omit<Event, 'id' | 'created_at'>>): Event | undefined {
  const store = getEventsStore();
  let evt = store.find(e => e.id === eventId);
  if (!evt) {
    // Return early if event does not exist, never re-create phantom Evento Principal
    return undefined;
  }
  
  Object.assign(evt, data, { updated_at: new Date().toISOString() });
  saveEventsToStorage(store);
  checkInRealtimeChannel.notify({ type: 'EVENT_UPDATED', eventId, event: evt });

  if (typeof window !== 'undefined') {
    fetch('/api/events/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_EVENT', event: evt }),
    }).catch(err => console.warn('[Sync Event API dispatch warning]', err));
  }

  return evt;
}

export async function updateEventAsync(
  eventId: string,
  data: Partial<Omit<Event, 'id' | 'created_at'>>,
  workspaceId?: string
): Promise<Event | undefined> {
  const updatedEvt = updateEvent(eventId, data);
  if (!updatedEvt) return undefined;

  if (workspaceId && updatedEvt.workspace_id !== workspaceId) {
    updatedEvt.workspace_id = workspaceId;
    saveEventsToStorage(getEventsStore());
  }

  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_EVENT', event: updatedEvt }),
      });
    } catch (err) {
      console.warn('[updateEventAsync dispatch warning]', err);
    }
  }

  return updatedEvt;
}

export function deleteEvent(eventId: string): void {
  // 1. Remove from local events store
  const store = getEventsStore();
  const idx = store.findIndex(e => e.id === eventId);
  if (idx !== -1) {
    store.splice(idx, 1);
    saveEventsToStorage(store);
  }

  // 2. Cascade delete guest groups
  const gStore = getGroupsStore();
  delete gStore[eventId];
  saveGroupsToStorage(gStore);

  // 3. Cascade delete tables, assignments, and venue elements
  deleteEventTables(eventId);
  deleteEventAssignments(eventId);
  deleteEventVenueElements(eventId);

  // 4. Cascade delete cuts
  deleteEventCuts(eventId);

  // 5. Cascade delete QR tokens
  deleteEventQRTokens(eventId);

  // 6. Realtime local broadcast
  checkInRealtimeChannel.notify({ type: 'EVENT_DELETED', eventId });

  // 7. Cascade delete in central online server database
  if (typeof window !== 'undefined') {
    fetch('/api/events/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_EVENT', eventId }),
    }).catch(err => console.warn('[Sync Delete Event API dispatch warning]', err));
  }
}

export function getEventGuestGroups(eventId: string): GuestGroup[] {
  const store = getGroupsStore();
  return store[eventId] || [];
}

export async function getEventGuestGroupsAsync(eventId: string): Promise<GuestGroup[]> {
  const localStore = getGroupsStore();
  const localGroups = localStore[eventId] || [];

  // 1. Primary: Query Central Online Database API first
  try {
    const res = await fetch(`/api/events/sync?eventId=${encodeURIComponent(eventId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        localStore[eventId] = data.groups;
        saveGroupsToStorage(localStore);
        return data.groups;
      }
    }
  } catch (err) {
    console.warn('[Sync GuestGroups API Online Fetch Warning - Switching to Offline Contingency Cache]', err);
  }

  // 2. Secondary: Offline Contingency Fallback Cache
  return getEventGuestGroups(eventId);
}

export function saveEventGuestGroups(eventId: string, workspaceId: string, groups: Omit<GuestGroup, 'id' | 'created_at' | 'updated_at'>[]): GuestGroup[] {
  const store = getGroupsStore();
  const created: GuestGroup[] = groups.map((g, idx) => {
    const padNum = String(idx + 1).padStart(3, '0');
    const stableId = `grp-${padNum}`;
    return {
      ...g,
      id: (g as any).id || (idx < 12 ? stableId : `gg-${eventId}-${idx + 1}-${Date.now()}`),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  store[eventId] = created;
  saveGroupsToStorage(store);

  if (typeof window !== 'undefined') {
    fetch('/api/events/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_GROUPS', eventId, workspaceId, groups: created }),
    }).catch(err => console.warn('[Sync Groups API dispatch warning]', err));
  }

  return created;
}

export async function saveEventGuestGroupsAsync(
  eventId: string,
  workspaceId: string,
  groups: Omit<GuestGroup, 'id' | 'created_at' | 'updated_at'>[]
): Promise<GuestGroup[]> {
  const created = saveEventGuestGroups(eventId, workspaceId, groups);
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_GROUPS', eventId, workspaceId, groups: created }),
      });
    } catch (err) {
      console.warn('[Sync Groups API dispatch error]', err);
    }
  }
  return created;
}

export function deleteEventGuestGroups(eventId: string): void {
  const store = getGroupsStore();
  delete store[eventId];
  saveGroupsToStorage(store);

  deleteEventAssignments(eventId);
  deleteEventQRTokens(eventId);

  checkInRealtimeChannel.notify({ type: 'GROUPS_DELETED', eventId });

  if (typeof window !== 'undefined') {
    fetch('/api/events/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_GROUPS', eventId }),
    }).catch(err => console.warn('[Sync Delete Groups API dispatch warning]', err));
  }
}

export async function deleteEventGuestGroupsAsync(eventId: string): Promise<void> {
  deleteEventGuestGroups(eventId);
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_GROUPS', eventId }),
      });
    } catch (err) {
      console.warn('[Sync Delete Groups API dispatch error]', err);
    }
  }
}

export function updateSingleGuestGroupCheckIn(
  eventId: string,
  groupId: string,
  newCheckedInCount: number,
  newStatus: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO'
): void {
  const store = getGroupsStore();
  const eventGroups = store[eventId] || [];
  const group = eventGroups.find(g => g.id === groupId);

  if (group) {
    group.checked_in_count = newCheckedInCount;
    group.status = newStatus;
    saveGroupsToStorage(store);
    checkInRealtimeChannel.notify({ type: 'CHECKIN_UPDATED', eventId, groupId, newCheckedInCount, newStatus });

    if (typeof window !== 'undefined') {
      const workspaceId = group.workspace_id || '';
      fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_GROUPS', eventId, workspaceId, groups: eventGroups }),
      }).catch(err => console.warn('[Sync Groups CheckIn dispatch warning]', err));
    }
  }
}

export async function updateSingleGuestGroupCheckInAsync(
  eventId: string,
  groupId: string,
  newCheckedInCount: number,
  newStatus: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO'
): Promise<void> {
  const store = getGroupsStore();
  const eventGroups = store[eventId] || [];
  const group = eventGroups.find(g => g.id === groupId);

  if (group) {
    group.checked_in_count = newCheckedInCount;
    group.status = newStatus;
    saveGroupsToStorage(store);

    if (typeof window !== 'undefined') {
      const workspaceId = group.workspace_id || '';
      try {
        await fetch('/api/events/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'SYNC_GROUPS', eventId, workspaceId, groups: eventGroups }),
        });
      } catch (err) {
        console.warn('[Sync Groups CheckIn Async dispatch warning]', err);
      }
    }
  }
}
