import { NextResponse } from 'next/server';
import { Event, GuestGroup, Table, TableAssignment, Cut, CheckIn } from '@/lib/supabase/types';
import { VenueElement } from '@/lib/tables';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import fs from 'fs';
import path from 'path';

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
}

function getSupabaseServerClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
}

import crypto from 'crypto';

function generateDeterministicUUID(keyString: string): string {
  const hash = crypto.createHash('sha256').update(keyString.toLowerCase().trim()).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function fetchOnlineEventsFromSupabase(workspaceId?: string): Promise<Event[]> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return [];
  try {
    let query = `${url}/rest/v1/check_ins?scanner_staff_name=like.SYS_EVENT_SYNC_%25&select=*`;
    if (workspaceId && workspaceId !== 'ALL') {
      if (workspaceId === 'ws-weddingsco-appqsop') {
        query = `${url}/rest/v1/check_ins?scanner_staff_name=in.(SYS_EVENT_SYNC_ws-weddingsco-appqsop,SYS_EVENT_SYNC_ws-appqsopgmailcom)&select=*`;
      } else {
        query = `${url}/rest/v1/check_ins?scanner_staff_name=eq.SYS_EVENT_SYNC_${workspaceId}&select=*`;
      }
    }
    const res = await fetch(query, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        const events = rows.map(r => {
          try { 
            const parsed = JSON.parse(r.device_info); 
            if (parsed && workspaceId && workspaceId === 'ws-weddingsco-appqsop') {
              parsed.workspace_id = 'ws-weddingsco-appqsop';
            }
            return parsed;
          } catch (e) { return null; }
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
              }).filter((e: Event | null) => {
                if (!e) return false;
                if (e.workspace_id === workspaceId) return true;
                if (workspaceId === 'ws-weddingsco-appqsop' && (e.workspace_id === 'ws-appqsopgmailcom' || e.workspace_id === 'ws-a-1111')) {
                  e.workspace_id = 'ws-weddingsco-appqsop';
                  return true;
                }
                return false;
              });
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
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
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
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key || !event || !event.workspace_id) return;
  try {
    const uuid = generateDeterministicUUID(`event_${event.id}`);
    const res = await fetch(`${url}/rest/v1/check_ins`, {
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
    if (!res.ok) {
      // Safe fallback: use PATCH to update record without risking deletion
      await fetch(`${url}/rest/v1/check_ins?id=eq.${uuid}`, {
        method: 'PATCH',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scanner_staff_name: `SYS_EVENT_SYNC_${event.workspace_id}`,
          device_info: JSON.stringify(event)
        })
      }).catch(() => {});
    }
  } catch (err) {}
}

async function fetchOnlineTablesDataFromSupabase(eventId: string): Promise<{
  tables?: Table[];
  assignments?: TableAssignment[];
  groups?: GuestGroup[];
  venueElements?: VenueElement[];
}> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key || !eventId) return {};
  const result: any = {};
  try {
    const uuidTables = generateDeterministicUUID(`tables_${eventId}`);
    const uuidAssignments = generateDeterministicUUID(`assignments_${eventId}`);
    const uuidGroups = generateDeterministicUUID(`groups_${eventId}`);
    const uuidVenue = generateDeterministicUUID(`venue_${eventId}`);

    // Primary: Direct indexed query by Primary Key UUIDs
    const res = await fetch(`${url}/rest/v1/check_ins?id=in.(${uuidTables},${uuidAssignments},${uuidGroups},${uuidVenue})&select=*`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        rows.forEach(r => {
          try {
            const data = JSON.parse(r.device_info);
            if (r.scanner_staff_name === `SYS_TABLES_${eventId}` && !result.tables) result.tables = data;
            if (r.scanner_staff_name === `SYS_ASSIGNMENTS_${eventId}` && !result.assignments) result.assignments = data;
            if (r.scanner_staff_name === `SYS_GROUPS_${eventId}` && !result.groups) result.groups = data;
            if (r.scanner_staff_name === `SYS_VENUE_${eventId}` && !result.venueElements) result.venueElements = data;
          } catch (e) {}
        });
      }
    }

    // Secondary fallback: Query by scanner_staff_name pattern if any missing
    if (!result.tables || !result.assignments || !result.groups || !result.venueElements) {
      const patternRes = await fetch(`${url}/rest/v1/check_ins?scanner_staff_name=like.SYS_%25_${eventId}&select=*&order=scanned_at.desc`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
        cache: 'no-store'
      });
      if (patternRes.ok) {
        const pRows = await patternRes.json();
        if (Array.isArray(pRows)) {
          pRows.forEach(r => {
            try {
              const data = JSON.parse(r.device_info);
              if (r.scanner_staff_name === `SYS_TABLES_${eventId}` && !result.tables) result.tables = data;
              if (r.scanner_staff_name === `SYS_ASSIGNMENTS_${eventId}` && !result.assignments) result.assignments = data;
              if (r.scanner_staff_name === `SYS_GROUPS_${eventId}` && !result.groups) result.groups = data;
              if (r.scanner_staff_name === `SYS_VENUE_${eventId}` && !result.venueElements) result.venueElements = data;
            } catch (e) {}
          });
        }
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
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key || !eventId) return;

  const payloads: any[] = [];
  const nowIso = new Date().toISOString();

  if (tables !== undefined) {
    payloads.push({
      id: generateDeterministicUUID(`tables_${eventId}`),
      scanner_staff_name: `SYS_TABLES_${eventId}`,
      device_info: JSON.stringify(tables),
      scanned_at: nowIso
    });
  }
  if (assignments !== undefined) {
    payloads.push({
      id: generateDeterministicUUID(`assignments_${eventId}`),
      scanner_staff_name: `SYS_ASSIGNMENTS_${eventId}`,
      device_info: JSON.stringify(assignments),
      scanned_at: nowIso
    });
  }
  if (groups !== undefined) {
    payloads.push({
      id: generateDeterministicUUID(`groups_${eventId}`),
      scanner_staff_name: `SYS_GROUPS_${eventId}`,
      device_info: JSON.stringify(groups),
      scanned_at: nowIso
    });
  }
  if (venueElements !== undefined) {
    payloads.push({
      id: generateDeterministicUUID(`venue_${eventId}`),
      scanner_staff_name: `SYS_VENUE_${eventId}`,
      device_info: JSON.stringify(venueElements),
      scanned_at: nowIso
    });
  }

  for (const p of payloads) {
    try {
      const res = await fetch(`${url}/rest/v1/check_ins`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(p)
      });
      if (!res.ok) {
        await fetch(`${url}/rest/v1/check_ins?scanner_staff_name=eq.${p.scanner_staff_name}`, {
          method: 'DELETE',
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        }).catch(() => {});
        await fetch(`${url}/rest/v1/check_ins`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(p)
        }).catch(() => {});
      }
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

