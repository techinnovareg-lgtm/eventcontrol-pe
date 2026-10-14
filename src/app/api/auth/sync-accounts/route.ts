import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export interface AdminAccount {
  id: string;
  workspaceId: string;
  companyName: string;
  adminName: string;
  contactEmail: string;
  contactPhone?: string;
  planCode: string;
  contractStartDate: string;
  contractEndDate: string;
  status: 'ACTIVA' | 'SUSPENDIDA' | 'VENCIDA' | 'ARCHIVADA';
  mustChangePassword?: boolean;
  initialPassword?: string;
  passwordHashMasked: string;
  contractHistory?: any[];
  isArchived?: boolean;
  archived_at?: string;
  created_at: string;
}

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
    contractEndDate: '2027-10-04T23:59:59.999Z',
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
    contractEndDate: '2026-11-03T23:59:59.999Z',
    status: 'ACTIVA',
    mustChangePassword: false,
    initialPassword: 'EventControl2026!',
    passwordHashMasked: '••••••••••••',
    created_at: '2026-10-05T00:00:00.000Z',
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

function sanitizeServerAccount(acc: AdminAccount): AdminAccount {
  if (!acc) return acc;
  const sIso = acc.contractStartDate || acc.created_at || new Date().toISOString();
  const cleanStart = sIso.includes('T') ? sIso.split('T')[0] : sIso;
  const canonicalStart = new Date(`${cleanStart}T00:00:00.000Z`).toISOString();
  acc.contractStartDate = canonicalStart;

  const [sY, sM, sD] = cleanStart.split('-').map(Number);
  const sUtc = Date.UTC(sY, sM - 1, sD);

  const eStr = (acc.contractEndDate || '').includes('T') ? acc.contractEndDate.split('T')[0] : acc.contractEndDate;
  let diff = 30;
  if (eStr) {
    const [eY, eM, eD] = eStr.split('-').map(Number);
    const eUtc = Date.UTC(eY, eM - 1, eD);
    diff = Math.max(1, Math.round((eUtc - sUtc) / (24 * 60 * 60 * 1000)) + 1);
  }

  if (acc.planCode === 'STARTER') {
    if (diff > 35 || diff < 28) {
      const d = new Date(Date.UTC(sY, sM - 1, sD, 23, 59, 59, 999));
      d.setUTCDate(d.getUTCDate() + 29);
      acc.contractEndDate = d.toISOString();
    }
  } else {
    if (diff === 366 || diff === 364 || diff > 400) {
      const d = new Date(Date.UTC(sY, sM - 1, sD, 23, 59, 59, 999));
      d.setUTCDate(d.getUTCDate() + 364);
      acc.contractEndDate = d.toISOString();
    }
  }

  return acc;
}

let globalServerAccountsStore: AdminAccount[] = [];

const ACCOUNTS_DB_FILE = path.join(process.cwd(), 'data', 'server_accounts_db.json');
const TMP_ACCOUNTS_DB_FILE = path.join(os.tmpdir(), 'server_accounts_db.json');

