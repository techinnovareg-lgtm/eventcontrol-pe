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

const MEMBERS_DB_FILE = path.join(process.cwd(), '.next', 'server_members_db.json');

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
    fs.writeFileSync(MEMBERS_DB_FILE, JSON.stringify(globalServerMembersStore), 'utf-8');
  } catch (e) {}
}

loadMembersFromFile();

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

      if (m.credentialsExpiresAt) {
        const expiry = new Date(m.credentialsExpiresAt).getTime();
        if (Date.now() > expiry) return false;
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
