import { NextResponse } from 'next/server';
import { Event, GuestGroup, Table, TableAssignment, Cut, CheckIn } from '@/lib/supabase/types';
import { VenueElement } from '@/lib/tables';
import fs from 'fs';
import path from 'path';

// Global central server-side memory stores for cross-device synchronization (PC <-> Mobile Phone)
let globalServerEventsStore: Event[] = [];
let globalServerGroupsStore: Record<string, GuestGroup[]> = {};
let globalServerTablesStore: Record<string, Table[]> = {};
let globalServerAssignmentsStore: Record<string, TableAssignment[]> = {};
let globalServerCutsStore: Record<string, Cut[]> = {};
let globalServerCheckInsStore: Record<string, CheckIn[]> = {};
let globalServerVenueElementsStore: Record<string, VenueElement[]> = {};

const DB_FILE = path.join(process.cwd(), 'data', 'server_events_db.json');

function loadDbFromFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (Array.isArray(parsed.events)) {
          const fileEvents = parsed.events.filter((e: Event) => e.id !== 'evt-101' && e.id !== 'evt-102' && e.id !== 'evt-principal-01');
          fileEvents.forEach((fe: Event) => {
            const idx = globalServerEventsStore.findIndex(e => e.id === fe.id);
            if (idx !== -1) {
              globalServerEventsStore[idx] = { ...fe, ...globalServerEventsStore[idx] };
            } else {
              globalServerEventsStore.push(fe);
            }
          });
        }
        if (parsed.groups) {
          delete parsed.groups['evt-101'];
          delete parsed.groups['evt-102'];
          delete parsed.groups['evt-principal-01'];
          globalServerGroupsStore = { ...globalServerGroupsStore, ...parsed.groups };
        }
        if (parsed.tables) {
          delete parsed.tables['evt-101'];
          delete parsed.tables['evt-102'];
          delete parsed.tables['evt-principal-01'];
          globalServerTablesStore = { ...globalServerTablesStore, ...parsed.tables };
        }
        if (parsed.assignments) {
          delete parsed.assignments['evt-101'];
          delete parsed.assignments['evt-102'];
          delete parsed.assignments['evt-principal-01'];
          globalServerAssignmentsStore = { ...globalServerAssignmentsStore, ...parsed.assignments };
        }
        if (parsed.cuts) {
          delete parsed.cuts['evt-101'];
          delete parsed.cuts['evt-102'];
          delete parsed.cuts['evt-principal-01'];
          globalServerCutsStore = { ...globalServerCutsStore, ...parsed.cuts };
        }
        if (parsed.checkIns) {
          delete parsed.checkIns['evt-101'];
          delete parsed.checkIns['evt-102'];
          delete parsed.checkIns['evt-principal-01'];
          globalServerCheckInsStore = { ...globalServerCheckInsStore, ...parsed.checkIns };
        }
        if (parsed.venueElements) {
          delete parsed.venueElements['evt-101'];
          delete parsed.venueElements['evt-102'];
          delete parsed.venueElements['evt-principal-01'];
          globalServerVenueElementsStore = { ...globalServerVenueElementsStore, ...parsed.venueElements };
        }
      }
    }
  } catch (e) {}
}

function saveDbToFile() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify({
      events: globalServerEventsStore,
      groups: globalServerGroupsStore,
      tables: globalServerTablesStore,
      assignments: globalServerAssignmentsStore,
      cuts: globalServerCutsStore,
      checkIns: globalServerCheckInsStore,
      venueElements: globalServerVenueElementsStore,
    }), 'utf-8');
  } catch (e) {}
}

