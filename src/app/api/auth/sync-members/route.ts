import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface WorkspaceMemberUser {
  id: string;
  workspaceId: string;
  eventId?: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'COORDINADOR' | 'OPERATOR';
  roleLabel: string;
  permissionsScope: string;
  status: 'ACTIVO' | 'INACTIVO';
  initialPassword?: string;
  credentialsExpiresAt?: string;
  created_at: string;
}

// Global server-side memory store for sub-users and door operators across devices
let globalServerMembersStore: WorkspaceMemberUser[] = [];

const MEMBERS_DB_FILE = path.join(process.cwd(), 'data', 'server_members_db.json');
const TMP_MEMBERS_DB_FILE = path.join(os.tmpdir(), 'server_members_db.json');

async function fetchOnlineMembersFromSupabase(): Promise<WorkspaceMemberUser[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/check_ins?scanner_staff_name=eq.SYS_MEMBER_SYNC&select=*`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        return rows.map(r => {
          try { return JSON.parse(r.device_info); } catch (e) { return null; }
        }).filter(Boolean);
      }
    }
  } catch (err) {}
  return [];
}

import crypto from 'crypto';

function generateDeterministicUUID(keyString: string): string {
  const hash = crypto.createHash('sha256').update(keyString.toLowerCase().trim()).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function persistMemberToSupabase(member: WorkspaceMemberUser) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    const uuid = generateDeterministicUUID(`member_${member.id}_${member.email}`);
    
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
        scanner_staff_name: 'SYS_MEMBER_SYNC',
        device_info: JSON.stringify(member)
      })
    });
    if (!res.ok) {
      await fetch(`${url}/rest/v1/check_ins?id=eq.${uuid}`, {
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
        body: JSON.stringify({
          id: uuid,
          scanner_staff_name: 'SYS_MEMBER_SYNC',
          device_info: JSON.stringify(member)
        })
      });
    }
  } catch (err) {}
}

function loadMembersFromFile() {
  try {
    const targetFile = fs.existsSync(MEMBERS_DB_FILE) 
      ? MEMBERS_DB_FILE 
      : (fs.existsSync(TMP_MEMBERS_DB_FILE) ? TMP_MEMBERS_DB_FILE : null);

    if (targetFile) {
      const raw = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalServerMembersStore = parsed;
      }
    }
  } catch (e) {}
}

function saveMembersToFile() {
  const content = JSON.stringify(globalServerMembersStore, null, 2);

  try {
    const dir = path.dirname(MEMBERS_DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${MEMBERS_DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, content, 'utf-8');
    try {
      if (fs.existsSync(MEMBERS_DB_FILE)) fs.unlinkSync(MEMBERS_DB_FILE);
      fs.renameSync(tempFile, MEMBERS_DB_FILE);
    } catch {
      fs.copyFileSync(tempFile, MEMBERS_DB_FILE);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  } catch (e) {}

  try {
    fs.writeFileSync(TMP_MEMBERS_DB_FILE, content, 'utf-8');
  } catch (e) {}
}

loadMembersFromFile();

function isCredentialsExpired(expiresAtIso?: string): boolean {
  if (!expiresAtIso || !expiresAtIso.trim()) return false;
  try {
    const cleanStr = expiresAtIso.trim();
    const datePart = cleanStr.split('T')[0];
    const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const endOfDayLocal = new Date(year, month, day, 23, 59, 59, 999).getTime();
      return Date.now() > endOfDayLocal;
    }
    const expTime = new Date(cleanStr).getTime();
    if (!isNaN(expTime)) return Date.now() > expTime;
  } catch (e) {}
  return false;
}

export async function GET(req: Request) {
  loadMembersFromFile();
  
  // Merge Online Supabase DB members
  const onlineMembers = await fetchOnlineMembersFromSupabase();
  onlineMembers.forEach(om => {
    const idx = globalServerMembersStore.findIndex(m => m.id === om.id || (om.email && m.email && m.email.toLowerCase() === om.email.toLowerCase()));
    if (idx !== -1) {
      globalServerMembersStore[idx] = { ...globalServerMembersStore[idx], ...om };
    } else {
      globalServerMembersStore.unshift(om);
    }
  });

  const { searchParams } = new URL(req.url);
  const emailOrUser = searchParams.get('email') || searchParams.get('user');
  const password = searchParams.get('password');

  if (emailOrUser && password) {
    const cleanedInput = emailOrUser.trim().toLowerCase();
    const trimmedPass = password.trim();

    let found = globalServerMembersStore.find(m => {
      const emailClean = (m.email || '').trim().toLowerCase();
      const nameClean = (m.name || '').trim().toLowerCase();

      const isMatch = emailClean === cleanedInput || nameClean === cleanedInput;
      if (!isMatch || m.status !== 'ACTIVO') return false;

      if (m.credentialsExpiresAt && isCredentialsExpired(m.credentialsExpiresAt)) {
        return false;
      }

      const expectedPass = (m.initialPassword || 'puerta2026').trim();
      return expectedPass === trimmedPass;
    });

    // Fallback: If member not in local memory, check Supabase Auth Authority
    if (!found && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
        const sbRes = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: cleanedInput, password: trimmedPass })
        });
        const sbData = await sbRes.json();

        if (sbData.access_token || sbData.user || sbData.error_code === 'email_not_confirmed') {
          const userMeta = sbData.user?.user_metadata || {};
          found = {
            id: sbData.user?.id || `usr-mb-${Date.now()}`,
            workspaceId: userMeta.workspaceId || 'ws-a-1111',
            eventId: userMeta.eventId,
            name: userMeta.name || userMeta.companyName || 'Colaborador',
            email: cleanedInput,
            role: userMeta.role === 'OPERATOR' ? 'OPERATOR' : 'ADMIN',
            roleLabel: userMeta.role === 'OPERATOR' ? 'Operador de Puerta' : 'Administrador',
            permissionsScope: userMeta.permissionsScope || 'Acceso Estándar',
            status: 'ACTIVO',
            initialPassword: trimmedPass,
            created_at: sbData.user?.created_at || new Date().toISOString()
          };
          globalServerMembersStore.unshift(found);
          saveMembersToFile();
          persistMemberToSupabase(found);
        }
      } catch (err) {
        console.warn('[Sync Members Route - Supabase Auth Check Warning]', err);
      }
    }

    if (found) {
      return NextResponse.json({ success: true, member: found });
    } else {
      return NextResponse.json({ success: false, message: 'Miembro o clave no coincide' }, { status: 401 });
    }
  }

  if (emailOrUser) {
    const cleanedInput = emailOrUser.trim().toLowerCase();
    const found = globalServerMembersStore.find(m => {
      const emailClean = (m.email || '').trim().toLowerCase();
      const nameClean = (m.name || '').trim().toLowerCase();
      return emailClean === cleanedInput || nameClean === cleanedInput;
    });

    if (found) {
      return NextResponse.json({ success: true, member: found });
    } else {
      return NextResponse.json({ success: false, message: 'Miembro no encontrado' }, { status: 404 });
    }
  }

  return NextResponse.json({ success: true, members: globalServerMembersStore });
}

export async function POST(req: Request) {
  try {
    loadMembersFromFile();
    const body = await req.json();
    if (body.action === 'CREATE' || body.action === 'UPSERT') {
      const member: WorkspaceMemberUser = body.member;
      if (member && member.email) {
        const idx = globalServerMembersStore.findIndex(m => m.id === member.id || m.email.toLowerCase() === member.email.toLowerCase());
        if (idx !== -1) {
          globalServerMembersStore[idx] = { ...globalServerMembersStore[idx], ...member };
        } else {
          globalServerMembersStore.unshift(member);
        }
        saveMembersToFile();
        await persistMemberToSupabase(member);
      }
    } else if (body.action === 'DELETE') {
      const memberId = body.memberId;
      if (memberId) {
        globalServerMembersStore = globalServerMembersStore.filter(m => m.id !== memberId);
        saveMembersToFile();
      }
    } else if (body.action === 'SYNC') {
      const members: WorkspaceMemberUser[] = body.members || [];
      for (const m of members) {
        const idx = globalServerMembersStore.findIndex(x => x.id === m.id || x.email.toLowerCase() === m.email.toLowerCase());
        if (idx !== -1) {
          globalServerMembersStore[idx] = { ...globalServerMembersStore[idx], ...m };
        } else {
          globalServerMembersStore.unshift(m);
        }
        await persistMemberToSupabase(m);
      }
      saveMembersToFile();
    }

    return NextResponse.json({ success: true, members: globalServerMembersStore });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
