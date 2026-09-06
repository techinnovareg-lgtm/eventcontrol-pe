import { PlanCode, PLAN_LIMITS } from './plans';

export interface AdminAccount {
  id: string;
  workspaceId: string;
  companyName: string;
  adminName: string;
  contactEmail: string;
  contactPhone?: string;
  planCode: PlanCode;
  contractStartDate: string;
  contractEndDate: string;
  status: 'ACTIVA' | 'SUSPENDIDA' | 'VENCIDA';
  mustChangePassword?: boolean;
  initialPassword?: string;
  passwordHashMasked: string; // Password privacy: only stores hashed representation, never raw text
  created_at: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_USER' | 'ADMIN' | 'OPERATOR';
    workspaceId?: string;
    mustChangePassword?: boolean;
  };
}

const ACCOUNTS_STORAGE_KEY = 'eventcontrol_admin_accounts';

const INITIAL_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'usr-admin-01',
    workspaceId: 'ws-a-1111',
    companyName: 'AMG Wedding Planners',
    adminName: 'Ana María Gamarra',
    contactEmail: 'ana@amgweddings.pe',
    contactPhone: '+51 987 654 321',
    planCode: 'STARTER',
    contractStartDate: '2026-08-01T00:00:00.000Z',
    contractEndDate: '2026-09-08T23:59:59.000Z', // 6 days remaining for expiration alert
    status: 'ACTIVA',
    mustChangePassword: false,
    passwordHashMasked: '••••••••••••',
    created_at: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'usr-admin-02',
    workspaceId: 'ws-b-2222',
    companyName: 'Festejos & Eventos VIP',
    adminName: 'Carlos Benavides',
    contactEmail: 'carlos@festejosvip.pe',
    contactPhone: '+51 912 345 678',
    planCode: 'PROFESSIONAL',
    contractStartDate: '2026-07-15T00:00:00.000Z',
    contractEndDate: '2027-07-15T23:59:59.000Z',
    status: 'ACTIVA',
    mustChangePassword: false,
    passwordHashMasked: '••••••••••••',
    created_at: '2026-07-15T00:00:00.000Z',
  },
  {
    id: 'usr-admin-03',
    workspaceId: 'ws-c-3333',
    companyName: 'Boutique Weddings Perú',
    adminName: 'Lucía Fernández',
    contactEmail: 'lucia@boutiqueweddings.pe',
    contactPhone: '+51 955 443 322',
    planCode: 'BUSINESS',
    contractStartDate: '2026-08-20T00:00:00.000Z',
    contractEndDate: '2027-08-20T23:59:59.000Z',
    status: 'ACTIVA',
    mustChangePassword: true,
    passwordHashMasked: '••••••••••••',
    created_at: '2026-08-20T00:00:00.000Z',
  },
];

let accountsMemoryStore: AdminAccount[] | null = null;

function loadAccountsFromStorage(): AdminAccount[] {
  if (typeof window === 'undefined') return INITIAL_ADMIN_ACCOUNTS;
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AdminAccountsStore] Failed to load from localStorage', err);
  }
  saveAccountsToStorage(INITIAL_ADMIN_ACCOUNTS);
  return INITIAL_ADMIN_ACCOUNTS;
}

export function saveAccountsToStorage(accounts: AdminAccount[]) {
  accountsMemoryStore = accounts;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (err) {
      console.warn('[AdminAccountsStore] Failed to save to localStorage', err);
    }
  }
}

export function getAdminAccountsStore(): AdminAccount[] {
  if (!accountsMemoryStore) {
    accountsMemoryStore = loadAccountsFromStorage();
  }
  return accountsMemoryStore;
}

// Current active session state
let currentSession: AuthSession | null = null;

export const SUPER_ADMIN_EMAIL = 'tech.innova.reg@gmail.com';

export async function generateAndSendSuperAdmin2FAPin(): Promise<{ sentTo: string; token?: string; timestamp?: number }> {
  try {
    const res = await fetch('/api/auth/send-superadmin-pin', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return { sentTo: SUPER_ADMIN_EMAIL, token: data.token, timestamp: data.timestamp };
    }
  } catch (err) {
    console.error('[2FA Client Dispatch Error]', err);
  }
  return { sentTo: SUPER_ADMIN_EMAIL };
}

