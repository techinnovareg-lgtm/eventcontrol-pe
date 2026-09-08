import { getAllAdminAccounts } from './superadmin-store';

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
  credentialsExpiresAt?: string; // Custom expiration or defaults to main client plan expiration
  created_at: string;
}

const STORAGE_KEY = 'eventcontrol_workspace_users';

const INITIAL_DEMO_MEMBERS: WorkspaceMemberUser[] = [];

let membersMemoryStore: WorkspaceMemberUser[] | null = null;

function loadMembersFromStorage(): WorkspaceMemberUser[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_MEMBERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(m => m.id !== 'wm-01' && m.id !== 'wm-02' && m.id !== 'wm-03');
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

function autoSyncMembersToServer() {
  if (typeof window === 'undefined') return;
  try {
    const members = membersMemoryStore || loadMembersFromStorage();
    if (members && members.length > 0) {
      fetch('/api/auth/sync-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC', members }),
      }).catch(() => {});
    }
  } catch (err) {}
}

function getStore(): WorkspaceMemberUser[] {
  if (!membersMemoryStore) {
    membersMemoryStore = loadMembersFromStorage();
    setTimeout(() => autoSyncMembersToServer(), 100);
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
  credentialsExpiresAt?: string;
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

  // Determine expiration date: custom date provided by client OR default to main admin contract end date
  let expiresAt = data.credentialsExpiresAt ? data.credentialsExpiresAt.trim() : undefined;
  if (!expiresAt) {
    const adminAccounts = getAllAdminAccounts();
    const mainAccount = adminAccounts.find(a => a.workspaceId === data.workspaceId);
    if (mainAccount && mainAccount.contractEndDate) {
      expiresAt = mainAccount.contractEndDate;
    } else {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }
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
    credentialsExpiresAt: expiresAt,
    created_at: new Date().toISOString(),
  };

  const updatedStore = [newMember, ...store];
  saveMembersToStorage(updatedStore);

  // Sync with central server API for cross-device access (Mobile phones, PCs, tablets)
  if (typeof window !== 'undefined') {
    fetch('/api/auth/sync-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE', member: newMember }),
    }).catch(err => console.warn('[Sync API dispatch warning]', err));
  }

  return newMember;
}

export function updateWorkspaceMember(
  memberId: string,
  data: Partial<Pick<WorkspaceMemberUser, 'name' | 'email' | 'role' | 'status' | 'initialPassword' | 'credentialsExpiresAt'>>
): WorkspaceMemberUser | undefined {
  const store = getStore();
  const member = store.find(m => m.id === memberId);
  if (!member) return undefined;

  if (data.name) member.name = data.name.trim();
  if (data.email) member.email = data.email.trim().toLowerCase();
  if (data.initialPassword) member.initialPassword = data.initialPassword.trim();
  if (data.status) member.status = data.status;
  if (data.credentialsExpiresAt !== undefined) {
    member.credentialsExpiresAt = data.credentialsExpiresAt ? data.credentialsExpiresAt.trim() : undefined;
  }

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

  if (typeof window !== 'undefined') {
    fetch('/api/auth/sync-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPSERT', member }),
    }).catch(err => console.warn('[Sync API dispatch warning]', err));
  }

  return member;
}

export function deleteWorkspaceMember(memberId: string): boolean {
  const store = getStore();
  const updatedStore = store.filter(m => m.id !== memberId);
  if (updatedStore.length !== store.length) {
    saveMembersToStorage(updatedStore);

    if (typeof window !== 'undefined') {
      fetch('/api/auth/sync-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', memberId }),
      }).catch(err => console.warn('[Sync API dispatch warning]', err));
    }

    return true;
  }
  return false;
}

export function authenticateWorkspaceMember(emailOrUser: string, passwordInput: string): WorkspaceMemberUser | undefined {
  const store = getStore();
  const cleanedInput = emailOrUser.trim().toLowerCase();
  const trimmedPassword = passwordInput.trim();

  return store.find(m => {
    const emailClean = (m.email || '').trim().toLowerCase();
    const nameClean = (m.name || '').trim().toLowerCase();

    // Strict exact match on full email or full name only
    const isMatch = emailClean === cleanedInput || nameClean === cleanedInput;
    if (!isMatch) return false;
    if (m.status !== 'ACTIVO') return false;

    // Enforce credentials expiration
    if (m.credentialsExpiresAt) {
      const expiry = new Date(m.credentialsExpiresAt).getTime();
      if (Date.now() > expiry) return false;
    }

    const expectedPass = (m.initialPassword || 'puerta2026').trim();
    return expectedPass === trimmedPassword || expectedPass.toLowerCase() === trimmedPassword.toLowerCase();
  });
}

/**
 * Async Authentication with Cross-Device Central Server Fallback
 */
export async function authenticateWorkspaceMemberAsync(emailOrUser: string, passwordInput: string): Promise<WorkspaceMemberUser | undefined> {
  // 1. Try local browser localStorage first
  const localMatch = authenticateWorkspaceMember(emailOrUser, passwordInput);
  if (localMatch) return localMatch;

  // 2. Query central server API to fetch collaborator created on another device
  try {
    const url = `/api/auth/sync-members?email=${encodeURIComponent(emailOrUser.trim())}&password=${encodeURIComponent(passwordInput.trim())}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.member) {
        // Save fetched member to local browser storage for offline access
        const store = getStore();
        const exists = store.some(m => m.id === data.member.id);
        if (!exists) {
          const updated = [data.member, ...store];
          saveMembersToStorage(updated);
        }
        return data.member;
      }
    }
  } catch (err) {
    console.warn('[SyncMembers API Query Error]', err);
  }

  return undefined;
}

export function findMemberByEmail(email: string): WorkspaceMemberUser | undefined {
  const store = getStore();
  const clean = email.trim().toLowerCase();
  return store.find(m => (m.email || '').trim().toLowerCase() === clean);
}
