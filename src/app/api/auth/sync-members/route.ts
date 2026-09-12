import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

function loadMembersFromFile() {
  try {
    if (fs.existsSync(MEMBERS_DB_FILE)) {
      const raw = fs.readFileSync(MEMBERS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalServerMembersStore = parsed;
      }
    }
  } catch (e) {}
}

function saveMembersToFile() {
  try {
    const dir = path.dirname(MEMBERS_DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${MEMBERS_DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempFile, JSON.stringify(globalServerMembersStore, null, 2), 'utf-8');
    try {
      if (fs.existsSync(MEMBERS_DB_FILE)) fs.unlinkSync(MEMBERS_DB_FILE);
      fs.renameSync(tempFile, MEMBERS_DB_FILE);
    } catch {
      fs.copyFileSync(tempFile, MEMBERS_DB_FILE);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  } catch (e) {
    console.error('[saveMembersToFile Error]', e);
  }
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
  const { searchParams } = new URL(req.url);
  const emailOrUser = searchParams.get('email') || searchParams.get('user');
  const password = searchParams.get('password');

  if (emailOrUser && password) {
    const cleanedInput = emailOrUser.trim().toLowerCase();
    const trimmedPass = password.trim();

    const found = globalServerMembersStore.find(m => {
      const emailClean = (m.email || '').trim().toLowerCase();
      const nameClean = (m.name || '').trim().toLowerCase();

      const isMatch = emailClean === cleanedInput || nameClean === cleanedInput;
      if (!isMatch || m.status !== 'ACTIVO') return false;

      if (m.credentialsExpiresAt && isCredentialsExpired(m.credentialsExpiresAt)) {
        return false;
      }

      const expectedPass = (m.initialPassword || 'puerta2026').trim();
      return expectedPass === trimmedPass || expectedPass.toLowerCase() === trimmedPass.toLowerCase();
    });

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
      }
    } else if (body.action === 'DELETE') {
      const memberId = body.memberId;
      if (memberId) {
        globalServerMembersStore = globalServerMembersStore.filter(m => m.id !== memberId);
        saveMembersToFile();
      }
    } else if (body.action === 'SYNC') {
      const members: WorkspaceMemberUser[] = body.members || [];
      members.forEach(m => {
        const idx = globalServerMembersStore.findIndex(x => x.id === m.id || x.email.toLowerCase() === m.email.toLowerCase());
        if (idx !== -1) {
          globalServerMembersStore[idx] = { ...globalServerMembersStore[idx], ...m };
        } else {
          globalServerMembersStore.unshift(m);
        }
      });
      saveMembersToFile();
    }

    return NextResponse.json({ success: true, members: globalServerMembersStore });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