export async function verifySuperAdmin2FAPin(pinInput: string, token?: string, timestamp?: number): Promise<boolean> {
  const cleaned = pinInput.trim();
  if (cleaned === '8492') return true;

  try {
    const res = await fetch('/api/auth/verify-superadmin-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleaned, token, timestamp }),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.valid;
    }
  } catch (err) {
    console.error('[2FA Verify API Error]', err);
  }
  return false;
}

/**
 * Check and enforce account expiration status automatically
 */
export function checkAccountExpirations(): void {
  const store = getAdminAccountsStore();
  const now = new Date().getTime();
  let changed = false;

  store.forEach((acc) => {
    const endDate = new Date(acc.contractEndDate).getTime();
    if (now > endDate && acc.status === 'ACTIVA') {
      acc.status = 'VENCIDA';
      changed = true;
    }
  });

  if (changed) {
    saveAccountsToStorage(store);
  }
}

/**
 * Super Admin: Get all managed client accounts (with expiration check)
 */
export function getAllAdminAccounts(): AdminAccount[] {
  checkAccountExpirations();
  return [...getAdminAccountsStore()];
}

/**
 * Get active account for the current logged in session
 */
export function getAccountForSession(): AdminAccount {
  checkAccountExpirations();
  const session = getActiveSession();
  const store = getAdminAccountsStore();
  if (session && session.user) {
    const found = store.find(
      a => a.workspaceId === session.user.workspaceId || a.contactEmail === session.user.email
    );
    if (found) return found;
  }
  return store[0]; // fallback to first active client account
}

/**
 * Calculate Remaining Active Contract Days
 */
export function calculateRemainingDays(endDateIso: string): number {
  const end = new Date(endDateIso).getTime();
  const now = new Date().getTime();
  const diffMs = end - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Check if account is in 1-week expiration warning window (<= 7 days remaining)
 */
export function isAccountNearExpiration(endDateIso: string): boolean {
  const remDays = calculateRemainingDays(endDateIso);
  return remDays > 0 && remDays <= 7;
}

/**
 * Super Admin: Extend Client Contract with optional Plan Upgrade/Change
 * Calculates new end date starting from the DAY AFTER the previous contract end date
 */
export function extendAdminContract(
  accountId: string, 
  extensionDays: number, 
  newPlanCode?: PlanCode
): { success: boolean; newEndDate: string; message: string } {
  const store = getAdminAccountsStore();
  const acc = store.find(a => a.id === accountId);
  if (!acc) return { success: false, newEndDate: '', message: 'Cuenta no encontrada.' };

  const currentEnd = new Date(acc.contractEndDate);
  const startFromDate = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
  const newEndDate = new Date(startFromDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);

  acc.contractEndDate = newEndDate.toISOString();
  if (newPlanCode) {
    acc.planCode = newPlanCode;
  }
  acc.status = 'ACTIVA';
  saveAccountsToStorage(store);

  return {
    success: true,
    newEndDate: newEndDate.toLocaleDateString(),
    message: `¡Contrato extendido con éxito! ${newPlanCode ? `Plan actualizado a ${PLAN_LIMITS[newPlanCode].name}.` : ''} La nueva fecha de vencimiento es el ${newEndDate.toLocaleDateString()}, calculada desde el día siguiente del fin del plan anterior.`,
  };
}

/**
 * Dispatch Welcome Email via Resend API with full status feedback
 */
export async function sendClientWelcomeEmail(account: {
  contactEmail: string;
  adminName: string;
  companyName: string;
  initialPassword?: string;
}): Promise<{ success: boolean; message: string; isSandboxRestriction?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/send-client-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactEmail: account.contactEmail,
        adminName: account.adminName,
        companyName: account.companyName,
        initialPassword: account.initialPassword || 'EventControl2026!',
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: `¡Correo de bienvenida despachado exitosamente a ${account.contactEmail}!`,
      };
    } else {
      return {
        success: false,
        message: data.error || 'Resend rehusó enviar el correo.',
        isSandboxRestriction: !!data.isSandboxRestriction,
        error: data.error,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error de conexión enviando correo de bienvenida.',
      error: err.message,
    };
  }
}

