import { NextResponse } from 'next/server';
import { Event, GuestGroup, Table, TableAssignment } from '@/lib/supabase/types';

// Global central server-side memory stores for cross-device synchronization (PC <-> Mobile Phone)
let globalServerEventsStore: Event[] = [];
let globalServerGroupsStore: Record<string, GuestGroup[]> = {};
let globalServerTablesStore: Record<string, Table[]> = {};
let globalServerAssignmentsStore: Record<string, TableAssignment[]> = {};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  const eventId = searchParams.get('eventId');

  if (eventId) {
    const event = globalServerEventsStore.find(e => e.id === eventId);
    const groups = globalServerGroupsStore[eventId] || [];
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
    const body = await req.json();
    const { action, event, eventId, workspaceId, groups, tables, assignments } = body;

    if (action === 'SYNC_EVENT' && event) {
      const idx = globalServerEventsStore.findIndex(e => e.id === event.id);
      if (idx !== -1) {
        globalServerEventsStore[idx] = { ...globalServerEventsStore[idx], ...event };
      } else {
        globalServerEventsStore.unshift(event);
      }
      return NextResponse.json({ success: true, event });
    }

    if (action === 'SYNC_GROUPS' && eventId && groups) {
      globalServerGroupsStore[eventId] = groups;
      return NextResponse.json({ success: true, count: groups.length });
    }

    if (action === 'SYNC_TABLES' && eventId) {
      if (tables) globalServerTablesStore[eventId] = tables;
      if (assignments) globalServerAssignmentsStore[eventId] = assignments;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
