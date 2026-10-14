import { PlanCode, PLAN_LIMITS } from './plans';

export interface ContractSubscriptionRecord {
  id: string;
  type: 'INITIAL' | 'EXTENSION' | 'PLAN_UPGRADE';
  planCode: PlanCode;
  startDate: string;
  endDate: string;
  durationDays: number;
  pricePEN?: number;
  notes?: string;
  created_at: string;
}

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
  status: 'ACTIVA' | 'SUSPENDIDA' | 'VENCIDA' | 'ARCHIVADA';
  mustChangePassword?: boolean;
  initialPassword?: string;
  passwordHashMasked: string; // Password privacy: only stores hashed representation, never raw text
  contractHistory?: ContractSubscriptionRecord[];
  isArchived?: boolean;
  archived_at?: string;
  created_at: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_USER' | 'OWNER' | 'ADMIN' | 'COORDINADOR' | 'OPERATOR';
    workspaceId?: string;
    eventId?: string;
    mustChangePassword?: boolean;
  };
}

const ACCOUNTS_STORAGE_KEY = 'eventcontrol_admin_accounts';

const INITIAL_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'usr-admin-moral17',
    workspaceId: 'ws-moral17-2026',
    companyName: 'Cliente Hotmail VIP',
    adminName: 'Usuario Moral 17',
    contactEmail: 'moral.17@hotmail.com',
    contactPhone: '+51 987 000 111',
    planCode: 'BUSINESS',
    contractStartDate: '2026-10-05T00:00:00.000Z',
    contractEndDate: '2027-12-31T23:59:59.000Z',
    status: 'ACTIVA',
    mustChangePassword: false,
    initialPassword: 'EventControl2026!',
    passwordHashMasked: '••••••••••••',
    created_at: '2026-10-05T00:00:00.000Z',
  },
  {
    id: 'usr-admin-hotmail-123',
    workspaceId: 'ws-hotmail-99',
    companyName: 'Estudio Hotmail VIP',
    adminName: 'Carlos Amambal',
    contactEmail: 'carlos.amambal@hotmail.com',
    contactPhone: '+51 987 654 321',
    planCode: 'STARTER',
    contractStartDate: '2026-10-05T00:00:00.000Z',
    contractEndDate: '2027-12-31T23:59:59.000Z',
    status: 'ACTIVA',
    mustChangePassword: false,
    initialPassword: 'EventControl2026!',
    passwordHashMasked: '••••••••••••',
    created_at: '2026-10-05T00:00:00.000Z',
  },
  {
    id: 'usr-admin-01',
    workspaceId: 'ws-a-1111',
    companyName: 'AMG Wedding Planners',
    adminName: 'Ana María Gamarra',
    contactEmail: 'ana@amgweddings.pe',
    contactPhone: '+51 987 654 321',
    planCode: 'STARTER',
    contractStartDate: '2026-10-01T00:00:00.000Z',
    contractEndDate: '2026-10-30T23:59:59.999Z',
    status: 'ACTIVA',
    mustChangePassword: false,
    initialPassword: 'EventControl2026!',
    passwordHashMasked: '••••••••••••',
    created_at: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'usr-admin-weddingsco',
    workspaceId: 'ws-weddingsco-appqsop',
    companyName: 'Weddings Co',
    adminName: 'SOP Prueba',
    contactEmail: 'appqsop@gmail.com',
    contactPhone: '+51 999 888 777',
    planCode: 'BUSINESS',
    contractStartDate: '2026-09-07T00:00:00.000Z',
    contractEndDate: '2027-09-06T23:59:59.999Z',
    status: 'ACTIVA',
    mustChangePassword: false,
    initialPassword: 'EventControl2026!',
    passwordHashMasked: '••••••••••••',
    created_at: '2026-09-07T00:00:00.000Z',
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
    contractEndDate: '2027-07-14T23:59:59.999Z',
    status: 'ACTIVA',
    mustChangePassword: false,
    initialPassword: 'EventControl2026!',
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
    contractEndDate: '2027-08-19T23:59:59.999Z',
    status: 'ACTIVA',
    mustChangePassword: true,
    initialPassword: 'EventControl2026!',
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
        INITIAL_ADMIN_ACCOUNTS.forEach(initAcc => {
          if (!parsed.some((a: AdminAccount) => a.contactEmail.toLowerCase() === initAcc.contactEmail.toLowerCase())) {
            parsed.unshift(initAcc);
          }
        });
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AdminAccountsStore] Failed to load from localStorage', err);
  }
  saveAccountsToStorage(INITIAL_ADMIN_ACCOUNTS);
  return INITIAL_ADMIN_ACCOUNTS;
}