// Initial load on server startup
loadDbFromFile();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  const eventId = searchParams.get('eventId');

  if (eventId) {
    const event = globalServerEventsStore.find(e => e.id === eventId) || null;
    const groups = globalServerGroupsStore[eventId] || [];
    const tables = globalServerTablesStore[eventId] || [];
    const assignments = globalServerAssignmentsStore[eventId] || [];
    const cuts = globalServerCutsStore[eventId] || [];
    const checkIns = globalServerCheckInsStore[eventId] || [];
    const venueElements = globalServerVenueElementsStore[eventId] || [];

    return NextResponse.json({
      success: true,
      event,
      groups,
      tables,
      assignments,
      cuts,
      checkIns,
      venueElements,
    });
  }

  if (workspaceId) {
    const events = globalServerEventsStore.filter(e => e.workspace_id === workspaceId);
    return NextResponse.json({
      success: true,
      events,
    });
  }

  return NextResponse.json({
    success: true,
    events: globalServerEventsStore,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, event, eventId, workspaceId, groups, tables, assignments, cuts, checkIn, venueElements } = body;

    if (action === 'SYNC_EVENT' && event) {
      const idx = globalServerEventsStore.findIndex(e => e.id === event.id);
      if (idx !== -1) {
        globalServerEventsStore[idx] = { ...globalServerEventsStore[idx], ...event };
      } else {
        globalServerEventsStore.unshift(event);
      }
      saveDbToFile();
      return NextResponse.json({ success: true, event });
    }

    if (action === 'SYNC_GROUPS' && Array.isArray(groups) && (eventId || groups[0]?.event_id)) {
      const targetEvtId = eventId || groups[0].event_id;
      
      const existingGroups = globalServerGroupsStore[targetEvtId] || [];
      const mergedGroups = groups.map((g: GuestGroup) => {
        const exG = existingGroups.find(e => e.id === g.id);
        const maxCount = Math.max(g.checked_in_count || 0, exG ? (exG.checked_in_count || 0) : 0);
        const status: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO' = maxCount >= g.max_passes ? 'COMPLETO' : maxCount > 0 ? 'PARCIAL' : 'PENDIENTE';
        return { ...g, checked_in_count: maxCount, status };
      });

      globalServerGroupsStore[targetEvtId] = mergedGroups;
      saveDbToFile();
      return NextResponse.json({ success: true, count: mergedGroups.length });
    }

    if (action === 'DELETE_GROUPS' && eventId) {
      delete globalServerGroupsStore[eventId];
      if (globalServerAssignmentsStore[eventId]) {
        globalServerAssignmentsStore[eventId] = [];
      }
      saveDbToFile();
      return NextResponse.json({ success: true, eventId });
    }

    if (action === 'DELETE_EVENT' && eventId) {
      globalServerEventsStore = globalServerEventsStore.filter(e => e.id !== eventId);
      delete globalServerGroupsStore[eventId];
      delete globalServerTablesStore[eventId];
      delete globalServerAssignmentsStore[eventId];
      delete globalServerCutsStore[eventId];
      delete globalServerCheckInsStore[eventId];
      delete globalServerVenueElementsStore[eventId];
      saveDbToFile();
      return NextResponse.json({ success: true, deletedEventId: eventId });
    }

    if (action === 'SYNC_TABLES' && eventId) {
      if (Array.isArray(tables)) {
        globalServerTablesStore[eventId] = tables;
      }
      if (Array.isArray(assignments)) {
        globalServerAssignmentsStore[eventId] = assignments;
      }
      saveDbToFile();
      return NextResponse.json({ success: true });
    }

    if (action === 'SYNC_CUTS' && eventId && Array.isArray(cuts)) {
      globalServerCutsStore[eventId] = cuts;
      saveDbToFile();
      return NextResponse.json({ success: true, count: cuts.length });
    }

    if (action === 'SYNC_CHECKINS' && eventId && checkIn) {
      if (!globalServerCheckInsStore[eventId]) globalServerCheckInsStore[eventId] = [];
      const exists = globalServerCheckInsStore[eventId].some(c => c.id === checkIn.id);
      if (!exists) {
        globalServerCheckInsStore[eventId].unshift(checkIn);
      }
      saveDbToFile();
      return NextResponse.json({ success: true });
    }

    if (action === 'SYNC_VENUE_ELEMENTS' && eventId && Array.isArray(venueElements)) {
      globalServerVenueElementsStore[eventId] = venueElements;
      saveDbToFile();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
