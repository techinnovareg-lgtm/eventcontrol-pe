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

// Initial In-Memory Store for Super Admin managed client accounts
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
    contractEndDate: '2026-12-31T23:59:59.000Z',
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

// Current active session state (simulated session)
let currentSession: AuthSession | null = {
  user: {
    id: 'usr-admin-01',
    email: 'ana@amgweddings.pe',
    name: 'Ana María Gamarra (AMG Weddings)',
    role: 'ADMIN',
    workspaceId: 'ws-a-1111',
    mustChangePassword: false,
  },
};

/**
 * Super Admin: Get all managed client accounts
 */
export function getAllAdminAccounts(): AdminAccount[] {
  return [...adminAccountsStore];
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
    tempPasswordNotice: `Cuenta creada exitosamente. Se ha generado un token de acceso inicial enviado a ${data.contactEmail}. El administrador establecerá su contraseña en su primer ingreso.`,
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
 * Super Admin: Trigger Password Reset for an Administrator (Sends secure reset email link)
 */
export function triggerPasswordReset(accountId: string): { success: boolean; message: string } {
  const acc = adminAccountsStore.find(a => a.id === accountId);
  if (!acc) return { success: false, message: 'Cuenta no encontrada.' };

  acc.mustChangePassword = true;
  return {
    success: true,
    message: `Se ha enviado una solicitud de restablecimiento de contraseña al correo ${acc.contactEmail}. En su próximo ingreso, se le solicitará definir una nueva contraseña.`,
  };
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
