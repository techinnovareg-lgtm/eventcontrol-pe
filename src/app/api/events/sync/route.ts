import { NextResponse } from 'next/server';
import { Event, GuestGroup, Table, TableAssignment, Cut, CheckIn } from '@/lib/supabase/types';
import { VenueElement } from '@/lib/tables';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
}

import crypto from 'crypto';

function generateDeterministicUUID(keyString: string): string {
  const hash = crypto.createHash('sha256').update(keyString.toLowerCase().trim()).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function fetchOnlineEventsFromSupabase(workspaceId?: string): Promise<Event[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    let query = `${url}/rest/v1/check_ins?scanner_staff_name=like.SYS_EVENT_SYNC_%25&select=*`;
    if (workspaceId && workspaceId !== 'ALL') {
      query = `${url}/rest/v1/check_ins?scanner_staff_name=eq.SYS_EVENT_SYNC_${workspaceId}&select=*`;
    }
    const res = await fetch(query, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        const events = rows.map(r => {
          try { return JSON.parse(r.device_info); } catch (e) { return null; }
        }).filter(Boolean);

        if (workspaceId && workspaceId !== 'ALL' && events.length > 0) {
          return events;
        }

        // If specific workspaceId returned 0, fallback to search across all SYS_EVENT_SYNC_
        if (workspaceId && workspaceId !== 'ALL' && events.length === 0) {
          const fallbackRes = await fetch(`${url}/rest/v1/check_ins?scanner_staff_name=like.SYS_EVENT_SYNC_%25&select=*`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
            cache: 'no-store'
          });
          if (fallbackRes.ok) {
            const fallbackRows = await fallbackRes.json();
            if (Array.isArray(fallbackRows)) {
              return fallbackRows.map(r => {
                try { return JSON.parse(r.device_info); } catch (e) { return null; }
              }).filter((e: Event | null) => e && e.workspace_id === workspaceId);
            }
          }
        }

        return events;
      }
    }
  } catch (err) {}
  return [];
}

async function fetchOnlineEventByIdFromSupabase(eventId: string): Promise<Event | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !eventId) return null;
  try {
    const uuid = generateDeterministicUUID(`event_${eventId}`);
    const res = await fetch(`${url}/rest/v1/check_ins?id=eq.${uuid}&select=*`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]?.device_info) {
        try { return JSON.parse(rows[0].device_info); } catch (e) {}
      }
    }

    // Fallback search across all SYS_EVENT_SYNC_
    const allRes = await fetch(`${url}/rest/v1/check_ins?scanner_staff_name=like.SYS_EVENT_SYNC_%25&select=*`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    });
    if (allRes.ok) {
      const allRows = await allRes.json();
      if (Array.isArray(allRows)) {
        for (const r of allRows) {
          try {
            const ev = JSON.parse(r.device_info);
            if (ev && ev.id === eventId) return ev;
          } catch (e) {}
        }
      }
    }
  } catch (err) {}
  return null;
}

async function persistEventToSupabase(event: Event) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !event || !event.workspace_id) return;
  try {
    const uuid = generateDeterministicUUID(`event_${event.id}`);
    await fetch(`${url}/rest/v1/check_ins`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: uuid,
        scanner_staff_name: `SYS_EVENT_SYNC_${event.workspace_id}`,
        device_info: JSON.stringify(event)
      })
    });
  } catch (err) {}
}

async function fetchOnlineTablesDataFromSupabase(eventId: string): Promise<{
  tables?: Table[];
  assignments?: TableAssignment[];
  groups?: GuestGroup[];
  venueElements?: VenueElement[];
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !eventId) return {};
  const result: any = {};
  try {
    const res = await fetch(`${url}/rest/v1/check_ins?scanner_staff_name=in.(SYS_TABLES_${eventId},SYS_ASSIGNMENTS_${eventId},SYS_GROUPS_${eventId},SYS_VENUE_${eventId})&select=*`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        rows.forEach(r => {
          try {
            const data = JSON.parse(r.device_info);
            if (r.scanner_staff_name === `SYS_TABLES_${eventId}`) result.tables = data;
            if (r.scanner_staff_name === `SYS_ASSIGNMENTS_${eventId}`) result.assignments = data;
            if (r.scanner_staff_name === `SYS_GROUPS_${eventId}`) result.groups = data;
            if (r.scanner_staff_name === `SYS_VENUE_${eventId}`) result.venueElements = data;
          } catch (e) {}
        });
      }
    }
  } catch (err) {}
  return result;
}

