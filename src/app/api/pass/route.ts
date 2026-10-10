import { NextResponse } from 'next/server';
import { Event, GuestGroup, Table, TableAssignment } from '@/lib/supabase/types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import { generateDeterministicTokenString, extractTokenFromInput } from '@/lib/qr-engine';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
}

function generateDeterministicUUID(keyString: string): string {
  const hash = crypto.createHash('sha256').update(keyString.toLowerCase().trim()).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const DB_FILE = path.join(process.cwd(), 'data', 'events-db.json');

function loadLocalFileDb(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return null;
}

function matchGroupWithToken(g: GuestGroup, cleanToken: string): boolean {
  if (!g || !cleanToken) return false;
  const tokenClean = cleanToken.trim();
  const tokenLower = tokenClean.toLowerCase();
  if (g.id === tokenClean) return true;
  if (generateDeterministicTokenString(g.id) === tokenClean) return true;
  if (g.external_id && g.external_id.toLowerCase().trim() === tokenLower) return true;
  if (g.group_name && g.group_name.toLowerCase().trim() === tokenLower) return true;
  if (g.responsible_phone) {
    const p1 = g.responsible_phone.replace(/\D/g, '');
    const p2 = tokenClean.replace(/\D/g, '');
    if (p1 && p2 && (p1 === p2 || p1.endsWith(p2) || p2.endsWith(p1))) return true;
  }
  return false;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawToken = searchParams.get('token') || '';
  let eventId = searchParams.get('event') || searchParams.get('eventId') || '';

  const cleanToken = extractTokenFromInput(rawToken);
  if (!cleanToken) {
    return NextResponse.json(
      { success: false, message: 'Parámetro de pase o token no especificado' },
      { status: 400 }
    );
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const localDb = loadLocalFileDb();

  let targetEvent: Event | null = null;
  let targetGroup: GuestGroup | null = null;
  let targetTables: Table[] = [];
  let targetAssignments: TableAssignment[] = [];

  // 1. Try to find the group and event from Supabase Online DB
  if (url && key) {
    try {
      // If eventId is known, direct lookup
      if (eventId) {
        const uuidEvent = generateDeterministicUUID(`event_${eventId}`);
        const uuidTables = generateDeterministicUUID(`tables_${eventId}`);
        const uuidAssignments = generateDeterministicUUID(`assignments_${eventId}`);
        const uuidGroups = generateDeterministicUUID(`groups_${eventId}`);

        const res = await fetch(
          `${url}/rest/v1/check_ins?id=in.(${uuidEvent},${uuidTables},${uuidAssignments},${uuidGroups})&select=*`,
          {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            cache: 'no-store',
          }
        );

        let groupsList: GuestGroup[] = [];

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows)) {
            rows.forEach((r: any) => {
              try {
                const data = JSON.parse(r.device_info);
                if (r.scanner_staff_name?.startsWith('SYS_EVENT_SYNC_') && !targetEvent) {
                  targetEvent = data;
                } else if (r.scanner_staff_name === `SYS_TABLES_${eventId}`) {
                  targetTables = data;
                } else if (r.scanner_staff_name === `SYS_ASSIGNMENTS_${eventId}`) {
                  targetAssignments = data;
                } else if (r.scanner_staff_name === `SYS_GROUPS_${eventId}`) {
                  groupsList = data;
                }
              } catch (e) {}
            });

            targetGroup = groupsList.find((g) => matchGroupWithToken(g, cleanToken)) || null;
          }
        }

        // Secondary fallback for this event if tables, assignments, or groups not found by direct UUID
        if (!targetGroup || targetTables.length === 0 || targetAssignments.length === 0) {
          const patternRes = await fetch(
            `${url}/rest/v1/check_ins?scanner_staff_name=like.SYS_%25_${eventId}&select=*&order=scanned_at.desc`,
            {
              headers: { apikey: key, Authorization: `Bearer ${key}` },
              cache: 'no-store',
            }
          );
          if (patternRes.ok) {
            const pRows = await patternRes.json();
            if (Array.isArray(pRows)) {
              pRows.forEach((r: any) => {
                try {
                  const data = JSON.parse(r.device_info);
                  if (r.scanner_staff_name === `SYS_TABLES_${eventId}` && targetTables.length === 0) {
                    targetTables = data;
                  } else if (r.scanner_staff_name === `SYS_ASSIGNMENTS_${eventId}` && targetAssignments.length === 0) {
                    targetAssignments = data;
                  } else if (r.scanner_staff_name === `SYS_GROUPS_${eventId}` && !targetGroup) {
                    const matched = (data as GuestGroup[]).find((g) => matchGroupWithToken(g, cleanToken));
                    if (matched) targetGroup = matched;
                  }
                } catch (e) {}
              });
            }
          }
        }
      }

      // If group not found yet or eventId was not supplied, scan groups across Supabase
      if (!targetGroup) {
        const allGroupsRes = await fetch(
          `${url}/rest/v1/check_ins?scanner_staff_name=like.SYS_GROUPS_%25&select=*&order=scanned_at.desc`,
          {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            cache: 'no-store',
          }
        );

        if (allGroupsRes.ok) {
          const gRows = await allGroupsRes.json();
          if (Array.isArray(gRows)) {
            for (const r of gRows) {
              try {
                const gList: GuestGroup[] = JSON.parse(r.device_info);
                if (Array.isArray(gList)) {
                  const match = gList.find((g) => matchGroupWithToken(g, cleanToken));
                  if (match) {
                    targetGroup = match;
                    eventId = match.event_id;
                    break;
                  }
                }
              } catch (e) {}
            }
          }
        }

        // If we found the group and eventId, fetch the event and table details
        if (targetGroup && eventId) {
          const uuidEvent = generateDeterministicUUID(`event_${eventId}`);
          const uuidTables = generateDeterministicUUID(`tables_${eventId}`);
          const uuidAssignments = generateDeterministicUUID(`assignments_${eventId}`);

          const res = await fetch(
            `${url}/rest/v1/check_ins?id=in.(${uuidEvent},${uuidTables},${uuidAssignments})&select=*`,
            {
              headers: { apikey: key, Authorization: `Bearer ${key}` },
              cache: 'no-store',
            }
          );
          if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) {
              rows.forEach((r: any) => {
                try {
                  const data = JSON.parse(r.device_info);
                  if (r.scanner_staff_name?.startsWith('SYS_EVENT_SYNC_') && !targetEvent) {
                    targetEvent = data;
                  } else if (r.scanner_staff_name === `SYS_TABLES_${eventId}`) {
                    targetTables = data;
                  } else if (r.scanner_staff_name === `SYS_ASSIGNMENTS_${eventId}`) {
                    targetAssignments = data;
                  }
                } catch (e) {}
              });
            }
          }
        }
      }
    } catch (onlineErr) {
      console.warn('[Online Pass Supabase Fetch Warning]', onlineErr);
    }
  }

  // 2. Secondary Contingency: Check Server Local DB (data/events-db.json)
  if (!targetGroup && localDb) {
    if (localDb.groups) {
      for (const [evtId, gList] of Object.entries<GuestGroup[]>(localDb.groups)) {
        if (Array.isArray(gList)) {
          const match = gList.find((g) => matchGroupWithToken(g, cleanToken));
          if (match) {
            targetGroup = match;
            eventId = evtId;
            break;
          }
        }
      }
    }

    if (eventId) {
      if (!targetEvent && localDb.events) {
        targetEvent = (localDb.events as Event[]).find((e) => e.id === eventId) || null;
      }
      if (targetTables.length === 0 && localDb.tables && localDb.tables[eventId]) {
        targetTables = localDb.tables[eventId];
      }
      if (targetAssignments.length === 0 && localDb.assignments && localDb.assignments[eventId]) {
        targetAssignments = localDb.assignments[eventId];
      }
    }
  }

  // If still no event found, scan across all events in Supabase
  if (targetGroup && !targetEvent && url && key) {
    try {
      const allEvtsRes = await fetch(
        `${url}/rest/v1/check_ins?scanner_staff_name=like.SYS_EVENT_SYNC_%25&select=*`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          cache: 'no-store',
        }
      );
      if (allEvtsRes.ok) {
        const rows = await allEvtsRes.json();
        if (Array.isArray(rows)) {
          for (const r of rows) {
            try {
              const ev = JSON.parse(r.device_info);
              if (ev && ev.id === targetGroup.event_id) {
                targetEvent = ev;
                break;
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }

  if (!targetGroup) {
    return NextResponse.json(
      { success: false, message: 'Invitación o pase digital no encontrado' },
      { status: 404 }
    );
  }

  // 3. Resolve Assigned Table Name
  let tableName = 'Sin Mesa Asignada';
  let tableCapacity: number | null = null;
  const groupAssignment = targetAssignments.find((a) => a.group_id === targetGroup!.id);
  if (groupAssignment) {
    const tbl = targetTables.find((t) => t.id === groupAssignment.table_id);
    if (tbl) {
      tableName = tbl.name;
      tableCapacity = tbl.capacity;
    }
  }

  // Fallback Event Details if event record was partial
  const resolvedEvent = targetEvent || {
    id: targetGroup.event_id,
    workspace_id: targetGroup.workspace_id,
    name: 'Evento Oficial',
    event_type: 'Evento Social',
    event_date: new Date().toISOString().split('T')[0],
    event_time: 'Por confirmar',
    venue_name: 'Salón Principal',
    status: 'ACTIVO',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json({
    success: true,
    event: {
      id: resolvedEvent.id,
      name: resolvedEvent.name,
      event_type: resolvedEvent.event_type || 'Evento',
      event_date: resolvedEvent.event_date,
      event_time: resolvedEvent.event_time || '',
      venue_name: resolvedEvent.venue_name || 'Salón Principal',
      venue_address: resolvedEvent.venue_address || (resolvedEvent as any).address || '',
      google_maps_url: resolvedEvent.google_maps_url || (resolvedEvent as any).maps_url || '',
    },
    group: {
      id: targetGroup.id,
      group_name: targetGroup.group_name,
      responsible_phone: targetGroup.responsible_phone || '',
      max_passes: targetGroup.max_passes,
      checked_in_count: targetGroup.checked_in_count || 0,
      status: targetGroup.status,
      companions: targetGroup.companions || [],
    },
    tableName,
    tableCapacity,
    token: cleanToken,
  });
}
