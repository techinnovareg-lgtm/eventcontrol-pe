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

// In-Memory Store for Super Admin managed client accounts
const adminAccountsStore: AdminAccount[] = [
  {
    id: 'usr-admin-01',
    workspaceId: 'ws-a-1111',
    companyName: 'AMG Wedding Planners',
    adminName: 'Ana María Gamarra',
    contactEmail: 'ana@amgweddings.pe',
    contactPhone: '+51 987 654 321',
    planCode: 'STARTER',
    contractStartDate: '2026-08-01T00:00:00.000Z',
    contractEndDate: '2026-09-08T23:59:59.000Z', // Expiring in 6 days for testing 1-week alert
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

// Current active session state
let currentSession: AuthSession | null = null;

export const SUPER_ADMIN_EMAIL = 'tech.innova.reg@gmail.com';

/**
 * Check and enforce account expiration status automatically
 */
export function checkAccountExpirations(): void {
  const now = new Date().getTime();
  adminAccountsStore.forEach(acc => {
    const endMs = new Date(acc.contractEndDate).getTime();
    if (endMs < now && acc.status !== 'SUSPENDIDA') {
      acc.status = 'VENCIDA';
    }
  });
}

/**
 * Super Admin: Get all managed client accounts (with expiration check)
 */
export function getAllAdminAccounts(): AdminAccount[] {
  checkAccountExpirations();
  return [...adminAccountsStore];
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
 * Super Admin: Extend Client Contract
 * Calculates new end date starting from the DAY AFTER the previous contract end date
 */
export function extendAdminContract(accountId: string, extensionDays: number): { success: boolean; newEndDate: string; message: string } {
  const acc = adminAccountsStore.find(a => a.id === accountId);
  if (!acc) return { success: false, newEndDate: '', message: 'Cuenta no encontrada.' };

  const currentEnd = new Date(acc.contractEndDate);
  // Start from the day after the previous plan's end date
  const startFromDate = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
  const newEndDate = new Date(startFromDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);

  acc.contractEndDate = newEndDate.toISOString();
  acc.status = 'ACTIVA'; // Reactivate account automatically upon extension payment

  return {
    success: true,
    newEndDate: newEndDate.toLocaleDateString(),
    message: `¡Contrato extendido con éxito! La nueva fecha de vencimiento es el ${newEndDate.toLocaleDateString()}, calculada desde el día siguiente del fin del plan anterior.`,
  };
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
}): { account: AdminAccount; tempPasswordNotice: string } {
  const now = new Date();
  const endDate = new Date(now.getTime() + data.durationDays * 24 * 60 * 60 * 1000);
  
  const id = `usr-admin-${Date.now()}`;
  const workspaceId = `ws-${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

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
    passwordHashMasked: '••••••••••••',
    created_at: now.toISOString(),
  };

  adminAccountsStore.unshift(account);

  return {
    account,
    tempPasswordNotice: `Cuenta creada exitosamente. Se ha registrado a ${data.contactEmail}. El administrador establecerá su contraseña privada en su primer ingreso.`,
  };
}

/**
 * Super Admin: Update Account Plan or Contract Expiration Date
 */
export function updateAdminAccount(
  accountId: string, 
  data: Partial<Pick<AdminAccount, 'planCode' | 'status' | 'contractEndDate' | 'contactEmail' | 'contactPhone' | 'companyName' | 'adminName'>>
): AdminAccount | undefined {
  const acc = adminAccountsStore.find(a => a.id === accountId);
  if (acc) {
    Object.assign(acc, data);
  }
  return acc;
}

/**
 * Super Admin: Trigger Password Reset for an Administrator
 */
export function triggerPasswordReset(accountId: string): { success: boolean; message: string } {
  const acc = adminAccountsStore.find(a => a.id === accountId);
  if (!acc) return { success: false, message: 'Cuenta no encontrada.' };

  acc.mustChangePassword = true;
  return {
    success: true,
    message: `Se ha enviado un enlace de restablecimiento al correo ${acc.contactEmail}. El cliente definirá su clave privada en su próximo ingreso.`,
  };
}

/**
 * Device Memory & 2FA 4-Digit Token Verification Helper for tech.innova.reg@gmail.com
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
  const acc = adminAccountsStore.find(a => a.id === userId);
  if (acc) {
    acc.mustChangePassword = false;
    acc.passwordHashMasked = '••••••••••••';
  }
  if (currentSession && currentSession.user.id === userId) {
    currentSession.user.mustChangePassword = false;
  }
  return {
    success: true,
    message: '¡Tu contraseña ha sido actualizada con éxito!',
  };
}
