import { Event, EventStatus, GuestGroup } from '@/lib/supabase/types';
import { checkInRealtimeChannel } from '@/lib/realtime';

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
    setTimeout(() => autoSyncLocalStoresToServer(), 100);
  }
  return eventsMemoryStore;
}

function getGroupsStore(): Record<string, GuestGroup[]> {
  if (!guestGroupsMemoryStore) {
    guestGroupsMemoryStore = loadGroupsFromStorage();
    setTimeout(() => autoSyncLocalStoresToServer(), 100);
  }
  return guestGroupsMemoryStore;
}

export function getWorkspaceEvents(workspaceId: string): Event[] {
  const store = getEventsStore();
  if (!workspaceId) return store;
  return store.filter(e => e.workspace_id === workspaceId);
}

export async function getWorkspaceEventsAsync(workspaceId: string): Promise<Event[]> {
  // 1. Primary: Query Central Online Database API first
  try {
    const res = await fetch(`/api/events/sync?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        const store = getEventsStore();
        const merged = [...data.events, ...store.filter(e => !data.events.some((de: Event) => de.id === e.id))];
        saveEventsToStorage(merged);
        const onlineEvents = merged.filter((e: Event) => e.workspace_id === workspaceId);
        if (onlineEvents.length > 0) return onlineEvents;
      }
    }
  } catch (err) {
    console.warn('[Sync Events API Online Fetch Warning - Switching to Offline Contingency Cache]', err);
  }

  // 2. Secondary: Offline Contingency Fallback Cache
  return getWorkspaceEvents(workspaceId);
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

export async function getEventByIdAsync(eventId: string, workspaceId?: string): Promise<Event | undefined> {
  // 1. Primary: Query Central Online Database API first
  try {
    const res = await fetch(`/api/events/sync?eventId=${encodeURIComponent(eventId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.event) {
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

export function updateEvent(eventId: string, data: Partial<Omit<Event, 'id' | 'created_at'>>): Event {
  const store = getEventsStore();
  let evt = store.find(e => e.id === eventId);
  if (!evt) {
    evt = {
      id: eventId,
      workspace_id: 'ws-a-1111',
      name: 'Evento Principal',
      event_type: 'BODA_SOCIAL',
      event_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVO',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
    store.unshift(evt);
  } else {
    Object.assign(evt, data, { updated_at: new Date().toISOString() });
  }

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
): Promise<Event> {
  const updatedEvt = updateEvent(eventId, data);
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

export async function getEventGuestGroupsAsync(eventId: string): Promise<GuestGroup[]> {
  const localStore = getGroupsStore();
  const localGroups = localStore[eventId] || [];

  // 1. Primary: Query Central Online Database API first
  try {
    const res = await fetch(`/api/events/sync?eventId=${encodeURIComponent(eventId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.groups) && data.groups.length > 0) {
        const serverGroups: GuestGroup[] = data.groups;
        let requiresServerReSync = false;

        // Smart Reconciliation: Merge server data with local memory store without regressing check-ins
        const mergedGroups = serverGroups.map(serverG => {
          const localG = localGroups.find(lg => lg.id === serverG.id);
          if (!localG) return serverG;

          const localCount = localG.checked_in_count || 0;
          const serverCount = serverG.checked_in_count || 0;

          if (localCount > serverCount) {
            requiresServerReSync = true;
          }

          const maxCount = Math.max(localCount, serverCount);
          const status = maxCount >= serverG.max_passes ? 'COMPLETO' : maxCount > 0 ? 'PARCIAL' : 'PENDIENTE';

          return {
            ...serverG,
            checked_in_count: maxCount,
            status: status as 'PENDIENTE' | 'PARCIAL' | 'COMPLETO',
          };
        });

        // Also include any local groups missing from server
        localGroups.forEach(localG => {
          if (!mergedGroups.some(mg => mg.id === localG.id)) {
            mergedGroups.push(localG);
            requiresServerReSync = true;
          }
        });

        localStore[eventId] = mergedGroups;
        saveGroupsToStorage(localStore);

        // If local had higher check-in count, re-sync to server asynchronously
        if (requiresServerReSync && typeof window !== 'undefined') {
          const workspaceId = mergedGroups[0]?.workspace_id || '';
          fetch('/api/events/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SYNC_GROUPS', eventId, workspaceId, groups: mergedGroups }),
          }).catch(err => console.warn('[Re-sync higher local count warning]', err));
        }

        return mergedGroups;
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

export function deleteEventGuestGroups(eventId: string): void {
  const store = getGroupsStore();
  delete store[eventId];
  saveGroupsToStorage(store);
}

export function updateSingleGuestGroupCheckIn(
  eventId: string,
  groupId: string,
  newCheckedInCount: number,
  newStatus: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO'
): void {
  const store = getGroupsStore();
  let eventGroups = store[eventId];
  if (!eventGroups || eventGroups.length === 0) {
    const allLists = Object.values(store);
    for (const list of allLists) {
      if (Array.isArray(list) && list.some(g => g.id === groupId)) {
        eventGroups = list;
        break;
      }
    }
  }

  if (!eventGroups) eventGroups = [];
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
