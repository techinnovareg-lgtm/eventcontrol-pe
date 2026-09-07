export type WorkspaceUserRole = 'OWNER' | 'ADMIN' | 'COORDINADOR' | 'OPERATOR';

export interface WorkspaceMemberUser {
  id: string;
  workspaceId: string;
  eventId?: string;
  name: string;
  email: string;
  role: WorkspaceUserRole;
  roleLabel: string;
  permissionsScope: string;
  status: 'ACTIVO' | 'INACTIVO';
  initialPassword?: string;
  created_at: string;
}

const STORAGE_KEY = 'eventcontrol_workspace_users';

const INITIAL_DEMO_MEMBERS: WorkspaceMemberUser[] = [
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

let membersMemoryStore: WorkspaceMemberUser[] | null = null;

function loadMembersFromStorage(): WorkspaceMemberUser[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_MEMBERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[WorkspaceUsersStore] Failed to load from localStorage', err);
  }
  saveMembersToStorage(INITIAL_DEMO_MEMBERS);
  return INITIAL_DEMO_MEMBERS;
}

function saveMembersToStorage(members: WorkspaceMemberUser[]) {
  membersMemoryStore = members;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    } catch (err) {
      console.warn('[WorkspaceUsersStore] Failed to save to localStorage', err);
    }
  }
}

function getStore(): WorkspaceMemberUser[] {
  if (!membersMemoryStore) {
    membersMemoryStore = loadMembersFromStorage();
  }
  return membersMemoryStore;
}

export function getWorkspaceMembers(workspaceId: string): WorkspaceMemberUser[] {
  const store = getStore();
  return store.filter(m => m.workspaceId === workspaceId);
}

export function getEventMembers(eventId: string, workspaceId?: string): WorkspaceMemberUser[] {
  const store = getStore();
  if (workspaceId) {
    return store.filter(m => m.eventId === eventId || (m.workspaceId === workspaceId && !m.eventId));
  }
  return store.filter(m => m.eventId === eventId);
}

export function createWorkspaceMember(data: {
  workspaceId: string;
  eventId?: string;
  name: string;
  email: string;
  password?: string;
  role: WorkspaceUserRole;
}): WorkspaceMemberUser {
  const store = getStore();
  const cleanedEmail = data.email.trim().toLowerCase();

  let roleLabel = 'COORDINADOR';
  let permissionsScope = 'Edición de eventos, invitados y listas';

  if (data.role === 'OWNER') {
    roleLabel = 'PROPIETARIO';
    permissionsScope = 'Acceso total, facturación, usuarios y eventos';
  } else if (data.role === 'ADMIN') {
    roleLabel = 'ADMINISTRADOR';
    permissionsScope = 'Administración completa de eventos y equipo';
  } else if (data.role === 'OPERATOR') {
    roleLabel = 'SEGURIDAD (Puerta)';
    permissionsScope = 'Escaneo de QR y registro de check-in únicamente';
  }

  const newMember: WorkspaceMemberUser = {
    id: `wm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    workspaceId: data.workspaceId,
    eventId: data.eventId,
    name: data.name.trim(),
    email: cleanedEmail,
    role: data.role,
    roleLabel,
    permissionsScope,
    status: 'ACTIVO',
    initialPassword: data.password || 'puerta2026',
    created_at: new Date().toISOString(),
  };

  const updatedStore = [newMember, ...store];
  saveMembersToStorage(updatedStore);
  return newMember;
}

export function updateWorkspaceMember(
  memberId: string,
  data: Partial<Pick<WorkspaceMemberUser, 'name' | 'email' | 'role' | 'status' | 'initialPassword'>>
): WorkspaceMemberUser | undefined {
  const store = getStore();
  const member = store.find(m => m.id === memberId);
  if (!member) return undefined;

  if (data.name) member.name = data.name.trim();
  if (data.email) member.email = data.email.trim().toLowerCase();
  if (data.initialPassword) member.initialPassword = data.initialPassword.trim();
  if (data.status) member.status = data.status;

  if (data.role) {
    member.role = data.role;
    if (data.role === 'OWNER') {
      member.roleLabel = 'PROPIETARIO';
      member.permissionsScope = 'Acceso total, facturación, usuarios y eventos';
    } else if (data.role === 'ADMIN') {
      member.roleLabel = 'ADMINISTRADOR';
      member.permissionsScope = 'Administración completa de eventos y equipo';
    } else if (data.role === 'OPERATOR') {
      member.roleLabel = 'SEGURIDAD (Puerta)';
      member.permissionsScope = 'Escaneo de QR y registro de check-in únicamente';
    } else {
      member.roleLabel = 'COORDINADOR';
      member.permissionsScope = 'Edición de eventos, invitados y listas';
    }
  }

  saveMembersToStorage(store);
  return member;
}

export function deleteWorkspaceMember(memberId: string): boolean {
  const store = getStore();
  const updatedStore = store.filter(m => m.id !== memberId);
  if (updatedStore.length !== store.length) {
    saveMembersToStorage(updatedStore);
    return true;
  }
  return false;
}

export function authenticateWorkspaceMember(email: string, passwordInput: string): WorkspaceMemberUser | undefined {
  const store = getStore();
  const cleanedEmail = email.trim().toLowerCase();
  const trimmedPassword = passwordInput.trim();
  
  return store.find(m => 
    m.email.toLowerCase() === cleanedEmail && 
    m.status === 'ACTIVO' &&
    (m.initialPassword ? m.initialPassword === trimmedPassword : trimmedPassword === 'puerta2026')
  );
}