async function persistTablesDataToSupabase(
  eventId: string,
  tables?: Table[],
  assignments?: TableAssignment[],
  groups?: GuestGroup[],
  venueElements?: VenueElement[]
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !eventId) return;

  const payloads: any[] = [];
  if (tables !== undefined) {
    payloads.push({
      id: generateDeterministicUUID(`tables_${eventId}`),
      scanner_staff_name: `SYS_TABLES_${eventId}`,
      device_info: JSON.stringify(tables)
    });
  }
  if (assignments !== undefined) {
    payloads.push({
      id: generateDeterministicUUID(`assignments_${eventId}`),
      scanner_staff_name: `SYS_ASSIGNMENTS_${eventId}`,
      device_info: JSON.stringify(assignments)
    });
  }
  if (groups !== undefined) {
    payloads.push({
      id: generateDeterministicUUID(`groups_${eventId}`),
      scanner_staff_name: `SYS_GROUPS_${eventId}`,
      device_info: JSON.stringify(groups)
    });
  }
  if (venueElements !== undefined) {
    payloads.push({
      id: generateDeterministicUUID(`venue_${eventId}`),
      scanner_staff_name: `SYS_VENUE_${eventId}`,
      device_info: JSON.stringify(venueElements)
    });
  }

  for (const p of payloads) {
    try {
      await fetch(`${url}/rest/v1/check_ins`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(p)
      });
    } catch (e) {}
  }
}

// Global central server-side memory stores for cross-device synchronization (PC <-> Mobile Phone)
let globalServerEventsStore: Event[] = [];
let globalServerDeletedEventsStore: string[] = [];
let globalServerGroupsStore: Record<string, GuestGroup[]> = {};
let globalServerTablesStore: Record<string, Table[]> = {};
let globalServerAssignmentsStore: Record<string, TableAssignment[]> = {};
let globalServerCutsStore: Record<string, Cut[]> = {};
let globalServerCheckInsStore: Record<string, CheckIn[]> = {};
let globalServerVenueElementsStore: Record<string, VenueElement[]> = {};

const DB_FILE = path.join(process.cwd(), 'data', 'server_events_db.json');
const TEMP_DB_FILE = path.join(process.cwd(), 'data', 'server_events_db.json.tmp');

let isDbLoaded = false;

