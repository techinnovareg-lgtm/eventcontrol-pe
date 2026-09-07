import { NextResponse } from 'next/server';

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
  created_at: string;
}

// Global server-side memory store for sub-users and door operators across devices
let globalServerMembersStore: WorkspaceMemberUser[] = [
  {
    id: 'wm-01',
    workspaceId: 'ws-a-1111',
    eventId: 'evt-102',
    name: 'Ana María Gamarra',
    email: 'ana@amgweddings.pe',
    role: 'OWNER',
    roleLabel: 'PROPIETARIO',
    permissionsScope: 'Acceso total, facturación, usuarios y eventos',
    status: 'ACTIVO',
    initialPassword: 'EventControl2026!',
    created_at: new Date().toISOString(),
  },
  {
    id: 'wm-02',
    workspaceId: 'ws-a-1111',
    eventId: 'evt-102',
    name: 'Carlos Pérez',
    email: 'carlos@amgweddings.pe',
    role: 'COORDINADOR',
    roleLabel: 'COORDINADOR',
    permissionsScope: 'Edición de eventos, invitados, mesas y cortes',
    status: 'ACTIVO',
    initialPassword: 'coordinador2026',
    created_at: new Date().toISOString(),
  },
  {
    id: 'wm-03',
    workspaceId: 'ws-a-1111',
    eventId: 'evt-102',
    name: 'Puerta Principal 1',
    email: 'puerta1@amgweddings.pe',
    role: 'OPERATOR',
    roleLabel: 'SEGURIDAD (Puerta)',
    permissionsScope: 'Escaneo de QR y registro de check-in únicamente',
    status: 'ACTIVO',
    initialPassword: 'puerta2026',
    created_at: new Date().toISOString(),
  },
];

export async function GET(req: Request) {
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

      const expectedPass = (m.initialPassword || 'puerta2026').trim();
      return expectedPass === trimmedPass || expectedPass.toLowerCase() === trimmedPass.toLowerCase();
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
      }
    } else if (body.action === 'DELETE') {
      const memberId = body.memberId;
      if (memberId) {
        globalServerMembersStore = globalServerMembersStore.filter(m => m.id !== memberId);
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
    }

    return NextResponse.json({ success: true, members: globalServerMembersStore });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