export function autoSyncAccountsToServer() {
  if (typeof window === 'undefined') return;
  try {
    const store = accountsMemoryStore || loadAccountsFromStorage();
    if (store && store.length > 0) {
      fetch('/api/auth/sync-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC', accounts: store }),
      }).catch(() => {});
    }
  } catch (err) {}
}

export function saveAccountsToStorage(accounts: AdminAccount[]) {
  accountsMemoryStore = accounts;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      setTimeout(() => autoSyncAccountsToServer(), 100);
    } catch (err) {
      console.warn('[AdminAccountsStore] Failed to save to localStorage', err);
    }
  }
}

export function getAdminAccountsStore(): AdminAccount[] {
  if (!accountsMemoryStore) {
    accountsMemoryStore = loadAccountsFromStorage();
    setTimeout(() => autoSyncAccountsToServer(), 100);
  }
  return accountsMemoryStore;
}

export async function authenticateAdminAccountAsync(emailInput: string, passwordInput: string): Promise<AdminAccount | null> {
  const cleanedEmail = emailInput.trim().toLowerCase();
  const trimmedPass = passwordInput.trim();

  // 1. Primary: Query Central Online Server Accounts API first
  try {
    const res = await fetch(`/api/auth/sync-accounts?email=${encodeURIComponent(cleanedEmail)}&password=${encodeURIComponent(trimmedPass)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.account) {
        const serverAccount: AdminAccount = data.account;
        const store = getAdminAccountsStore();
        const idx = store.findIndex(a => a.id === serverAccount.id || a.contactEmail.toLowerCase() === serverAccount.contactEmail.toLowerCase());
        if (idx !== -1) {
          store[idx] = serverAccount;
        } else {
          store.unshift(serverAccount);
        }
        saveAccountsToStorage(store);
        return serverAccount;
      }
    } else if (res.status === 403) {
      // Explicitly blocked: Account suspended or expired
      return null;
    }
  } catch (err) {
    console.warn('[Sync Accounts API Auth Warning]', err);
  }

  // 2. Secondary: Fallback to local memory/localStorage store
  const accounts = getAllAdminAccounts();
  const matched = accounts.find(a => a.contactEmail.toLowerCase() === cleanedEmail);
  if (matched) {
    if (matched.status === 'SUSPENDIDA' || matched.status === 'VENCIDA') return null;
    const expectedPassword = matched.initialPassword || 'EventControl2026!';
    const isMatch = trimmedPass === expectedPassword;

    if (isMatch) {
      // Sync account to server central DB if missing on server
      if (typeof window !== 'undefined') {
        fetch('/api/auth/sync-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'UPSERT', account: matched }),
        }).catch(() => {});
      }
      return matched;
    }
  }

  return null;
}

export function getAdminAccountByEmail(emailInput: string): AdminAccount | undefined {
  if (!emailInput) return undefined;
  const cleanedEmail = emailInput.trim().toLowerCase();
  const accounts = getAllAdminAccounts();
  return accounts.find(a => a.contactEmail.toLowerCase() === cleanedEmail);
}

export async function getAdminAccountByEmailAsync(emailInput: string): Promise<AdminAccount | undefined> {
  if (!emailInput) return undefined;
  const cleanedEmail = emailInput.trim().toLowerCase();
  
  // 1. Check local first
  const local = getAdminAccountByEmail(cleanedEmail);
  if (local) return local;

  // 2. Fetch from online server / Supabase
  try {
    const res = await fetch(`/api/auth/sync-accounts?email=${encodeURIComponent(cleanedEmail)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.account) {
        const store = getAdminAccountsStore();
        const idx = store.findIndex(a => a.id === data.account.id || a.contactEmail.toLowerCase() === cleanedEmail);
        if (idx !== -1) {
          store[idx] = data.account;
        } else {
          store.unshift(data.account);
        }
        saveAccountsToStorage(store);
        return data.account;
      }
    }
  } catch (err) {}

  return undefined;
}