async function fetchOnlineAccountsFromSupabase(): Promise<AdminAccount[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/check_ins?scanner_staff_name=eq.SYS_ACCOUNT_SYNC&select=*`, {
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

async function persistAccountToSupabase(acc: AdminAccount) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    const uuid = generateDeterministicUUID(`acc_${acc.id}_${acc.contactEmail}`);
    
    await fetch(`${url}/rest/v1/check_ins`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: uuid,
        scanner_staff_name: 'SYS_ACCOUNT_SYNC',
        device_info: JSON.stringify(acc)
      })
    });
  } catch (err) {}
}

function loadAccountsFromFile() {
  try {
    const targetFile = fs.existsSync(ACCOUNTS_DB_FILE) 
      ? ACCOUNTS_DB_FILE 
      : (fs.existsSync(TMP_ACCOUNTS_DB_FILE) ? TMP_ACCOUNTS_DB_FILE : null);
      
    if (targetFile) {
      const raw = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        INITIAL_ADMIN_ACCOUNTS.forEach(initAcc => {
          if (!parsed.some((a: AdminAccount) => a.contactEmail.toLowerCase() === initAcc.contactEmail.toLowerCase())) {
            parsed.unshift(initAcc);
          }
        });
        globalServerAccountsStore = parsed.map(sanitizeServerAccount);
        return;
      }
    }
  } catch (e) {}
  globalServerAccountsStore = INITIAL_ADMIN_ACCOUNTS.map(sanitizeServerAccount);
  saveAccountsToFile();
}

function saveAccountsToFile() {
  const content = JSON.stringify(globalServerAccountsStore, null, 2);
  try {
    const dir = path.dirname(ACCOUNTS_DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${ACCOUNTS_DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, content, 'utf-8');
    try {
      if (fs.existsSync(ACCOUNTS_DB_FILE)) fs.unlinkSync(ACCOUNTS_DB_FILE);
      fs.renameSync(tempFile, ACCOUNTS_DB_FILE);
    } catch {
      fs.copyFileSync(tempFile, ACCOUNTS_DB_FILE);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  } catch (e) {}

  try {
    fs.writeFileSync(TMP_ACCOUNTS_DB_FILE, content, 'utf-8');
  } catch (e) {}
}

loadAccountsFromFile();

export async function GET(req: Request) {
  loadAccountsFromFile();
  
  // Merge Online Supabase DB accounts
  const onlineAccounts = await fetchOnlineAccountsFromSupabase();
  onlineAccounts.forEach(oa => {
    const sanitizedOa = sanitizeServerAccount(oa);
    const idx = globalServerAccountsStore.findIndex(a => a.id === sanitizedOa.id || a.contactEmail.toLowerCase() === sanitizedOa.contactEmail.toLowerCase());
    if (idx !== -1) {
      globalServerAccountsStore[idx] = { ...globalServerAccountsStore[idx], ...sanitizedOa };
    } else {
      globalServerAccountsStore.unshift(sanitizedOa);
    }
  });

  globalServerAccountsStore = globalServerAccountsStore.map(sanitizeServerAccount);

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const password = searchParams.get('password');

  if (email && password) {
    const cleanedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    let matchedAccount = globalServerAccountsStore.find(acc => acc.contactEmail.toLowerCase() === cleanedEmail);

    // Fallback: If not in local memory, check Supabase Auth Authority
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
    if (!matchedAccount && sbUrl && sbKey) {
      try {
        const url = `${sbUrl}/auth/v1/token?grant_type=password`;
        const sbRes = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': sbKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: cleanedEmail, password: trimmedPass })
        });
        const sbData = await sbRes.json();

        // If credentials match (success OR email_not_confirmed means password is valid)
        if (sbData.access_token || sbData.user || sbData.error_code === 'email_not_confirmed') {
          const userMeta = sbData.user?.user_metadata || {};
          matchedAccount = {
            id: sbData.user?.id || `usr-${Date.now()}`,
            workspaceId: userMeta.workspaceId || `ws-${cleanedEmail.replace(/[^a-z0-9]/g, '')}`,
            companyName: userMeta.companyName || userMeta.name || 'Workspace Evento',
            adminName: userMeta.adminName || 'Administrador',
            contactEmail: cleanedEmail,
            planCode: userMeta.planCode || 'STARTER',
            contractStartDate: sbData.user?.created_at || new Date().toISOString(),
            contractEndDate: '2027-12-31T23:59:59.000Z',
            status: 'ACTIVA',
            mustChangePassword: false,
            initialPassword: trimmedPass,
            passwordHashMasked: '••••••••••••',
            created_at: sbData.user?.created_at || new Date().toISOString()
          };
          globalServerAccountsStore.unshift(matchedAccount);
          saveAccountsToFile();
          persistAccountToSupabase(matchedAccount);
        } else if (sbData.error_code === 'invalid_credentials') {
          return NextResponse.json({ success: false, message: 'Contraseña incorrecta' }, { status: 401 });
        }
      } catch (err) {
        console.warn('[Sync Accounts Route - Supabase Auth Check Warning]', err);
      }
    }

    if (matchedAccount) {
      if (matchedAccount.status === 'SUSPENDIDA' || matchedAccount.status === 'VENCIDA') {
        return NextResponse.json({ success: false, message: `Cuenta ${matchedAccount.status.toLowerCase()}` }, { status: 403 });
      }

      const expectedPassword = (matchedAccount.initialPassword || 'EventControl2026!').trim();
      const isPassMatch = trimmedPass === expectedPassword;

      if (isPassMatch) {
        return NextResponse.json({ success: true, account: matchedAccount });
      } else {
        return NextResponse.json({ success: false, message: 'Contraseña incorrecta' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ success: false, message: 'Correo no registrado' }, { status: 404 });
    }
  }

  if (email) {
    const cleanedEmail = email.trim().toLowerCase();
    const matchedAccount = globalServerAccountsStore.find(acc => acc.contactEmail.toLowerCase() === cleanedEmail);
    if (matchedAccount) {
      return NextResponse.json({ success: true, account: matchedAccount });
    }
    return NextResponse.json({ success: false, message: 'Correo no registrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true, accounts: globalServerAccountsStore });
}

export async function POST(req: Request) {
  try {
    loadAccountsFromFile();
    const body = await req.json();
    const { action, accounts, account, accountId, password } = body;

    if (action === 'SYNC' && Array.isArray(accounts)) {
      for (const acc of accounts) {
        const sanitized = sanitizeServerAccount(acc);
        const idx = globalServerAccountsStore.findIndex(a => a.id === sanitized.id || a.contactEmail.toLowerCase() === sanitized.contactEmail.toLowerCase());
        if (idx !== -1) {
          globalServerAccountsStore[idx] = { ...globalServerAccountsStore[idx], ...sanitized };
        } else {
          globalServerAccountsStore.unshift(sanitized);
        }
        await persistAccountToSupabase(sanitized);
      }
      saveAccountsToFile();
      return NextResponse.json({ success: true, accounts: globalServerAccountsStore });
    }

    if (action === 'UPSERT' && account) {
      const sanitized = sanitizeServerAccount(account);
      const idx = globalServerAccountsStore.findIndex(a => a.id === sanitized.id || a.contactEmail.toLowerCase() === sanitized.contactEmail.toLowerCase());
      if (idx !== -1) {
        globalServerAccountsStore[idx] = { ...globalServerAccountsStore[idx], ...sanitized };
      } else {
        globalServerAccountsStore.unshift(sanitized);
      }
      saveAccountsToFile();
      await persistAccountToSupabase(sanitized);
      return NextResponse.json({ success: true, account: sanitized });
    }

    if (action === 'CHANGE_PASSWORD' && (accountId || body.email) && password) {
      const targetEmail = body.email ? body.email.trim().toLowerCase() : null;
      const acc = globalServerAccountsStore.find(a => a.id === accountId || (targetEmail && a.contactEmail.toLowerCase() === targetEmail));
      if (acc) {
        acc.initialPassword = password.trim();
        acc.mustChangePassword = false;
        saveAccountsToFile();
        await persistAccountToSupabase(acc);
        return NextResponse.json({ success: true, account: acc });
      }
      return NextResponse.json({ success: false, message: 'Cuenta no encontrada' }, { status: 404 });
    }

    if (action === 'DELETE' && accountId) {
      const idx = globalServerAccountsStore.findIndex(a => a.id === accountId);
      if (idx !== -1) {
        globalServerAccountsStore.splice(idx, 1);
        saveAccountsToFile();
        return NextResponse.json({ success: true, message: 'Cuenta eliminada en servidor central' });
      }
      return NextResponse.json({ success: false, message: 'Cuenta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