const FAKE_EVENT_IDS = [
  'evt-101', 
  'evt-102', 
  'evt-principal-01', 
  'evt-weddingsco-01', 
  'evt-weddingsco-02', 
  'evt-weddingsco-03', 
  'evt-weddingsco-04'
];

const INITIAL_SERVER_EVENTS: Event[] = [];

function loadDbFromFile() {
  if (isDbLoaded) return;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          isDbLoaded = true;
          if (Array.isArray(parsed.deletedEventIds)) {
            globalServerDeletedEventsStore = parsed.deletedEventIds;
          }
          if (Array.isArray(parsed.events)) {
            const fileEvents = parsed.events.filter((e: Event) => 
              !FAKE_EVENT_IDS.includes(e.id) &&
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
            FAKE_EVENT_IDS.forEach(id => delete parsed.groups[id]);
            Object.entries(parsed.groups).forEach(([evtId, grps]) => {
              if (Array.isArray(grps) && grps.length > 0) {
                globalServerGroupsStore[evtId] = grps as GuestGroup[];
              } else if (!globalServerGroupsStore[evtId]) {
                globalServerGroupsStore[evtId] = [];
              }
            });
          }
          if (parsed.tables && typeof parsed.tables === 'object') {
            FAKE_EVENT_IDS.forEach(id => delete parsed.tables[id]);
            Object.entries(parsed.tables).forEach(([evtId, tbls]) => {
              if (Array.isArray(tbls) && tbls.length > 0) {
                globalServerTablesStore[evtId] = tbls as Table[];
              } else if (!globalServerTablesStore[evtId]) {
                globalServerTablesStore[evtId] = [];
              }
            });
          }
          if (parsed.assignments && typeof parsed.assignments === 'object') {
            FAKE_EVENT_IDS.forEach(id => delete parsed.assignments[id]);
            Object.entries(parsed.assignments).forEach(([evtId, asgns]) => {
              if (Array.isArray(asgns) && asgns.length > 0) {
                globalServerAssignmentsStore[evtId] = asgns as TableAssignment[];
              } else if (!globalServerAssignmentsStore[evtId]) {
                globalServerAssignmentsStore[evtId] = [];
              }
            });
          }
          if (parsed.cuts && typeof parsed.cuts === 'object') {
            FAKE_EVENT_IDS.forEach(id => delete parsed.cuts[id]);
            Object.entries(parsed.cuts).forEach(([evtId, cts]) => {
              if (Array.isArray(cts) && cts.length > 0) {
                globalServerCutsStore[evtId] = cts as Cut[];
              } else if (!globalServerCutsStore[evtId]) {
                globalServerCutsStore[evtId] = [];
              }
            });
          }
          if (parsed.checkIns && typeof parsed.checkIns === 'object') {
            FAKE_EVENT_IDS.forEach(id => delete parsed.checkIns[id]);
            Object.entries(parsed.checkIns).forEach(([evtId, chks]) => {
              if (Array.isArray(chks) && chks.length > 0) {
                globalServerCheckInsStore[evtId] = chks as CheckIn[];
              } else if (!globalServerCheckInsStore[evtId]) {
                globalServerCheckInsStore[evtId] = [];
              }
            });
          }
          if (parsed.venueElements && typeof parsed.venueElements === 'object') {
            FAKE_EVENT_IDS.forEach(id => delete parsed.venueElements[id]);
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
    }
  } catch (e) {
    console.warn('[Server DB Load Warning - Retrying on next request]', e);
  }

  // Scrub any lingering fake events from in-memory store
  globalServerEventsStore = globalServerEventsStore.filter(e => !FAKE_EVENT_IDS.includes(e.id));
  FAKE_EVENT_IDS.forEach(fakeId => {
    delete globalServerGroupsStore[fakeId];
    delete globalServerTablesStore[fakeId];
    delete globalServerAssignmentsStore[fakeId];
    delete globalServerCutsStore[fakeId];
    delete globalServerCheckInsStore[fakeId];
    delete globalServerVenueElementsStore[fakeId];
  });
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
  let workspaceId = searchParams.get('workspaceId');
  const eventId = searchParams.get('eventId');
  const email = searchParams.get('email');

  if (!workspaceId && email) {
    if (email.toLowerCase() === 'appqsop@gmail.com') {
      workspaceId = 'ws-weddingsco-appqsop';
    } else if (email.toLowerCase().includes('moral.17')) {
      workspaceId = 'ws-moral17-2026';
    }
  }

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

    // Intelligent Merge: Tables between Online Supabase DB and Server Store
    const localTables = globalServerTablesStore[eventId] || [];
    const onlineTables = onlineData.tables || [];
    const tablesMap = new Map<string, Table>();
    onlineTables.forEach(t => tablesMap.set(t.id, t));
    let serverHasNewerTables = false;
    localTables.forEach(t => {
      const existing = tablesMap.get(t.id);
      if (!existing) {
        tablesMap.set(t.id, t);
        serverHasNewerTables = true;
      } else {
        const timeServer = new Date(t.created_at || 0).getTime();
        const timeOnline = new Date(existing.created_at || 0).getTime();
        if (timeServer >= timeOnline) {
          tablesMap.set(t.id, t);
        }
      }
    });
    const tables = Array.from(tablesMap.values());
    globalServerTablesStore[eventId] = tables;

    // Intelligent Merge: Assignments between Online Supabase DB and Server Store
    const localAssignments = globalServerAssignmentsStore[eventId] || [];
    const onlineAssignments = onlineData.assignments || [];
    const assignmentsMap = new Map<string, TableAssignment>();
    onlineAssignments.forEach(a => {
      const key = `${a.group_id}_${a.companion_id || ''}`;
      assignmentsMap.set(key, a);
    });
    let serverHasNewerAssignments = false;
    localAssignments.forEach(a => {
      const key = `${a.group_id}_${a.companion_id || ''}`;
      const existing = assignmentsMap.get(key);
      if (!existing) {
        assignmentsMap.set(key, a);
        serverHasNewerAssignments = true;
      } else {
        const timeServer = new Date(a.created_at || 0).getTime();
        const timeOnline = new Date(existing.created_at || 0).getTime();
        if (timeServer >= timeOnline) {
          assignmentsMap.set(key, a);
        }
      }
    });
    const assignments = Array.from(assignmentsMap.values());
    globalServerAssignmentsStore[eventId] = assignments;

    // Intelligent Merge: Venue Elements between Online Supabase DB and Server Store
    const localVenue = globalServerVenueElementsStore[eventId] || [];
    const onlineVenue = onlineData.venueElements || [];
    const venueMap = new Map<string, VenueElement>();
    onlineVenue.forEach(ve => venueMap.set(ve.id, ve));
    let serverHasNewerVenue = false;
    localVenue.forEach(ve => {
      const existing = venueMap.get(ve.id);
      if (!existing) {
        venueMap.set(ve.id, ve);
        serverHasNewerVenue = true;
      } else {
        const timeServer = new Date(ve.created_at || 0).getTime();
        const timeOnline = new Date(existing.created_at || 0).getTime();
        if (timeServer >= timeOnline) {
          venueMap.set(ve.id, ve);
        }
      }
    });
    const venueElements = Array.from(venueMap.values());
    globalServerVenueElementsStore[eventId] = venueElements;

    // Intelligent Merge: Groups between Online Supabase DB and Server Store
    const localGroups = globalServerGroupsStore[eventId] || [];
    const onlineGroups = onlineData.groups || [];
    const groupsMap = new Map<string, GuestGroup>();
    onlineGroups.forEach(g => groupsMap.set(g.id, g));
    localGroups.forEach(g => {
      const existing = groupsMap.get(g.id);
      if (!existing) {
        groupsMap.set(g.id, g);
      } else {
        const maxCheckedIn = Math.max(g.checked_in_count || 0, existing.checked_in_count || 0);
        existing.checked_in_count = maxCheckedIn;
        existing.status = maxCheckedIn >= existing.max_passes ? 'COMPLETO' : maxCheckedIn > 0 ? 'PARCIAL' : 'PENDIENTE';
        groupsMap.set(g.id, existing);
      }
    });
    const groups = Array.from(groupsMap.values());
    globalServerGroupsStore[eventId] = groups;

    const localCuts = globalServerCutsStore[eventId] || [];
    const checkIns = globalServerCheckInsStore[eventId] || [];

    // Background push back to Supabase if server store has items missing online
    if (serverHasNewerTables || serverHasNewerAssignments || serverHasNewerVenue) {
      persistTablesDataToSupabase(
        eventId,
        serverHasNewerTables ? tables : undefined,
        serverHasNewerAssignments ? assignments : undefined,
        undefined,
        serverHasNewerVenue ? venueElements : undefined
      ).catch(() => {});
    }

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

    const isWeddingsCo = workspaceId === 'ws-weddingsco-appqsop';
    const localEvents = globalServerEventsStore.filter(e => {
      if (globalServerDeletedEventsStore.includes(e.id) || FAKE_EVENT_IDS.includes(e.id)) return false;
      if (e.workspace_id === workspaceId) return true;
      if (isWeddingsCo && (e.workspace_id === 'ws-appqsopgmailcom' || e.workspace_id === 'ws-a-1111' || e.workspace_id === 'default' || !e.workspace_id)) {
        e.workspace_id = 'ws-weddingsco-appqsop';
        return true;
      }
      return false;
    });
    const mergedEventsMap = new Map<string, Event>();

    onlineEvents.forEach(e => {
      if (!globalServerDeletedEventsStore.includes(e.id) && !FAKE_EVENT_IDS.includes(e.id)) {
        if (isWeddingsCo) e.workspace_id = 'ws-weddingsco-appqsop';
        mergedEventsMap.set(e.id, e);
      }
    });
    supabaseEvents.forEach(e => {
      if (!globalServerDeletedEventsStore.includes(e.id) && !FAKE_EVENT_IDS.includes(e.id)) {
        if (isWeddingsCo) e.workspace_id = 'ws-weddingsco-appqsop';
        mergedEventsMap.set(e.id, e);
      }
    });
    localEvents.forEach(e => {
      if (!globalServerDeletedEventsStore.includes(e.id) && !FAKE_EVENT_IDS.includes(e.id)) {
        if (isWeddingsCo) e.workspace_id = 'ws-weddingsco-appqsop';
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
    if (!globalServerDeletedEventsStore.includes(e.id) && !FAKE_EVENT_IDS.includes(e.id)) {
      mergedAllMap.set(e.id, e);
    }
  });

  globalServerEventsStore.forEach(e => {
    if (!globalServerDeletedEventsStore.includes(e.id) && !FAKE_EVENT_IDS.includes(e.id)) {
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

    if (action === 'SYNC_ALL_EVENTS' && Array.isArray(body.events)) {
      const incomingEvents: Event[] = body.events;
      for (const ev of incomingEvents) {
        if (!globalServerDeletedEventsStore.includes(ev.id) && !FAKE_EVENT_IDS.includes(ev.id)) {
          const idx = globalServerEventsStore.findIndex(e => e.id === ev.id);
          if (idx !== -1) {
            globalServerEventsStore[idx] = { ...globalServerEventsStore[idx], ...ev };
          } else {
            globalServerEventsStore.unshift(ev);
          }
          await persistEventToSupabase(ev);
        }
      }
      saveDbToFile();
      return NextResponse.json({ success: true, count: incomingEvents.length });
    }

    if (action === 'SYNC_EVENT' && event) {
      if (globalServerDeletedEventsStore.includes(event.id) || FAKE_EVENT_IDS.includes(event.id)) {
        return NextResponse.json({ success: false, message: 'Evento inválido o eliminado' });
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

      const url = getSupabaseUrl();
      const key = getSupabaseAnonKey();
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
      const existingTables = globalServerTablesStore[eventId] || [];
      const existingAssignments = globalServerAssignmentsStore[eventId] || [];

      let finalTables: Table[] | undefined = undefined;
      let finalAssignments: TableAssignment[] | undefined = undefined;

      if (Array.isArray(tables)) {
        if (tables.length === 0 && existingTables.length > 0) {
          finalTables = existingTables;
        } else {
          const tblMap = new Map<string, Table>();
          existingTables.forEach(et => tblMap.set(et.id, et));
          tables.forEach(nt => tblMap.set(nt.id, nt));
          finalTables = Array.from(tblMap.values());
          globalServerTablesStore[eventId] = finalTables;
        }
      }

      if (Array.isArray(assignments)) {
        if (assignments.length === 0 && existingAssignments.length > 0) {
          finalAssignments = existingAssignments;
        } else {
          const asgnMap = new Map<string, TableAssignment>();
          existingAssignments.forEach(ea => {
            const key = `${ea.group_id}_${ea.companion_id || ''}`;
            asgnMap.set(key, ea);
          });
          assignments.forEach(na => {
            const key = `${na.group_id}_${na.companion_id || ''}`;
            asgnMap.set(key, na);
          });
          finalAssignments = Array.from(asgnMap.values());
          globalServerAssignmentsStore[eventId] = finalAssignments;
        }
      }

      saveDbToFile();
      await persistTablesDataToSupabase(
        eventId,
        finalTables,
        finalAssignments,
        undefined,
        undefined
      );
      return NextResponse.json({ success: true, preservedTables: existingTables.length, preservedAssignments: existingAssignments.length });
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
      const existingElements = globalServerVenueElementsStore[eventId] || [];
      let finalElements = venueElements;

      if (venueElements.length === 0 && existingElements.length > 0) {
        finalElements = existingElements;
      } else {
        const veMap = new Map<string, VenueElement>();
        existingElements.forEach(ve => veMap.set(ve.id, ve));
        venueElements.forEach(ve => veMap.set(ve.id, ve));
        finalElements = Array.from(veMap.values());
        globalServerVenueElementsStore[eventId] = finalElements;
      }

      saveDbToFile();
      await persistTablesDataToSupabase(eventId, undefined, undefined, undefined, finalElements);
      return NextResponse.json({ success: true, count: finalElements.length });
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