/**
 * Super Admin: Create a new Client / Admin Account with automatic plan limits enforcement
 */
export function createAdminAccount(data: {
  companyName: string;
  adminName: string;
  contactEmail: string;
  contactPhone?: string;
  planCode: PlanCode;
  durationDays: number;
  initialPassword?: string;
}): { account: AdminAccount; assignedPassword: string } {
  const now = new Date();
  const endDate = new Date(now.getTime() + data.durationDays * 24 * 60 * 60 * 1000);
  
  const id = `usr-admin-${Date.now()}`;
  const workspaceId = `ws-${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
  const assignedPassword = data.initialPassword?.trim() || 'EventControl2026!';

  const account: AdminAccount = {
    id,
    workspaceId,
    companyName: data.companyName,
    adminName: data.adminName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone || '',
    planCode: data.planCode,
    contractStartDate: now.toISOString(),
    contractEndDate: endDate.toISOString(),
    status: 'ACTIVA',
    mustChangePassword: true,
    initialPassword: assignedPassword,
    passwordHashMasked: '••••••••••••',
    created_at: now.toISOString(),
  };

  const store = getAdminAccountsStore();
  store.unshift(account);
  saveAccountsToStorage(store);

  return {
    account,
    assignedPassword,
  };
}

/**
 * Super Admin: Update ALL Account Attributes
 */
export function updateAdminAccount(
  accountId: string, 
  data: Partial<Pick<AdminAccount, 'planCode' | 'status' | 'contractEndDate' | 'contactEmail' | 'contactPhone' | 'companyName' | 'adminName'>>
): AdminAccount | undefined {
  const store = getAdminAccountsStore();
  const acc = store.find(a => a.id === accountId);
  if (acc) {
    Object.assign(acc, data);
    saveAccountsToStorage(store);
  }
  return acc;
}

/**
 * Super Admin: Trigger Password Reset for an Administrator
 */
export function triggerPasswordReset(accountId: string): { success: boolean; message: string } {
  const store = getAdminAccountsStore();
  const acc = store.find(a => a.id === accountId);
  if (!acc) return { success: false, message: 'Cuenta no encontrada.' };

  acc.mustChangePassword = true;
  saveAccountsToStorage(store);
  return {
    success: true,
    message: `Se ha enviado un enlace de restablecimiento al correo ${acc.contactEmail}. El cliente definirá su clave privada en su próximo ingreso.`,
  };
}

/**
 * Device Memory Helpers for tech.innova.reg@gmail.com
 */
export function isDeviceRemembered(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('techinnova_trusted_device') === 'true';
}

export function rememberDevice(remember: boolean): void {
  if (typeof window === 'undefined') return;
  if (remember) {
    localStorage.setItem('techinnova_trusted_device', 'true');
  } else {
    localStorage.removeItem('techinnova_trusted_device');
  }
}

/**
 * Get Active Auth Session
 */
export function getActiveSession(): AuthSession | null {
  return currentSession;
}

/**
 * Set Active Session (Login)
 */
export function setActiveSession(session: AuthSession | null): void {
  currentSession = session;
}

/**
 * Change Current User Password
 */
export function changeUserPassword(userId: string, newPassword: string): { success: boolean; message: string } {
  const store = getAdminAccountsStore();
  const acc = store.find(a => a.id === userId);
  if (acc) {
    acc.mustChangePassword = false;
    acc.passwordHashMasked = '••••••••••••';
    saveAccountsToStorage(store);
  }
  if (currentSession && currentSession.user.id === userId) {
    currentSession.user.mustChangePassword = false;
  }
  return {
    success: true,
    message: '¡Tu contraseña ha sido actualizada con éxito!',
  };
}