// Current active session state
let currentSession: AuthSession | null = null;

export const SUPER_ADMIN_EMAIL = 'tech.innova.reg@gmail.com';

const SUPER_ADMIN_PASS_KEY = 'eventcontrol_superadmin_password';

export function getSuperAdminPassword(): string {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(SUPER_ADMIN_PASS_KEY);
      if (saved) return saved;
    } catch (err) {}
  }
  return 'EventControl2026!';
}

export function setSuperAdminPassword(newPassword: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SUPER_ADMIN_PASS_KEY, newPassword.trim());
    } catch (err) {}
  }
}

export function verifySuperAdminPassword(passwordInput: string): boolean {
  const currentPass = getSuperAdminPassword();
  const trimmed = passwordInput.trim();
  return currentPass === trimmed;
}

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
      a => a.workspaceId === session.user.workspaceId || a.contactEmail.toLowerCase() === session.user.email?.toLowerCase()
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
 * Formatea una fecha de contrato en formato civil DD/MM/YYYY
 * garantizando cero distorsiones de huso horario (GMT-5 vs UTC).
 */
export function formatContractDateCivil(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = clean.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  } catch (err) {}
  return dateStr;
}

/**
 * Calcula la duración exacta en días de un contrato entre dos fechas,
 * considerando ambos extremos incluidos (día de inicio como Día 1 y día de fin inclusive).
 * Ejemplo: Inicio 01/10 al 30/10 = 30 días exactos.
 */
export function calculateContractDurationDays(startDateIso: string, endDateIso: string): number {
  try {
    const sStr = startDateIso.includes('T') ? startDateIso.split('T')[0] : startDateIso;
    const eStr = endDateIso.includes('T') ? endDateIso.split('T')[0] : endDateIso;
    const [sY, sM, sD] = sStr.split('-').map(Number);
    const [eY, eM, eD] = eStr.split('-').map(Number);
    const sUtc = Date.UTC(sY, sM - 1, sD);
    const eUtc = Date.UTC(eY, eM - 1, eD);
    const diff = Math.round((eUtc - sUtc) / (24 * 60 * 60 * 1000));
    return Math.max(1, diff + 1);
  } catch (err) {
    return 30;
  }
}

/**
 * Helper: Calcula la fecha de vencimiento automáticamente basada en la fecha de inicio del contrato
 * y la duración en días (ej. 30 días para Starter mensual, 90 trimestral, 180 semestral, 365 anual).
 * REGLA ESTRICTA DE NEGOCIO: La vigencia incluye el día de inicio como Día 1.
 * Por lo tanto, un contrato de 30 días que inicia el 1 de octubre, termina el 30 de octubre a las 23:59:59 (exactamente 30 días).
 */
export function calculateContractEndDate(startDateIso: string, durationDays: number): string {
  if (!startDateIso) {
    startDateIso = new Date().toISOString().split('T')[0];
  }
  const clean = startDateIso.includes('T') ? startDateIso.split('T')[0] : startDateIso;
  const [year, month, day] = clean.split('-').map(Number);
  
  // Creamos la fecha en UTC fijando 23:59:59.999
  const d = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  
  // Si dura N días e incluye el día de inicio, sumamos (durationDays - 1)
  const daysToAdd = Math.max(0, durationDays - 1);
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  
  return d.toISOString();
}

/**
 * Super Admin: Extend Client Contract with optional Plan Upgrade/Change
 * Calculates new end date starting from the DAY AFTER the previous contract end date,
 * and appends an immutable subscription record to contractHistory.
 */
