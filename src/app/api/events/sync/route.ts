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

const DB_FILE = path.join(process.cwd(), '.next', 'server_events_db.json');

function loadDbFromFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (Array.isArray(parsed.events)) globalServerEventsStore = parsed.events;
        if (parsed.groups) globalServerGroupsStore = parsed.groups;
        if (parsed.tables) globalServerTablesStore = parsed.tables;
        if (parsed.assignments) globalServerAssignmentsStore = parsed.assignments;
        if (parsed.cuts) globalServerCutsStore = parsed.cuts;
        if (parsed.checkIns) globalServerCheckInsStore = parsed.checkIns;
        if (parsed.venueElements) globalServerVenueElementsStore = parsed.venueElements;
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
  loadDbFromFile();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  const eventId = searchParams.get('eventId');

  if (eventId) {
    let event = globalServerEventsStore.find(e => e.id === eventId);
    if (!event && workspaceId) {
      event = globalServerEventsStore.find(e => e.workspace_id === workspaceId);
    }

    let groups = globalServerGroupsStore[eventId] || [];
    if (groups.length === 0) {
      const allGroupLists = Object.values(globalServerGroupsStore);
      for (const list of allGroupLists) {
        if (Array.isArray(list) && list.length > 0) {
          if (!workspaceId || list[0]?.workspace_id === workspaceId) {
            groups = list;
            break;
          }
        }
      }
    }

    let tables = globalServerTablesStore[eventId] || [];
    if (tables.length === 0) {
      const allTableLists = Object.values(globalServerTablesStore);
      for (const list of allTableLists) {
        if (Array.isArray(list) && list.length > 0) {
          if (!workspaceId || list[0]?.workspace_id === workspaceId) {
            tables = list;
            break;
          }
        }
      }
    }

    let assignments = globalServerAssignmentsStore[eventId];
    if (assignments === undefined) {
      const allAsgnLists = Object.values(globalServerAssignmentsStore);
      for (const list of allAsgnLists) {
        if (Array.isArray(list) && list.length > 0) {
          if (!workspaceId || list[0]?.workspace_id === workspaceId) {
            assignments = list;
            break;
          }
        }
      }
      if (!assignments) {
        assignments = [
          { id: 'asgn-1', workspace_id: 'ws-a-1111', event_id: eventId, table_id: 'tbl-1', group_id: 'grp-001', assigned_passes: 1, created_at: new Date().toISOString() },
          { id: 'asgn-2', workspace_id: 'ws-a-1111', event_id: eventId, table_id: 'tbl-1', group_id: 'grp-002', assigned_passes: 6, created_at: new Date().toISOString() },
          { id: 'asgn-3', workspace_id: 'ws-a-1111', event_id: eventId, table_id: 'tbl-2', group_id: 'grp-003', assigned_passes: 4, created_at: new Date().toISOString() },
          { id: 'asgn-4', workspace_id: 'ws-a-1111', event_id: eventId, table_id: 'tbl-2', group_id: 'grp-004', assigned_passes: 2, created_at: new Date().toISOString() },
          { id: 'asgn-5', workspace_id: 'ws-a-1111', event_id: eventId, table_id: 'tbl-3', group_id: 'grp-005', assigned_passes: 1, created_at: new Date().toISOString() },
          { id: 'asgn-6', workspace_id: 'ws-a-1111', event_id: eventId, table_id: 'tbl-3', group_id: 'grp-006', assigned_passes: 4, created_at: new Date().toISOString() },
          { id: 'asgn-7', workspace_id: 'ws-a-1111', event_id: eventId, table_id: 'tbl-4', group_id: 'grp-007', assigned_passes: 2, created_at: new Date().toISOString() },
          { id: 'asgn-8', workspace_id: 'ws-a-1111', event_id: eventId, table_id: 'tbl-4', group_id: 'grp-008', assigned_passes: 3, created_at: new Date().toISOString() },
        ];
      }
      globalServerAssignmentsStore[eventId] = assignments;
    }

    let cuts = globalServerCutsStore[eventId] || [];
    if (cuts.length === 0) {
      const allCutLists = Object.values(globalServerCutsStore);
      for (const list of allCutLists) {
        if (Array.isArray(list) && list.length > 0) {
          if (!workspaceId || list[0]?.workspace_id === workspaceId) {
            cuts = list;
            break;
          }
        }
      }
    }

    let checkIns = globalServerCheckInsStore[eventId] || [];
    if (checkIns.length === 0) {
      const allCheckInLists = Object.values(globalServerCheckInsStore);
      for (const list of allCheckInLists) {
        if (Array.isArray(list) && list.length > 0) {
          if (!workspaceId || list[0]?.workspace_id === workspaceId) {
            checkIns = list;
            break;
          }
        }
      }
    }

    let venueElements = globalServerVenueElementsStore[eventId] || [];

    return NextResponse.json({
      success: true,
      event: event || null,
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
    loadDbFromFile();
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

    if (action === 'SYNC_GROUPS' && Array.isArray(groups)) {
      const targetEvtId = eventId || (groups[0]?.event_id) || 'evt-102';
      
      const existingGroups = globalServerGroupsStore[targetEvtId] || [];
      const mergedGroups = groups.map((g: GuestGroup) => {
        const exG = existingGroups.find(e => e.id === g.id);
        const maxCount = Math.max(g.checked_in_count || 0, exG ? (exG.checked_in_count || 0) : 0);
        const status: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO' = maxCount >= g.max_passes ? 'COMPLETO' : maxCount > 0 ? 'PARCIAL' : 'PENDIENTE';
        return { ...g, checked_in_count: maxCount, status };
      });

      existingGroups.forEach((exG: GuestGroup) => {
        if (!mergedGroups.some(mg => mg.id === exG.id)) {
          mergedGroups.push(exG);
        }
      });

      globalServerGroupsStore[targetEvtId] = mergedGroups;

      // Update all key entries in globalServerGroupsStore
      Object.keys(globalServerGroupsStore).forEach(k => {
        globalServerGroupsStore[k] = globalServerGroupsStore[k].map(g => {
          const match = mergedGroups.find(m => m.id === g.id);
          return match || g;
        });
      });

      saveDbToFile();
      return NextResponse.json({ success: true, count: mergedGroups.length });
    }

    if (action === 'SYNC_TABLES' && eventId) {
      if (tables) globalServerTablesStore[eventId] = tables;
      if (assignments) globalServerAssignmentsStore[eventId] = assignments;
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
