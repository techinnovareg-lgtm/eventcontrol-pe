import { Event, EventStatus, GuestGroup } from '@/lib/supabase/types';

// Mock in-memory events repository
let eventsStore: Event[] = [
  {
    id: 'evt-101',
    workspace_id: 'ws-a-1111',
    name: 'Boda Ronny & Diana',
    event_type: 'Boda',
    event_date: '2026-10-15',
    event_time: '16:00',
    venue_name: 'Hacienda Fundo El Carmen, Lurín',
    status: 'ACTIVO',
    created_at: new Date('2026-08-01').toISOString(),
    updated_at: new Date('2026-08-01').toISOString(),
  },
  {
    id: 'evt-102',
    workspace_id: 'ws-a-1111',
    name: 'Cumpleaños Tavo 60 Años',
    event_type: 'Cumpleaños',
    event_date: '2026-09-20',
    event_time: '19:00',
    venue_name: 'Club Germania, Miraflores',
    status: 'PREPARACION',
    created_at: new Date('2026-08-15').toISOString(),
    updated_at: new Date('2026-08-15').toISOString(),
  },
];

let guestGroupsStore: Record<string, GuestGroup[]> = {
  'evt-102': [
    { id: 'grp-001', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Mamami', max_passes: 1, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'grp-002', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Lili, Lucho, Moico, Gaby, Sra. Ernestina', max_passes: 6, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'grp-003', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Nathali, German, Lula, Tati', max_passes: 4, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'grp-004', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Nidia, Emo', max_passes: 2, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'grp-005', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Pepe', max_passes: 1, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'grp-006', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Melo, Nidia, Enamorado, Nico', max_passes: 4, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'grp-007', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Miguel, Nicol', max_passes: 2, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'grp-008', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Claudia, Jorge Matias', max_passes: 3, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'grp-009', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Familia Lapo & Gasdy', max_passes: 5, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'grp-010', event_id: 'evt-102', workspace_id: 'ws-a-1111', group_name: 'Tavo & Amigos VIP', max_passes: 6, checked_in_count: 0, status: 'PENDIENTE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]
};

export function getWorkspaceEvents(workspaceId: string): Event[] {
  return eventsStore.filter(e => e.workspace_id === workspaceId);
}

export function getEventById(eventId: string, workspaceId?: string): Event | undefined {
  if (workspaceId) {
    return eventsStore.find(e => e.id === eventId && e.workspace_id === workspaceId);
  }
  return eventsStore.find(e => e.id === eventId);
}

export function createEvent(data: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Event {
  const newEvt: Event = {
    ...data,
    id: `evt-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  eventsStore.unshift(newEvt);
  return newEvt;
}

export function updateEvent(eventId: string, data: Partial<Omit<Event, 'id' | 'created_at'>>): Event | undefined {
  const evt = eventsStore.find(e => e.id === eventId);
  if (evt) {
    Object.assign(evt, data, { updated_at: new Date().toISOString() });
  }
  return evt;
}

export function deleteEvent(eventId: string): void {
  const idx = eventsStore.findIndex(e => e.id === eventId);
  if (idx !== -1) {
    eventsStore.splice(idx, 1);
  }
}

export function getEventGuestGroups(eventId: string): GuestGroup[] {
  return guestGroupsStore[eventId] || [];
}

export function saveEventGuestGroups(eventId: string, workspaceId: string, groups: Omit<GuestGroup, 'id' | 'created_at' | 'updated_at'>[]): GuestGroup[] {
  const created: GuestGroup[] = groups.map((g, idx) => ({
    ...g,
    id: `gg-${eventId}-${idx + 1}-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  guestGroupsStore[eventId] = created;
  return created;
}