function loadDbFromFile() {
  if (isDbLoaded) return;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      if (!raw || raw.trim().length === 0) return; // Skip if file is empty mid-write
      const parsed = JSON.parse(raw);
      if (parsed) {
        isDbLoaded = true;
        if (Array.isArray(parsed.deletedEventIds)) {
          globalServerDeletedEventsStore = parsed.deletedEventIds;
        }
        if (Array.isArray(parsed.events)) {
          const fileEvents = parsed.events.filter((e: Event) => 
            e.id !== 'evt-101' && 
            e.id !== 'evt-102' && 
            e.id !== 'evt-principal-01' &&
            !globalServerDeletedEventsStore.includes(e.id)
          );
          fileEvents.forEach((fe: Event) => {
            const idx = globalServerEventsStore.findIndex(e => e.id === fe.id);
            if (idx !== -1) {
              globalServerEventsStore[idx] = { ...fe, ...globalServerEventsStore[idx] };
            } else {
              globalServerEventsStore.push(fe);
            }
          });
        }
        if (parsed.groups && typeof parsed.groups === 'object') {
          delete parsed.groups['evt-101'];
          delete parsed.groups['evt-102'];
          delete parsed.groups['evt-principal-01'];
          Object.entries(parsed.groups).forEach(([evtId, grps]) => {
            if (Array.isArray(grps) && grps.length > 0) {
              globalServerGroupsStore[evtId] = grps as GuestGroup[];
            } else if (!globalServerGroupsStore[evtId]) {
              globalServerGroupsStore[evtId] = [];
            }
          });
        }
        if (parsed.tables && typeof parsed.tables === 'object') {
          delete parsed.tables['evt-101'];
          delete parsed.tables['evt-102'];
          delete parsed.tables['evt-principal-01'];
          Object.entries(parsed.tables).forEach(([evtId, tbls]) => {
            if (Array.isArray(tbls) && tbls.length > 0) {
              globalServerTablesStore[evtId] = tbls as Table[];
            } else if (!globalServerTablesStore[evtId]) {
              globalServerTablesStore[evtId] = [];
            }
          });
        }
        if (parsed.assignments && typeof parsed.assignments === 'object') {
          delete parsed.assignments['evt-101'];
          delete parsed.assignments['evt-102'];
          delete parsed.assignments['evt-principal-01'];
          Object.entries(parsed.assignments).forEach(([evtId, asgns]) => {
            if (Array.isArray(asgns) && asgns.length > 0) {
              globalServerAssignmentsStore[evtId] = asgns as TableAssignment[];
            } else if (!globalServerAssignmentsStore[evtId]) {
              globalServerAssignmentsStore[evtId] = [];
            }
          });
        }
        if (parsed.cuts && typeof parsed.cuts === 'object') {
          delete parsed.cuts['evt-101'];
          delete parsed.cuts['evt-102'];
          delete parsed.cuts['evt-principal-01'];
          Object.entries(parsed.cuts).forEach(([evtId, cts]) => {
            if (Array.isArray(cts) && cts.length > 0) {
              globalServerCutsStore[evtId] = cts as Cut[];
            } else if (!globalServerCutsStore[evtId]) {
              globalServerCutsStore[evtId] = [];
            }
          });
        }
        if (parsed.checkIns && typeof parsed.checkIns === 'object') {
          delete parsed.checkIns['evt-101'];
          delete parsed.checkIns['evt-102'];
          delete parsed.checkIns['evt-principal-01'];
          Object.entries(parsed.checkIns).forEach(([evtId, chks]) => {
            if (Array.isArray(chks) && chks.length > 0) {
              globalServerCheckInsStore[evtId] = chks as CheckIn[];
            } else if (!globalServerCheckInsStore[evtId]) {
              globalServerCheckInsStore[evtId] = [];
            }
          });
        }
        if (parsed.venueElements && typeof parsed.venueElements === 'object') {
          delete parsed.venueElements['evt-101'];
          delete parsed.venueElements['evt-102'];
          delete parsed.venueElements['evt-principal-01'];
          Object.entries(parsed.venueElements).forEach(([evtId, elems]) => {
            if (Array.isArray(elems) && elems.length > 0) {
              globalServerVenueElementsStore[evtId] = elems as VenueElement[];
            } else if (!globalServerVenueElementsStore[evtId]) {
              globalServerVenueElementsStore[evtId] = [];
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn('[Server DB Load Warning - Retrying on next request]', e);
  }
}

function saveDbToFile() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const content = JSON.stringify({
      events: globalServerEventsStore,
      deletedEventIds: globalServerDeletedEventsStore,
      groups: globalServerGroupsStore,
      tables: globalServerTablesStore,
      assignments: globalServerAssignmentsStore,
      cuts: globalServerCutsStore,
      checkIns: globalServerCheckInsStore,
      venueElements: globalServerVenueElementsStore,
    }, null, 2);
    // Write to temp file first
    fs.writeFileSync(TEMP_DB_FILE, content, 'utf-8');
    
    // Windows OS compatible atomic file replacement
    try {
      if (fs.existsSync(DB_FILE)) {
        try { fs.unlinkSync(DB_FILE); } catch (e) {}
      }
      fs.renameSync(TEMP_DB_FILE, DB_FILE);
    } catch (renameErr) {
      // Fallback for Windows file lock constraints
      fs.copyFileSync(TEMP_DB_FILE, DB_FILE);
      try { fs.unlinkSync(TEMP_DB_FILE); } catch (e) {}
    }
  } catch (e) {
    console.warn('[Server DB Save Error]', e);
  }
}

// Initial load on server startup
loadDbFromFile();

export async function GET(req: Request) {
  loadDbFromFile();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  const eventId = searchParams.get('eventId');

  if (eventId) {
    if (globalServerDeletedEventsStore.includes(eventId)) {
      return NextResponse.json({ success: false, message: 'Evento eliminado' }, { status: 404 });
    }
    
    // Fetch Online Supabase DB Tables, Assignments, Groups, Venue Elements, and Event
    const [onlineData, onlineEvent] = await Promise.all([
      fetchOnlineTablesDataFromSupabase(eventId),
      fetchOnlineEventByIdFromSupabase(eventId),
    ]);

    const event = onlineEvent || globalServerEventsStore.find(e => e.id === eventId) || null;
    if (event && !globalServerEventsStore.some(e => e.id === event.id)) {
      globalServerEventsStore.unshift(event);
    }

    const groups = onlineData.groups || globalServerGroupsStore[eventId] || [];
    const tables = onlineData.tables || globalServerTablesStore[eventId] || [];
    const assignments = onlineData.assignments || globalServerAssignmentsStore[eventId] || [];
    const venueElements = onlineData.venueElements || globalServerVenueElementsStore[eventId] || [];
    const localCuts = globalServerCutsStore[eventId] || [];
    const checkIns = globalServerCheckInsStore[eventId] || [];

    // Sync back to memory store
    if (onlineData.groups) globalServerGroupsStore[eventId] = onlineData.groups;
    if (onlineData.tables) globalServerTablesStore[eventId] = onlineData.tables;
    if (onlineData.assignments) globalServerAssignmentsStore[eventId] = onlineData.assignments;
    if (onlineData.venueElements) globalServerVenueElementsStore[eventId] = onlineData.venueElements;

    // Fetch cuts from Supabase if available and merge
    let supabaseCuts: Cut[] = [];
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('cuts').select('*').eq('event_id', eventId);
        if (!error && Array.isArray(data)) {
          supabaseCuts = data as Cut[];
        }
      } catch (err) {
        console.warn('[Sync Route] Supabase cuts fetch warning', err);
      }
    }

    const mergedCutsMap = new Map<string, Cut>();
    supabaseCuts.forEach(c => mergedCutsMap.set(c.id, c));
    localCuts.forEach(c => mergedCutsMap.set(c.id, c));
    const cuts = Array.from(mergedCutsMap.values());
    cuts.sort((a, b) => new Date(b.cut_timestamp || b.created_at || 0).getTime() - new Date(a.cut_timestamp || a.created_at || 0).getTime());
    globalServerCutsStore[eventId] = cuts;

    return NextResponse.json({
      success: true,
      event,
      groups,
      tables,
      assignments,
      cuts,
      checkIns,
      venueElements,
      deletedEventIds: globalServerDeletedEventsStore,
    });
  }

  if (workspaceId) {
    // Fetch Online Supabase DB Events
    const onlineEvents = await fetchOnlineEventsFromSupabase(workspaceId);

    let supabaseEvents: Event[] = [];
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('events').select('*').eq('workspace_id', workspaceId);
        if (!error && Array.isArray(data)) {
          supabaseEvents = data as Event[];
        }
      } catch (err) {
        console.warn('[Sync Route] Supabase events fetch warning', err);
      }
    }

    const localEvents = globalServerEventsStore.filter(e => e.workspace_id === workspaceId && !globalServerDeletedEventsStore.includes(e.id));
    const mergedEventsMap = new Map<string, Event>();

    onlineEvents.forEach(e => {
      if (!globalServerDeletedEventsStore.includes(e.id)) {
        mergedEventsMap.set(e.id, e);
      }
    });
    supabaseEvents.forEach(e => {
      if (!globalServerDeletedEventsStore.includes(e.id)) {
        mergedEventsMap.set(e.id, e);
      }
    });
    localEvents.forEach(e => {
      if (!globalServerDeletedEventsStore.includes(e.id)) {
        mergedEventsMap.set(e.id, e);
      }
    });

    const events = Array.from(mergedEventsMap.values());
    events.sort((a, b) => new Date(b.created_at || b.event_date || 0).getTime() - new Date(a.created_at || a.event_date || 0).getTime());

    // Update global server store with merged events
    events.forEach(evt => {
      const idx = globalServerEventsStore.findIndex(x => x.id === evt.id);
      if (idx !== -1) {
        globalServerEventsStore[idx] = { ...globalServerEventsStore[idx], ...evt };
      } else {
        globalServerEventsStore.unshift(evt);
      }
    });

    return NextResponse.json({
      success: true,
      events,
      deletedEventIds: globalServerDeletedEventsStore,
    });
  }

  // If no specific workspaceId provided, fetch all online events from Supabase
  const onlineAll = await fetchOnlineEventsFromSupabase();
  const mergedAllMap = new Map<string, Event>();

  onlineAll.forEach(e => {
    if (!globalServerDeletedEventsStore.includes(e.id)) {
      mergedAllMap.set(e.id, e);
    }
  });

  globalServerEventsStore.forEach(e => {
    if (!globalServerDeletedEventsStore.includes(e.id)) {
      mergedAllMap.set(e.id, e);
    }
  });

  const sortedAll = Array.from(mergedAllMap.values()).sort(
    (a, b) => new Date(b.created_at || b.event_date || 0).getTime() - new Date(a.created_at || a.event_date || 0).getTime()
  );

  return NextResponse.json({
    success: true,
    events: sortedAll,
    deletedEventIds: globalServerDeletedEventsStore,
  });
}