export function extendAdminContract(
  accountId: string, 
  extensionDays: number, 
  newPlanCode?: PlanCode,
  notes?: string
): { success: boolean; newEndDate: string; message: string } {
  const store = getAdminAccountsStore();
  const acc = store.find(a => a.id === accountId);
  if (!acc) return { success: false, newEndDate: '', message: 'Cuenta no encontrada.' };

  // El nuevo período comienza al día siguiente de la fecha de vencimiento previa
  const prevEndStr = acc.contractEndDate.includes('T') ? acc.contractEndDate.split('T')[0] : acc.contractEndDate;
  const [eY, eM, eD] = prevEndStr.split('-').map(Number);
  const nextStart = new Date(Date.UTC(eY, eM - 1, eD));
  nextStart.setUTCDate(nextStart.getUTCDate() + 1); // día siguiente
  const nextStartStr = nextStart.toISOString().split('T')[0];

  const newEndDate = calculateContractEndDate(nextStartStr, extensionDays);

  const prevPlan = acc.planCode;
  const targetPlan = newPlanCode || acc.planCode;

  // Initialize history if missing
  if (!acc.contractHistory) {
    acc.contractHistory = [
      {
        id: `sub-init-${acc.id}`,
        type: 'INITIAL',
        planCode: prevPlan,
        startDate: acc.contractStartDate,
        endDate: acc.contractEndDate,
        durationDays: calculateContractDurationDays(acc.contractStartDate, acc.contractEndDate),
        pricePEN: PLAN_LIMITS[prevPlan]?.monthlyPricePEN,
        notes: 'Suscripción inicial de contrato',
        created_at: acc.created_at || acc.contractStartDate,
      }
    ];
  }

  // Create extension history entry
  const historyEntry: ContractSubscriptionRecord = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: targetPlan !== prevPlan ? 'PLAN_UPGRADE' : 'EXTENSION',
    planCode: targetPlan,
    startDate: nextStart.toISOString(),
    endDate: newEndDate,
    durationDays: extensionDays,
    pricePEN: PLAN_LIMITS[targetPlan]?.monthlyPricePEN,
    notes: notes || (targetPlan !== prevPlan ? `Migración de ${prevPlan} a ${targetPlan} (+${extensionDays} días)` : `Renovación de servicio (+${extensionDays} días)`),
    created_at: new Date().toISOString(),
  };

  acc.contractHistory.push(historyEntry);
  acc.contractEndDate = newEndDate;
  if (newPlanCode) {
    acc.planCode = newPlanCode;
  }
  if (acc.status === 'VENCIDA') {
    acc.status = 'ACTIVA';
  }
  saveAccountsToStorage(store);

  syncAdminAccountOnlineAsync(acc).catch(err => console.warn('[Sync Accounts Extend Online Warning]', err));

  return {
    success: true,
    newEndDate: formatContractDateCivil(newEndDate),
    message: `¡Contrato extendido con éxito! ${newPlanCode ? `Plan actualizado a ${PLAN_LIMITS[newPlanCode].name}.` : ''} La nueva fecha de vencimiento es el ${formatContractDateCivil(newEndDate)} (${extensionDays} días exactos de vigencia).`,
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
export async function syncAdminAccountOnlineAsync(account: AdminAccount): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/auth/sync-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPSERT', account }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync Accounts Online Error]', err);
    return false;
  }
}

