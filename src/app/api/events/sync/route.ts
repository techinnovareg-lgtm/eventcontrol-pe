import { NextResponse } from 'next/server';
import { Event, GuestGroup, Table, TableAssignment } from '@/lib/supabase/types';
import fs from 'fs';
import path from 'path';

// Global central server-side memory stores for cross-device synchronization (PC <-> Mobile Phone)
let globalServerEventsStore: Event[] = [];
let globalServerGroupsStore: Record<string, GuestGroup[]> = {};
let globalServerTablesStore: Record<string, Table[]> = {};
let globalServerAssignmentsStore: Record<string, TableAssignment[]> = {};

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
    const event = globalServerEventsStore.find(e => e.id === eventId);
    let groups = globalServerGroupsStore[eventId] || [];

    // Fallback: If no groups under exact eventId, check if groups exist under any key or workspace
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

    const tables = globalServerTablesStore[eventId] || [];
    const assignments = globalServerAssignmentsStore[eventId] || [];

    return NextResponse.json({
      success: true,
      event: event || null,
      groups,
      tables,
      assignments,
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
    const { action, event, eventId, workspaceId, groups, tables, assignments } = body;

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

    if (action === 'SYNC_GROUPS' && eventId && groups) {
      globalServerGroupsStore[eventId] = groups;
      saveDbToFile();
      return NextResponse.json({ success: true, count: groups.length });
    }

    if (action === 'SYNC_TABLES' && eventId) {
      if (tables) globalServerTablesStore[eventId] = tables;
      if (assignments) globalServerAssignmentsStore[eventId] = assignments;
      saveDbToFile();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
