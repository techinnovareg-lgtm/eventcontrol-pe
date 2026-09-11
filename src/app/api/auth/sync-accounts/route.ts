import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  status: 'ACTIVA' | 'SUSPENDIDA' | 'VENCIDA';
  mustChangePassword?: boolean;
  initialPassword?: string;
  passwordHashMasked: string;
  created_at: string;
}

const INITIAL_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'usr-admin-weddingsco',
    workspaceId: 'ws-weddingsco-appqsop',
    companyName: 'Weddings Co',
    adminName: 'SOP Prueba',
    contactEmail: 'appqsop@gmail.com',
    contactPhone: '+51 999 888 777',
    planCode: 'BUSINESS',
    contractStartDate: '2026-09-07T00:00:00.000Z',
    contractEndDate: '2027-09-07T23:59:59.000Z',
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
    contractStartDate: '2026-08-01T00:00:00.000Z',
    contractEndDate: '2026-09-08T23:59:59.000Z',
    status: 'ACTIVA',
    mustChangePassword: false,
    initialPassword: 'EventControl2026!',
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
    contractEndDate: '2027-08-20T23:59:59.000Z',
    status: 'ACTIVA',
    mustChangePassword: true,
    initialPassword: 'EventControl2026!',
    passwordHashMasked: '••••••••••••',
    created_at: '2026-08-20T00:00:00.000Z',
  },
];

let globalServerAccountsStore: AdminAccount[] = [];

const ACCOUNTS_DB_FILE = path.join(process.cwd(), 'data', 'server_accounts_db.json');

function loadAccountsFromFile() {
  try {
    if (fs.existsSync(ACCOUNTS_DB_FILE)) {
      const raw = fs.readFileSync(ACCOUNTS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge file accounts with INITIAL_ADMIN_ACCOUNTS so defaults are always available
        INITIAL_ADMIN_ACCOUNTS.forEach(initAcc => {
          if (!parsed.some((a: AdminAccount) => a.contactEmail.toLowerCase() === initAcc.contactEmail.toLowerCase())) {
            parsed.unshift(initAcc);
          }
        });
        globalServerAccountsStore = parsed;
        return;
      }
    }
  } catch (e) {}
  globalServerAccountsStore = [...INITIAL_ADMIN_ACCOUNTS];
  saveAccountsToFile();
}

function saveAccountsToFile() {
  try {
    const dir = path.dirname(ACCOUNTS_DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${ACCOUNTS_DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempFile, JSON.stringify(globalServerAccountsStore, null, 2), 'utf-8');
    try {
      if (fs.existsSync(ACCOUNTS_DB_FILE)) fs.unlinkSync(ACCOUNTS_DB_FILE);
      fs.renameSync(tempFile, ACCOUNTS_DB_FILE);
    } catch {
      fs.copyFileSync(tempFile, ACCOUNTS_DB_FILE);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  } catch (e) {
    console.error('[saveAccountsToFile Error]', e);
  }
}

loadAccountsFromFile();

export async function GET(req: Request) {
  loadAccountsFromFile();
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const password = searchParams.get('password');

  if (email && password) {
    const cleanedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    const matchedAccount = globalServerAccountsStore.find(acc => acc.contactEmail.toLowerCase() === cleanedEmail);

    if (matchedAccount) {
      if (matchedAccount.status === 'SUSPENDIDA' || matchedAccount.status === 'VENCIDA') {
        return NextResponse.json({ success: false, message: `Cuenta ${matchedAccount.status.toLowerCase()}` }, { status: 403 });
      }

      const expectedPassword = matchedAccount.initialPassword || 'EventControl2026!';
      const isDefaultInitial = expectedPassword.toLowerCase() === 'eventcontrol2026!';
      const isPassMatch = isDefaultInitial 
        ? trimmedPass.toLowerCase() === 'eventcontrol2026!'
        : trimmedPass === expectedPassword;

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
      accounts.forEach((acc: AdminAccount) => {
        const idx = globalServerAccountsStore.findIndex(a => a.id === acc.id || a.contactEmail.toLowerCase() === acc.contactEmail.toLowerCase());
        if (idx !== -1) {
          globalServerAccountsStore[idx] = { ...globalServerAccountsStore[idx], ...acc };
        } else {
          globalServerAccountsStore.unshift(acc);
        }
      });
      saveAccountsToFile();
      return NextResponse.json({ success: true, accounts: globalServerAccountsStore });
    }

    if (action === 'UPSERT' && account) {
      const idx = globalServerAccountsStore.findIndex(a => a.id === account.id || a.contactEmail.toLowerCase() === account.contactEmail.toLowerCase());
      if (idx !== -1) {
        globalServerAccountsStore[idx] = { ...globalServerAccountsStore[idx], ...account };
      } else {
        globalServerAccountsStore.unshift(account);
      }
      saveAccountsToFile();
      return NextResponse.json({ success: true, account });
    }

    if (action === 'CHANGE_PASSWORD' && (accountId || body.email) && password) {
      const targetEmail = body.email ? body.email.trim().toLowerCase() : null;
      const acc = globalServerAccountsStore.find(a => a.id === accountId || (targetEmail && a.contactEmail.toLowerCase() === targetEmail));
      if (acc) {
        acc.initialPassword = password.trim();
        acc.mustChangePassword = false;
        saveAccountsToFile();
        return NextResponse.json({ success: true, account: acc });
      }
      return NextResponse.json({ success: false, message: 'Cuenta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