export async function POST(req: Request) {
  try {
    loadDbFromFile();
    const body = await req.json();
    const { action, event, eventId, workspaceId, groups, tables, assignments, cuts, checkIn, venueElements } = body;

    if (action === 'SYNC_EVENT' && event) {
      if (globalServerDeletedEventsStore.includes(event.id)) {
        return NextResponse.json({ success: false, message: 'Evento fue eliminado previamente' });
      }
      const idx = globalServerEventsStore.findIndex(e => e.id === event.id);
      if (idx !== -1) {
        globalServerEventsStore[idx] = { ...globalServerEventsStore[idx], ...event };
      } else {
        globalServerEventsStore.unshift(event);
      }
      saveDbToFile();
      await persistEventToSupabase(event);
      return NextResponse.json({ success: true, event });
    }

    if (action === 'SYNC_GROUPS' && Array.isArray(groups) && (eventId || groups[0]?.event_id)) {
      const targetEvtId = eventId || groups[0].event_id;
      
      const existingGroups = globalServerGroupsStore[targetEvtId] || [];

      // Protect against empty groups payload wiping existing server groups store
      if (groups.length === 0 && existingGroups.length > 0) {
        return NextResponse.json({ success: true, count: existingGroups.length, preserved: true });
      }

      const mergedGroups = [...groups];
      existingGroups.forEach(exG => {
        if (!mergedGroups.some(g => g.id === exG.id)) {
          mergedGroups.push(exG);
        }
      });

      mergedGroups.forEach((g: GuestGroup) => {
        const exG = existingGroups.find(e => e.id === g.id);
        const maxCount = Math.max(g.checked_in_count || 0, exG ? (exG.checked_in_count || 0) : 0);
        g.checked_in_count = maxCount;
        g.status = maxCount >= g.max_passes ? 'COMPLETO' : maxCount > 0 ? 'PARCIAL' : 'PENDIENTE';
      });

      globalServerGroupsStore[targetEvtId] = mergedGroups;
      saveDbToFile();
      await persistTablesDataToSupabase(targetEvtId, undefined, undefined, mergedGroups, undefined);
      return NextResponse.json({ success: true, count: mergedGroups.length });
    }

    if (action === 'DELETE_GROUPS' && eventId) {
      delete globalServerGroupsStore[eventId];
      if (globalServerAssignmentsStore[eventId]) {
        globalServerAssignmentsStore[eventId] = [];
      }
      saveDbToFile();
      await persistTablesDataToSupabase(eventId, undefined, [], [], undefined);
      return NextResponse.json({ success: true, eventId });
    }

    if (action === 'DELETE_EVENT' && eventId) {
      if (!globalServerDeletedEventsStore.includes(eventId)) {
        globalServerDeletedEventsStore.push(eventId);
      }
      globalServerEventsStore = globalServerEventsStore.filter(e => e.id !== eventId);
      delete globalServerGroupsStore[eventId];
      delete globalServerTablesStore[eventId];
      delete globalServerAssignmentsStore[eventId];
      delete globalServerCutsStore[eventId];
      delete globalServerCheckInsStore[eventId];
      delete globalServerVenueElementsStore[eventId];
      saveDbToFile();

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const uuid = generateDeterministicUUID(`event_${eventId}`);
        fetch(`${url}/rest/v1/check_ins?id=eq.${uuid}`, {
          method: 'DELETE',
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        }).catch(() => {});
        fetch(`${url}/rest/v1/check_ins?scanner_staff_name=in.(SYS_TABLES_${eventId},SYS_ASSIGNMENTS_${eventId},SYS_GROUPS_${eventId},SYS_VENUE_${eventId})`, {
          method: 'DELETE',
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        }).catch(() => {});
      }
      return NextResponse.json({ success: true, deletedEventId: eventId });
    }

    if (action === 'DELETE_TABLE' && eventId && body.tableId) {
      if (globalServerTablesStore[eventId]) {
        globalServerTablesStore[eventId] = globalServerTablesStore[eventId].filter(t => t.id !== body.tableId);
      }
      if (globalServerAssignmentsStore[eventId]) {
        globalServerAssignmentsStore[eventId] = globalServerAssignmentsStore[eventId].filter(a => a.table_id !== body.tableId);
      }
      saveDbToFile();
      await persistTablesDataToSupabase(
        eventId,
        globalServerTablesStore[eventId] || [],
        globalServerAssignmentsStore[eventId] || [],
        undefined,
        undefined
      );
      return NextResponse.json({ success: true, tableId: body.tableId });
    }

    if (action === 'DELETE_VENUE_ELEMENT' && eventId && body.elementId) {
      if (globalServerVenueElementsStore[eventId]) {
        globalServerVenueElementsStore[eventId] = globalServerVenueElementsStore[eventId].filter(ve => ve.id !== body.elementId);
      }
      saveDbToFile();
      await persistTablesDataToSupabase(eventId, undefined, undefined, undefined, globalServerVenueElementsStore[eventId] || []);
      return NextResponse.json({ success: true, elementId: body.elementId });
    }

    if (action === 'UNASSIGN_GROUP' && eventId && body.groupId) {
      if (globalServerAssignmentsStore[eventId]) {
        globalServerAssignmentsStore[eventId] = globalServerAssignmentsStore[eventId].filter(a => a.group_id !== body.groupId);
      }
      saveDbToFile();
      await persistTablesDataToSupabase(eventId, undefined, globalServerAssignmentsStore[eventId] || [], undefined, undefined);
      return NextResponse.json({ success: true, groupId: body.groupId });
    }

    if (action === 'SYNC_TABLES' && eventId) {
      if (Array.isArray(tables)) {
        globalServerTablesStore[eventId] = tables;
      }

      if (Array.isArray(assignments)) {
        globalServerAssignmentsStore[eventId] = assignments;
      }
      saveDbToFile();
      await persistTablesDataToSupabase(
        eventId,
        Array.isArray(tables) ? tables : undefined,
        Array.isArray(assignments) ? assignments : undefined,
        undefined,
        undefined
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'SYNC_CUTS' && eventId && Array.isArray(cuts)) {
      const existingCuts = globalServerCutsStore[eventId] || [];
      const mergedCuts = [...cuts];
      existingCuts.forEach((exC: Cut) => {
        if (!mergedCuts.some(c => c.id === exC.id)) {
          mergedCuts.push(exC);
        }
      });
      mergedCuts.sort((a, b) => new Date(b.cut_timestamp || b.created_at || 0).getTime() - new Date(a.cut_timestamp || a.created_at || 0).getTime());
      globalServerCutsStore[eventId] = mergedCuts;
      saveDbToFile();

      // Async upsert to Supabase cuts table
      const supabase = getSupabaseServerClient();
      if (supabase && mergedCuts.length > 0) {
        try {
          await supabase.from('cuts').upsert(mergedCuts, { onConflict: 'id' });
        } catch (err) {
          console.warn('[Sync Route] Supabase cuts upsert warning', err);
        }
      }

      return NextResponse.json({ success: true, count: mergedCuts.length });
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
      if (venueElements.length > 0) {
        if (!globalServerVenueElementsStore[eventId]) globalServerVenueElementsStore[eventId] = [];
        const currentElems = globalServerVenueElementsStore[eventId];
        venueElements.forEach((ve: VenueElement) => {
          const idx = currentElems.findIndex(x => x.id === ve.id);
          if (idx !== -1) {
            currentElems[idx] = { ...currentElems[idx], ...ve };
          } else {
            currentElems.push(ve);
          }
        });
      }
      saveDbToFile();
      await persistTablesDataToSupabase(eventId, undefined, undefined, undefined, globalServerVenueElementsStore[eventId]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