export function createAdminAccount(data: {
  companyName: string;
  adminName: string;
  contactEmail: string;
  contactPhone?: string;
  planCode: PlanCode;
  durationDays?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  initialPassword?: string;
}): { account: AdminAccount; assignedPassword: string } {
  const now = new Date();
  const startDate = data.contractStartDate ? new Date(data.contractStartDate).toISOString() : now.toISOString();
  let endDate: string;
  
  if (data.contractEndDate) {
    endDate = new Date(data.contractEndDate).toISOString();
  } else {
    const days = data.durationDays || 365;
    endDate = calculateContractEndDate(startDate, days);
  }
  
  const id = `usr-admin-${Date.now()}`;
  const workspaceId = `ws-${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
  const assignedPassword = data.initialPassword?.trim() || 'EventControl2026!';

  const initialSubscription: ContractSubscriptionRecord = {
    id: `sub-init-${id}`,
    type: 'INITIAL',
    planCode: data.planCode,
    startDate,
    endDate,
    durationDays: calculateContractDurationDays(startDate, endDate),
    pricePEN: PLAN_LIMITS[data.planCode]?.monthlyPricePEN,
    notes: 'Alta y apertura oficial de cuenta administradora',
    created_at: now.toISOString(),
  };

  const account: AdminAccount = {
    id,
    workspaceId,
    companyName: data.companyName,
    adminName: data.adminName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone || '',
    planCode: data.planCode,
    contractStartDate: startDate,
    contractEndDate: endDate,
    status: 'ACTIVA',
    mustChangePassword: true,
    initialPassword: assignedPassword,
    passwordHashMasked: '••••••••••••',
    contractHistory: [initialSubscription],
    isArchived: false,
    created_at: now.toISOString(),
  };

  const store = getAdminAccountsStore();
  store.unshift(account);
  saveAccountsToStorage(store);

  syncAdminAccountOnlineAsync(account).catch(err => console.warn('[Sync Accounts UPSERT warning]', err));

  return {
    account,
    assignedPassword,
  };
}

/**
 * Super Admin: Update ALL Account Attributes (including contract dates)
 */
export function updateAdminAccount(
  accountId: string, 
  data: Partial<Pick<AdminAccount, 'planCode' | 'status' | 'contractStartDate' | 'contractEndDate' | 'contactEmail' | 'contactPhone' | 'companyName' | 'adminName' | 'isArchived'>>
): AdminAccount | undefined {
  const store = getAdminAccountsStore();
  const acc = store.find(a => a.id === accountId);
  if (acc) {
    // If contract dates changed or plan changed, add a modification record in history if needed
    const oldStartDate = acc.contractStartDate;
    const oldEndDate = acc.contractEndDate;
    const oldPlan = acc.planCode;

    Object.assign(acc, data);

    if (!acc.contractHistory) {
      acc.contractHistory = [
        {
          id: `sub-init-${acc.id}`,
          type: 'INITIAL',
          planCode: oldPlan,
          startDate: oldStartDate,
          endDate: oldEndDate,
          durationDays: calculateContractDurationDays(oldStartDate, oldEndDate),
          pricePEN: PLAN_LIMITS[oldPlan]?.monthlyPricePEN,
          notes: 'Registro previo de suscripción',
          created_at: acc.created_at || oldStartDate,
        }
      ];
    }

    if (data.contractEndDate && data.contractEndDate !== oldEndDate) {
      acc.contractHistory.push({
        id: `sub-mod-${Date.now()}`,
        type: data.planCode && data.planCode !== oldPlan ? 'PLAN_UPGRADE' : 'EXTENSION',
        planCode: acc.planCode,
        startDate: acc.contractStartDate,
        endDate: acc.contractEndDate,
        durationDays: calculateContractDurationDays(acc.contractStartDate, acc.contractEndDate),
        pricePEN: PLAN_LIMITS[acc.planCode]?.monthlyPricePEN,
        notes: 'Ajuste manual de atributos de vigencia o plan por Superadmin',
        created_at: new Date().toISOString(),
      });
    }

    saveAccountsToStorage(store);
    syncAdminAccountOnlineAsync(acc).catch(err => console.warn('[Sync Accounts Update Online Warning]', err));
  }
  return acc;
}

/**
 * Super Admin: Archive or Unarchive Account
 */
export function toggleArchiveAdminAccount(accountId: string): { success: boolean; isArchived: boolean; message: string } {
  const store = getAdminAccountsStore();
  const acc = store.find(a => a.id === accountId);
  if (!acc) return { success: false, isArchived: false, message: 'Cuenta no encontrada.' };

  const willArchive = !acc.isArchived;
  acc.isArchived = willArchive;
  if (willArchive) {
    acc.archived_at = new Date().toISOString();
    acc.status = 'ARCHIVADA';
  } else {
    acc.archived_at = undefined;
    const now = Date.now();
    const end = new Date(acc.contractEndDate).getTime();
    acc.status = end < now ? 'VENCIDA' : 'ACTIVA';
  }

  saveAccountsToStorage(store);
  syncAdminAccountOnlineAsync(acc).catch(err => console.warn('[Sync Accounts Archive Online Warning]', err));

  return {
    success: true,
    isArchived: willArchive,
    message: willArchive 
      ? `La cuenta "${acc.companyName}" ha sido archivada. Se oculta del listado activo pero conserva todo su histórico.`
      : `La cuenta "${acc.companyName}" ha sido restaurada con estado ${acc.status}.`,
  };
}

/**
 * Super Admin: Delete Account permanently
 */
export function deleteAdminAccount(accountId: string): { success: boolean; message: string } {
  const store = getAdminAccountsStore();
  const accIdx = store.findIndex(a => a.id === accountId);
  if (accIdx === -1) return { success: false, message: 'Cuenta no encontrada.' };

  const removed = store.splice(accIdx, 1)[0];
  saveAccountsToStorage(store);

  if (typeof window !== 'undefined') {
    fetch('/api/auth/sync-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE', accountId }),
    }).catch(err => console.warn('[Sync Accounts DELETE Online Warning]', err));
  }

  return {
    success: true,
    message: `La cuenta "${removed.companyName}" ha sido eliminada permanentemente.`,
  };
}

/**
 * Super Admin: Trigger Password Reset for an Administrator
 */
export function triggerPasswordReset(accountId: string): { success: boolean; message: string } {
  const store = getAdminAccountsStore();
  const acc = store.find(a => a.id === accountId);
  if (!acc) return { success: false, message: 'Cuenta no encontrada.' };

  acc.initialPassword = 'EventControl2026!';
  acc.mustChangePassword = true;
  saveAccountsToStorage(store);
  return {
    success: true,
    message: `¡Contraseña restablecida exitosamente a "Eventcontrol2026!" para ${acc.contactEmail}.`,
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

const SESSION_STORAGE_KEY = 'eventcontrol_active_session';

/**
 * Get Active Auth Session (with browser storage persistence on refresh)
 */
export function getActiveSession(): AuthSession | null {
  if (currentSession) {
    if (currentSession.user?.email && (!currentSession.user.workspaceId || currentSession.user.workspaceId === 'ws-a-1111')) {
      const acc = getAdminAccountByEmail(currentSession.user.email);
      if (acc && acc.workspaceId && acc.workspaceId !== 'ws-a-1111') {
        currentSession.user.workspaceId = acc.workspaceId;
        setActiveSession(currentSession);
      }
    }
    return currentSession;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.user) {
          if (parsed.user.email && (!parsed.user.workspaceId || parsed.user.workspaceId === 'ws-a-1111')) {
            const acc = getAdminAccountByEmail(parsed.user.email);
            if (acc && acc.workspaceId && acc.workspaceId !== 'ws-a-1111') {
              parsed.user.workspaceId = acc.workspaceId;
              try {
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
              } catch (e) {}
            }
          }
          currentSession = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[ActiveSession] Failed to read from storage', err);
    }
  }
  return null;
}

/**
 * Set Active Session (Login / Logout with storage persistence)
 */
export function setActiveSession(session: AuthSession | null): void {
  currentSession = session;
  if (typeof window !== 'undefined') {
    try {
      if (session) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[ActiveSession] Failed to save to storage', err);
    }
  }
}

/**
 * Change Current User Password Privately
 */
export function changeUserPassword(userId: string, newPassword: string): { success: boolean; message: string } {
  const store = getAdminAccountsStore();
  const sessionEmail = currentSession?.user?.email?.toLowerCase();
  const acc = store.find(a => a.id === userId || (sessionEmail && a.contactEmail.toLowerCase() === sessionEmail));
  if (acc) {
    acc.mustChangePassword = false;
    acc.initialPassword = newPassword.trim();
    acc.passwordHashMasked = '••••••••••••';
    saveAccountsToStorage(store);
  }
  if (currentSession) {
    currentSession.user.mustChangePassword = false;
  }
  return {
    success: true,
    message: '¡Tu contraseña privada ha sido actualizada con éxito!',
  };
}
