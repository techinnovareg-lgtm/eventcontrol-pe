'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldCheck, Plus, Calendar, Clock, Mail, Phone, Lock, 
  KeyRound, RefreshCw, CheckCircle2, AlertTriangle, UserCheck, 
  Building, LayoutGrid, BarChart3, LogOut, ArrowRight, ShieldAlert, Sparkles,
  Copy, Check, Send, ExternalLink, Eye, EyeOff, Info, MessageSquare, Search, Filter, X,
  Trash2, Archive, ArchiveRestore, History, TrendingUp, DollarSign, Users, Award, Edit3
} from 'lucide-react';
import { 
  getAllAdminAccounts, createAdminAccount, updateAdminAccount, 
  triggerPasswordReset, calculateRemainingDays, extendAdminContract, 
  AdminAccount, getActiveSession, SUPER_ADMIN_EMAIL, sendClientWelcomeEmail,
  setSuperAdminPassword, verifySuperAdminPassword,
  generateAndSendSuperAdmin2FAPin, verifySuperAdmin2FAPin, syncAdminAccountOnlineAsync,
  deleteAdminAccount, toggleArchiveAdminAccount, calculateContractEndDate, calculateContractDurationDays,
  formatContractDateCivil, ContractSubscriptionRecord
} from '@/lib/superadmin-store';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';
import { generateWhatsAppLink } from '@/lib/whatsapp';

export default function SuperAdminPage() {
  const session = getActiveSession();
  const isAuthorized = session?.user?.role === 'SUPER_USER' || session?.user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const [accounts, setAccounts] = useState<AdminAccount[]>(() => getAllAdminAccounts());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [extendingAccount, setExtendingAccount] = useState<AdminAccount | null>(null);
  const [viewingCredentialsAccount, setViewingCredentialsAccount] = useState<AdminAccount | null>(null);
  
  // Superadmin Password Change Modal State
  const [showSuperPassModal, setShowSuperPassModal] = useState(false);
  const [superCurrentPass, setSuperCurrentPass] = useState('');
  const [superNewPass, setSuperNewPass] = useState('');
  const [superConfirmPass, setSuperConfirmPass] = useState('');
  const [superPassMsg, setSuperPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Eye Icon States for Password Visibility
  const [showCurrentPassEye, setShowCurrentPassEye] = useState(false);
  const [showNewPassEye, setShowNewPassEye] = useState(false);
  const [showConfirmPassEye, setShowConfirmPassEye] = useState(false);

  // 2FA Email PIN Verification States for Superadmin Pass Change
  const [super2FAStep, setSuper2FAStep] = useState(false);
  const [super2FAPinInput, setSuper2FAPinInput] = useState('');
  const [super2FAToken, setSuper2FAToken] = useState<string | undefined>(undefined);
  const [super2FATimestamp, setSuper2FATimestamp] = useState<number | undefined>(undefined);
  const [isSending2FAPin, setIsSending2FAPin] = useState(false);

  // Section View Tab State
  const [activeAdminTab, setActiveAdminTab] = useState<'ACCOUNTS' | 'METRICS'>('ACCOUNTS');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVA' | 'EXPIRING_SOON' | 'VENCIDA' | 'ARCHIVADA'>('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | PlanCode>('ALL');

  // Notice & Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [createdNoticeModal, setCreatedNoticeModal] = useState<{
    account: AdminAccount;
    initialPassword: string;
    emailStatus: { success: boolean; message: string; isSandboxRestriction?: boolean; error?: string };
  } | null>(null);

  // Contract History Modal State
  const [historyModalAccount, setHistoryModalAccount] = useState<AdminAccount | null>(null);

  // Delete & Archive Confirmation State
  const [accountToDelete, setAccountToDelete] = useState<AdminAccount | null>(null);

  // Extension Modal State
  const [extensionDays, setExtensionDays] = useState(365);
  const [selectedExtensionPlan, setSelectedExtensionPlan] = useState<PlanCode>('PROFESSIONAL');
  const [extensionNotes, setExtensionNotes] = useState('');

  // Metrics Tab State
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'INITIAL' | 'EXTENSION' | 'PLAN_UPGRADE'>('ALL');

  // New Account Form State (with interactive Date Pickers and auto calculation)
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [planCode, setPlanCode] = useState<PlanCode>('PROFESSIONAL');
  const [durationDays, setDurationDays] = useState(365);
  const [createContractStartDate, setCreateContractStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [createContractEndDate, setCreateContractEndDate] = useState(() => {
    return calculateContractEndDate(new Date().toISOString().split('T')[0], 365).split('T')[0];
  });

  // Edit Account Form State (for Date Pickers)
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // WhatsApp Resend Modal State
  const [resendWhatsAppAccount, setResendWhatsAppAccount] = useState<{ account: AdminAccount; rawPass?: string } | null>(null);
  const [superadminWhatsAppPhone, setSuperadminWhatsAppPhone] = useState<string>('');

  const getSuperadminWhatsAppLink = () => {
    if (!resendWhatsAppAccount) return '#';
    const acc = resendWhatsAppAccount.account;
    const pass = resendWhatsAppAccount.rawPass || acc.initialPassword || 'EventControl2026!';
    const planName = acc.planCode === 'BUSINESS' ? 'Business' : acc.planCode === 'STARTER' ? 'Starter' : 'Professional';
    const endDateFormatted = new Date(acc.contractEndDate).toLocaleDateString('es-PE');

    const text = encodeURIComponent(
      `🎉 ¡Hola ${acc.adminName}! Te recordamos las credenciales de acceso para "${acc.companyName}" en EventControl.pe:\n\n` +
      `🌐 Acceso Web: https://eventcontrol-pe.vercel.app/login\n` +
      `📧 Usuario: ${acc.contactEmail}\n` +
      `🔑 Contraseña Inicial: ${pass}\n` +
      `📦 Plan: Plan ${planName}\n` +
      `📅 Vigencia de Contrato: ${endDateFormatted}\n\n` +
      `Por seguridad, te recomendamos cambiar tu clave al ingresar si aún no lo has hecho.`
    );
    const phoneCleaned = superadminWhatsAppPhone.replace(/[^0-9]/g, '');
    return generateWhatsAppLink(phoneCleaned, text);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4 text-center selection:bg-[#C5A059] selection:text-white">
        <div className="card-luxury p-8 max-w-md w-full space-y-4 border border-[#C5A059]/40 shadow-xl">
          <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Acceso Restringido</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            No posees los privilegios de Super Administrador para acceder a esta consola global. Por favor inicia sesión con las credenciales autorizadas.
          </p>
          <Link
            href="/login"
            style={{ backgroundColor: '#DBBB6E' }}
            className="w-full py-3 text-white font-extrabold text-xs rounded-xl inline-block shadow-md hover:brightness-110"
          >
            Ir a Iniciar Sesión (Credenciales Superadmin)
          </Link>
        </div>
      </div>
    );
  }

  const refreshList = () => {
    setAccounts(getAllAdminAccounts());
  };

  const handleStartSuperPass2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuperPassMsg(null);

    const isCurrentValid = verifySuperAdminPassword(superCurrentPass);
    if (!isCurrentValid) {
      setSuperPassMsg({ type: 'error', text: 'La contraseña actual ingresada es incorrecta.' });
      return;
    }

    if (!superNewPass || superNewPass.trim().length < 8) {
      setSuperPassMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    if (superNewPass !== superConfirmPass) {
      setSuperPassMsg({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }

    // Step 1 Passed: Trigger 2FA PIN dispatch to tech.innova.reg@gmail.com
    setIsSending2FAPin(true);
    const pinRes = await generateAndSendSuperAdmin2FAPin();
    setIsSending2FAPin(false);

    setSuper2FAToken(pinRes.token);
    setSuper2FATimestamp(pinRes.timestamp);
    setSuper2FAStep(true);
    setSuperPassMsg({ type: 'success', text: '✉️ Se ha despachado un código PIN de 4 dígitos a tech.innova.reg@gmail.com. Ingrésalo a continuación para autorizar el cambio.' });
  };

  const handleConfirmSuperPassChangeWith2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuperPassMsg(null);

    if (!super2FAPinInput || super2FAPinInput.trim().length < 4) {
      setSuperPassMsg({ type: 'error', text: 'Ingrese el código PIN de 4 dígitos recibido en su correo.' });
      return;
    }

    const isValid = await verifySuperAdmin2FAPin(super2FAPinInput, super2FAToken, super2FATimestamp);
    if (!isValid) {
      setSuperPassMsg({ type: 'error', text: 'Código PIN 2FA incorrecto o expirado. Revisa tu correo tech.innova.reg@gmail.com.' });
      return;
    }

    // 2FA Validated -> Persist new Superadmin Password
    setSuperAdminPassword(superNewPass);
    setSuperCurrentPass('');
    setSuperNewPass('');
    setSuperConfirmPass('');
    setSuper2FAPinInput('');
    setSuper2FAStep(false);
    setSuperPassMsg({ type: 'success', text: '🎉 ¡Contraseña de Superadmin actualizada y verificada con 2FA exitosamente!' });

    setTimeout(() => {
      setShowSuperPassModal(false);
      setSuperPassMsg(null);
    }, 2500);
  };

  // Auto calculate expiration date when create contract start date or duration changes
  const handleCreateStartDateChange = (newStartDate: string) => {
    setCreateContractStartDate(newStartDate);
    const newEnd = calculateContractEndDate(newStartDate, durationDays);
    setCreateContractEndDate(newEnd.split('T')[0]);
  };

  const handleCreateDurationChange = (newDuration: number) => {
    setDurationDays(newDuration);
    const newEnd = calculateContractEndDate(createContractStartDate, newDuration);
    setCreateContractEndDate(newEnd.split('T')[0]);
  };

  const handleCreatePlanChange = (newPlan: PlanCode) => {
    setPlanCode(newPlan);
    if (newPlan === 'STARTER' && durationDays !== 30) {
      setDurationDays(30);
      const newEnd = calculateContractEndDate(createContractStartDate, 30);
      setCreateContractEndDate(newEnd.split('T')[0]);
    }
  };

  // Filter accounts taking into consideration ARCHIVADA filter
  const filteredAccounts = accounts.filter((acc) => {
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      const matchCompany = acc.companyName.toLowerCase().includes(term);
      const matchAdmin = acc.adminName.toLowerCase().includes(term);
      const matchEmail = acc.contactEmail.toLowerCase().includes(term);
      if (!matchCompany && !matchAdmin && !matchEmail) return false;
    }

    const remDays = calculateRemainingDays(acc.contractEndDate);
    if (statusFilter === 'ACTIVA') {
      if (acc.status !== 'ACTIVA' || acc.isArchived) return false;
    } else if (statusFilter === 'EXPIRING_SOON') {
      if (acc.isArchived || remDays > 7 || acc.status === 'VENCIDA') return false;
    } else if (statusFilter === 'VENCIDA') {
      if (acc.isArchived || acc.status === 'ACTIVA') return false;
    } else if (statusFilter === 'ARCHIVADA') {
      if (!acc.isArchived && acc.status !== 'ARCHIVADA') return false;
    } else if (statusFilter === 'ALL') {
      // By default in ALL, hide archived unless specifically searching or selecting ARCHIVADA
      if (acc.isArchived && !searchTerm) return false;
    }

    if (planFilter !== 'ALL' && acc.planCode !== planFilter) return false;

    return true;
  });

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminName || !contactEmail) return;

    setIsSubmitting(true);
    const { account, assignedPassword } = createAdminAccount({
      companyName,
      adminName,
      contactEmail,
      contactPhone,
      planCode,
      durationDays,
      contractStartDate: createContractStartDate ? new Date(createContractStartDate).toISOString() : undefined,
      contractEndDate: createContractEndDate ? new Date(createContractEndDate).toISOString() : undefined,
    });

    await syncAdminAccountOnlineAsync(account);

    const emailStatus = await sendClientWelcomeEmail({
      contactEmail,
      adminName,
      companyName,
      initialPassword: assignedPassword,
    });

    setIsSubmitting(false);
    setCompanyName('');
    setAdminName('');
    setContactEmail('');
    setContactPhone('');
    setIsCreateModalOpen(false);
    refreshList();

    setCreatedNoticeModal({
      account,
      initialPassword: assignedPassword,
      emailStatus,
    });
  };

  const handleResendEmail = async (account: AdminAccount) => {
    setIsSubmitting(true);
    const pass = account.initialPassword || 'EventControl2026!';
    const emailStatus = await sendClientWelcomeEmail({
      contactEmail: account.contactEmail,
      adminName: account.adminName,
      companyName: account.companyName,
      initialPassword: pass,
    });
    setIsSubmitting(false);

    if (emailStatus.success) {
      setNoticeMessage(`✅ Correo de bienvenida re-enviado exitosamente a ${account.contactEmail}.`);
      setTimeout(() => setNoticeMessage(null), 8000);
    } else {
      setCreatedNoticeModal({
        account,
        initialPassword: pass,
        emailStatus,
      });
    }
  };

  const handleOpenExtendModal = (account: AdminAccount) => {
    setExtendingAccount(account);
    setSelectedExtensionPlan(account.planCode);
    setExtensionNotes('');
  };

  const handleExtendContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingAccount) return;

    const result = extendAdminContract(extendingAccount.id, extensionDays, selectedExtensionPlan, extensionNotes);
    setExtendingAccount(null);
    refreshList();
    setNoticeMessage(result.message);
    setTimeout(() => setNoticeMessage(null), 8000);
  };

  const handleTriggerReset = (account: AdminAccount) => {
    if (confirm(`¿Restablecer contraseña para la cuenta de "${account.companyName}"? Se activará el cambio de clave obligatorio para su próximo ingreso.`)) {
      const res = triggerPasswordReset(account.id);
      refreshList();
      setNoticeMessage(res.message);
      setTimeout(() => setNoticeMessage(null), 8000);
    }
  };

  const handleOpenEditAccount = (acc: AdminAccount) => {
    setEditingAccount({ ...acc });
    try {
      const s = new Date(acc.contractStartDate).toISOString().split('T')[0];
      const e = new Date(acc.contractEndDate).toISOString().split('T')[0];
      setEditStartDate(s);
      setEditEndDate(e);
    } catch (err) {
      setEditStartDate('');
      setEditEndDate('');
    }
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const finalStartDate = editStartDate ? new Date(editStartDate).toISOString() : editingAccount.contractStartDate;
    const finalEndDate = editEndDate ? new Date(editEndDate).toISOString() : editingAccount.contractEndDate;

    updateAdminAccount(editingAccount.id, {
      companyName: editingAccount.companyName,
      adminName: editingAccount.adminName,
      contactEmail: editingAccount.contactEmail,
      contactPhone: editingAccount.contactPhone,
      planCode: editingAccount.planCode,
      status: editingAccount.status,
      contractStartDate: finalStartDate,
      contractEndDate: finalEndDate,
    });

    setEditingAccount(null);
    refreshList();
    setNoticeMessage(`¡Atributos de la cuenta "${editingAccount.companyName}" actualizados exitosamente!`);
    setTimeout(() => setNoticeMessage(null), 6000);
  };

  const handleToggleArchive = (account: AdminAccount) => {
    const actionLabel = account.isArchived ? 'restaurar' : 'archivar';
    if (confirm(`¿Estás seguro de ${actionLabel} la cuenta de "${account.companyName}"?`)) {
      const res = toggleArchiveAdminAccount(account.id);
      refreshList();
      setNoticeMessage(res.message);
      setTimeout(() => setNoticeMessage(null), 8000);
    }
  };

  const handleConfirmDelete = () => {
    if (!accountToDelete) return;
    const res = deleteAdminAccount(accountToDelete.id);
    setAccountToDelete(null);
    refreshList();
    setNoticeMessage(res.message);
    setTimeout(() => setNoticeMessage(null), 8000);
  };

  // ==========================================
  // SUBSCRIPTIONS & FINANCIAL METRICS COMPUTATIONS
  // ==========================================
  const allHistoryRecords = accounts.flatMap((acc) => {
    const list = acc.contractHistory && acc.contractHistory.length > 0
      ? acc.contractHistory
      : [{
          id: `${acc.id}-initial`,
          type: 'INITIAL' as const,
          planCode: acc.planCode,
          startDate: acc.contractStartDate,
          endDate: acc.contractEndDate,
          durationDays: calculateContractDurationDays(acc.contractStartDate, acc.contractEndDate),
          pricePEN: acc.planCode === 'BUSINESS' ? 99.99 : acc.planCode === 'STARTER' ? 29.99 : 59.99,
          created_at: acc.created_at || acc.contractStartDate,
          notes: 'Contrato inicial de apertura',
        }];
    return list.map((rec) => ({
      ...rec,
      companyName: acc.companyName,
      adminName: acc.adminName,
      contactEmail: acc.contactEmail,
      accountStatus: acc.status,
      isArchived: acc.isArchived,
    }));
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filtered subscriptions for Metrics Table
  const filteredHistoryRecords = allHistoryRecords.filter((rec) => {
    if (historyTypeFilter !== 'ALL' && rec.type !== historyTypeFilter) return false;
    const term = historySearchTerm.trim().toLowerCase();
    if (term) {
      const matchComp = rec.companyName.toLowerCase().includes(term);
      const matchAdmin = rec.adminName.toLowerCase().includes(term);
      const matchEmail = rec.contactEmail.toLowerCase().includes(term);
      const matchNotes = (rec.notes || '').toLowerCase().includes(term);
      if (!matchComp && !matchAdmin && !matchEmail && !matchNotes) return false;
    }
    return true;
  });

  // Financial & Operational Aggregates
  const activeAccountsCount = accounts.filter(a => a.status === 'ACTIVA' && !a.isArchived).length;
  const archivedAccountsCount = accounts.filter(a => a.isArchived || a.status === 'ARCHIVADA').length;
  const expiredAccountsCount = accounts.filter(a => a.status === 'VENCIDA' && !a.isArchived).length;

  // Monthly Recurring Revenue (MRR) estimated from active accounts
  const estimatedMRR = accounts
    .filter(a => a.status === 'ACTIVA' && !a.isArchived)
    .reduce((sum, a) => {
      const price = a.planCode === 'BUSINESS' ? 99.99 : a.planCode === 'STARTER' ? 29.99 : 59.99;
      return sum + price;
    }, 0);

  // Total Lifetime Billing estimated from all recorded transactions
  const totalLifetimeRevenue = allHistoryRecords.reduce((sum, rec) => {
    return sum + (rec.pricePEN || (rec.planCode === 'BUSINESS' ? 99.99 : rec.planCode === 'STARTER' ? 29.99 : 59.99));
  }, 0);

  const totalExtensionsCount = allHistoryRecords.filter(r => r.type === 'EXTENSION' || r.type === 'PLAN_UPGRADE').length;

  // Plan Breakdown for Active Accounts
  const starterCount = accounts.filter(a => a.planCode === 'STARTER' && !a.isArchived).length;
  const proCount = accounts.filter(a => a.planCode === 'PROFESSIONAL' && !a.isArchived).length;
  const bizCount = accounts.filter(a => a.planCode === 'BUSINESS' && !a.isArchived).length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white">
      {/* Top Executive Super User Header */}
      <header className="border-b-2 border-[#C5A059] bg-[#0B132B] text-white sticky top-0 z-40 shadow-xl select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-4">
          
          {/* Executive Brand Logo & Title */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border-2 border-[#C5A059] bg-white p-1 shrink-0">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl Logo" 
                fill 
                className="object-cover"
              />
            </div>

            <div>
              <span className="text-2xl font-bold tracking-tight text-white font-serif block leading-none">
                EventControl<span className="text-[#DBBB6E]">.pe</span>
              </span>
              <span className="text-[10px] text-amber-200/90 uppercase tracking-widest font-semibold block font-mono mt-1">
                Gestión Central de Plataforma & Licencias
              </span>
            </div>

            <div className="hidden md:flex items-center pl-4 border-l border-slate-700/80 h-10">
              <span className="px-3.5 py-1.5 rounded-xl text-xs bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-white font-serif font-bold uppercase shadow-sm flex items-center gap-1.5 border border-amber-300/40">
                <ShieldCheck className="w-4 h-4 text-white" /> Consola Superadmin
              </span>
            </div>
          </div>

          {/* Superadmin Active Profile & Password Action */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 h-11 rounded-xl border border-[#C5A059]/40 shadow-inner">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#DBBB6E] to-[#B8860B] flex items-center justify-center text-white font-bold text-xs shadow-sm border border-amber-200">
                TI
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-white block leading-tight">Tech Innova Super Admin</span>
                <span className="text-[10px] text-slate-300 font-mono block">tech.innova.reg@gmail.com</span>
              </div>
            </div>

            <button
              onClick={() => setShowSuperPassModal(true)}
              className="h-11 px-3.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-400/40 transition flex items-center gap-1.5 shadow-sm"
              title="Cambiar Contraseña de Superadmin"
            >
              <Lock className="w-4 h-4 text-[#DBBB6E]" />
              <span className="hidden sm:inline">Cambiar Clave Superadmin</span>
            </button>

            <Link 
              href="/login" 
              className="h-11 px-4 bg-slate-800/80 hover:bg-red-950/80 text-slate-200 hover:text-red-200 font-bold text-xs rounded-xl border border-[#C5A059]/40 hover:border-red-800/60 transition flex items-center gap-2 shadow-sm" 
              title="Cerrar Sesión Super User"
            >
              <LogOut className="w-4 h-4 text-[#DBBB6E]" /> <span className="hidden xs:inline">Cerrar Sesión</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">
        
        {/* Notice Alert Banner */}
        {noticeMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-2xl flex items-center gap-3 shadow-md animate-fade-in-up">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Title Bar & Action */}
        <div className="card-luxury p-6 border border-[#C5A059]/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">Panel Super Administrador (Admin de Admins)</span>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">Gestión de Cuentas y Contraseñas de Acceso</h1>
            <p className="text-xs text-slate-500">Administra cuentas cliente, visualiza claves de acceso iniciales y re-envía correos de bienvenida.</p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{ backgroundColor: '#DBBB6E' }}
            className="hover:brightness-110 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Crear Nueva Cuenta de Administrador
          </button>
        </div>

        {/* TABS SELECTOR: ACCOUNTS DIRECTORY VS METRICS DASHBOARD */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveAdminTab('ACCOUNTS')}
            className={`pb-3 px-4 font-serif text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 ${
              activeAdminTab === 'ACCOUNTS'
                ? 'border-[#B8860B] text-[#B8860B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            Directorio de Cuentas ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab('METRICS')}
            className={`pb-3 px-4 font-serif text-sm font-bold flex items-center gap-2 border-b-2 transition shrink-0 ${
              activeAdminTab === 'METRICS'
                ? 'border-[#B8860B] text-[#B8860B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard & Métricas de Suscripciones
            <span className="text-[10px] bg-amber-100 text-[#B8860B] font-mono px-2 py-0.5 rounded-full border border-amber-300">
              {allHistoryRecords.length} movimientos
            </span>
          </button>
        </div>

        {activeAdminTab === 'ACCOUNTS' ? (
          <>
            {/* Executive KPI Summary Cards with Interactive Filter Triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          <div 
            onClick={() => { setStatusFilter('ALL'); setPlanFilter('ALL'); setSearchTerm(''); }}
            className={`card-luxury p-5 border cursor-pointer transition hover-lift ${statusFilter === 'ALL' && planFilter === 'ALL' && !searchTerm ? 'border-[#C5A059] bg-amber-50/60 ring-2 ring-[#C5A059]/40' : 'border-[#C5A059]/30'}`}
          >
            <span className="text-xs text-slate-500 uppercase font-semibold block">Cuentas Administradoras</span>
            <strong className="text-3xl font-serif font-bold text-[#1A1A1A] mt-1 block">{accounts.length}</strong>
          </div>

          <div 
            onClick={() => setStatusFilter('ACTIVA')}
            className={`card-luxury p-5 border cursor-pointer transition hover-lift ${statusFilter === 'ACTIVA' ? 'border-emerald-500 bg-emerald-100/70 ring-2 ring-emerald-400' : 'border-emerald-200 bg-emerald-50/50'}`}
          >
            <span className="text-xs text-emerald-800 uppercase font-semibold block">Cuentas Activas</span>
            <strong className="text-3xl font-serif font-bold text-emerald-700 mt-1 block">
              {accounts.filter(a => a.status === 'ACTIVA').length}
            </strong>
          </div>

          <div 
            onClick={() => setStatusFilter('EXPIRING_SOON')}
            className={`card-luxury p-5 border cursor-pointer transition hover-lift ${statusFilter === 'EXPIRING_SOON' ? 'border-amber-500 bg-amber-100/80 ring-2 ring-amber-400' : 'border-amber-200 bg-amber-50/50'}`}
          >
            <span className="text-xs text-amber-800 uppercase font-semibold block">Próximos a Vencer (&lt; 7 días)</span>
            <strong className="text-3xl font-serif font-bold text-amber-700 mt-1 block">
              {accounts.filter(a => calculateRemainingDays(a.contractEndDate) <= 7).length}
            </strong>
          </div>

          <div 
            onClick={() => { setPlanFilter('ALL'); setStatusFilter('ALL'); }}
            className="card-luxury p-5 border border-purple-200 bg-purple-50/50 cursor-pointer transition hover-lift"
          >
            <span className="text-xs text-purple-900 uppercase font-semibold block">Planes Professional / Business</span>
            <strong className="text-3xl font-serif font-bold text-purple-800 mt-1 block">
              {accounts.filter(a => a.planCode !== 'STARTER').length}
            </strong>
          </div>
        </div>

        {/* INTERACTIVE FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Empresa, Administrador o Correo..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:outline-none text-slate-800 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-600 shrink-0 uppercase tracking-wider text-[11px]">Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-semibold text-slate-800"
            >
              <option value="ALL">Todas las Cuentas ({accounts.length})</option>
              <option value="ACTIVA">Cuentas Activas</option>
              <option value="EXPIRING_SOON">⚠️ Próximos a Vencer (&lt;= 7 días)</option>
              <option value="VENCIDA">Vencidas / Suspendidas</option>
              <option value="ARCHIVADA">📦 Cuentas Archivadas ({accounts.filter(a => a.isArchived || a.status === 'ARCHIVADA').length})</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-600 shrink-0 uppercase tracking-wider text-[11px]">Plan:</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-semibold text-slate-800"
            >
              <option value="ALL">Todos los Planes</option>
              <option value="STARTER">Plan Starter (S/29.99)</option>
              <option value="PROFESSIONAL">Plan Professional (S/59.99)</option>
              <option value="BUSINESS">Plan Business (S/99.99)</option>
            </select>
          </div>
        </div>

        {/* Managed Client Accounts List */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#B8860B]" /> Cuentas Administradoras ({filteredAccounts.length} de {accounts.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Filtros activos aplicados</span>
          </div>

          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
              <Filter className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">No se encontraron cuentas con los filtros seleccionados.</p>
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setPlanFilter('ALL'); }}
                className="text-[#B8860B] font-bold underline"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-300 font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Empresa / Planner</th>
                    <th className="py-2.5 px-3">Administrador & Correo</th>
                    <th className="py-2.5 px-3">Plan Contratado</th>
                    <th className="py-2.5 px-3">Fecha Contrato</th>
                    <th className="py-2.5 px-3">Vencimiento & Días</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acciones de Cuenta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAccounts.map((acc) => {
                    const remDays = calculateRemainingDays(acc.contractEndDate);
                    const plan = PLAN_LIMITS[acc.planCode];
                    const isNearExpiration = remDays <= 7 && acc.status === 'ACTIVA';
                    const historyCount = acc.contractHistory?.length || 1;

                    return (
                      <tr key={acc.id} className={`hover:bg-amber-50/40 transition ${isNearExpiration ? 'bg-amber-50/70' : acc.isArchived ? 'bg-slate-100/60 opacity-80' : ''}`}>
                      
                      {/* Empresa / Planner */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <strong className="font-bold text-slate-900 block text-xs max-w-[170px] truncate" title={acc.companyName}>{acc.companyName}</strong>
                          {acc.isArchived && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-200 text-slate-700 border border-slate-300 shrink-0">
                              ARCHIVADA
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block max-w-[170px] truncate">WS: {acc.workspaceId}</span>
                      </td>

                      {/* Administrador & Correo */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block text-xs max-w-[170px] truncate" title={acc.adminName}>{acc.adminName}</span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 max-w-[170px] truncate" title={acc.contactEmail}>
                          <Mail className="w-3 h-3 text-[#B8860B] shrink-0" /> {acc.contactEmail}
                        </span>
                        {acc.contactPhone && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {acc.contactPhone}
                          </span>
                        )}
                      </td>

                      {/* Plan Contratado */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-bold text-[11px] shadow-2xs bg-amber-50 text-[#B8860B] border-[#DBBB6E]/50">
                          <span>Plan {plan.name}</span>
                          <span className="text-[9px] font-normal text-slate-500">(S/{plan.monthlyPricePEN})</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {plan.maxActiveEvents === -1 ? 'Ilimitados' : plan.maxActiveEvents} evts • {plan.maxPassesPerEvent} pases
                        </span>
                      </td>

                      {/* Fecha Contrato */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-slate-800 block font-bold text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#B8860B]" />
                          {formatContractDateCivil(acc.contractStartDate)}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">Inicio oficial</span>
                      </td>

                      {/* Vencimiento & Días */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-slate-800 block font-bold text-xs">
                          {formatContractDateCivil(acc.contractEndDate)}
                        </span>
                        <span className={`text-[9px] font-extrabold block ${
                          acc.status === 'ARCHIVADA' ? 'text-slate-500' :
                          remDays <= 7 ? 'text-red-600 animate-pulse' : 'text-emerald-700'
                        }`}>
                          {acc.status === 'ARCHIVADA' ? 'Archivada' : remDays <= 7 ? `⚠️ Alerta: ${remDays}d` : `${remDays}d restantes`}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                          acc.status === 'ACTIVA' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          acc.status === 'ARCHIVADA' ? 'bg-slate-200 text-slate-800 border-slate-300' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {acc.status}
                        </span>
                      </td>

                      {/* Acciones de Cuenta - Compact Executive Action Bar */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          {/* Extender Contrato */}
                          <button
                            onClick={() => handleOpenExtendModal(acc)}
                            style={{ backgroundColor: '#DBBB6E' }}
                            className="px-2 py-1 text-white font-bold rounded-lg transition text-[11px] shadow-2xs hover:brightness-110 flex items-center gap-1"
                            title="Extender Contrato / Renovar Plan tras Pago"
                          >
                            <Plus className="w-3 h-3" /> Extender
                          </button>

                          {/* Ver Historial de Suscripciones */}
                          <button
                            onClick={() => setHistoryModalAccount(acc)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-lg border border-indigo-200 transition text-[11px] inline-flex items-center gap-1 shadow-2xs"
                            title="Ver histórico de extensiones y renovaciones"
                          >
                            <History className="w-3 h-3 text-indigo-600" /> Histórico ({historyCount})
                          </button>

                          {/* Enviar Credenciales por WhatsApp */}
                          <button
                            onClick={() => {
                              setResendWhatsAppAccount({ account: acc });
                              setSuperadminWhatsAppPhone(acc.contactPhone || '');
                            }}
                            className="w-7 h-7 inline-flex items-center justify-center bg-[#25D366]/10 hover:bg-[#25D366]/20 text-emerald-800 rounded-lg border border-[#25D366]/40 transition shadow-2xs"
                            title="Enviar credenciales de acceso por WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          {/* Re-enviar Correo de Bienvenida */}
                          <button
                            onClick={() => handleResendEmail(acc)}
                            disabled={isSubmitting}
                            className="w-7 h-7 inline-flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg border border-sky-300 transition shadow-2xs disabled:opacity-50"
                            title="Re-enviar Correo de Bienvenida con Credenciales"
                          >
                            <Mail className="w-3.5 h-3.5 text-sky-600" />
                          </button>

                          {/* Editar Atributos de Cuenta */}
                          <button
                            onClick={() => handleOpenEditAccount(acc)}
                            className="w-7 h-7 inline-flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-[#B8860B] rounded-lg border border-[#C5A059]/40 transition shadow-2xs"
                            title="Editar Atributos de Cuenta (fechas de contrato, plan, datos)"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#B8860B]" />
                          </button>

                          {/* Reset Clave de Acceso */}
                          <button
                            onClick={() => handleTriggerReset(acc)}
                            className="w-7 h-7 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition shadow-2xs"
                            title="Restablecer Contraseña Privada del Cliente"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {/* Archivar / Restaurar */}
                          <button
                            onClick={() => handleToggleArchive(acc)}
                            className={`w-7 h-7 inline-flex items-center justify-center rounded-lg border transition shadow-2xs ${
                              acc.isArchived
                                ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                            }`}
                            title={acc.isArchived ? 'Restaurar Cuenta del Archivo' : 'Archivar Cuenta (Ocultar sin borrar histórico)'}
                          >
                            {acc.isArchived ? (
                              <ArchiveRestore className="w-3.5 h-3.5 text-sky-600" />
                            ) : (
                              <Archive className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </button>

                          {/* Eliminar Permanentemente */}
                          <button
                            onClick={() => setAccountToDelete(acc)}
                            className="w-7 h-7 inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-300 transition shadow-2xs"
                            title="Eliminar Cuenta Permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Financial & Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-luxury p-5 border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-emerald-800">Facturación Acumulada</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-700">
            S/ {totalLifetimeRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500">Total histórico de contratos e ingresos registrados</p>
        </div>

        <div className="card-luxury p-5 border border-[#C5A059]/40 bg-gradient-to-br from-amber-50 to-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[#B8860B]">MRR Estimado</span>
            <TrendingUp className="w-4 h-4 text-[#B8860B]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#1A1A1A]">
            S/ {estimatedMRR.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-slate-500 font-sans font-normal"> / mes</span>
          </div>
          <p className="text-[11px] text-slate-500">{activeAccountsCount} cuentas activas recurrentes</p>
        </div>

        <div className="card-luxury p-5 border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-blue-800">Transacciones Históricas</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-blue-700">
            {allHistoryRecords.length}
          </div>
          <p className="text-[11px] text-slate-500">{totalExtensionsCount} renovaciones y upgrades</p>
        </div>

        <div className="card-luxury p-5 border border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-purple-800">Estado de Cartera</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-purple-900">
            {accounts.length}
            <span className="text-xs text-slate-500 font-sans font-normal"> cuentas</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-semibold pt-0.5">
            <span className="text-emerald-700 font-bold">✓ {activeAccountsCount} Activas</span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-700 font-bold">⚠️ {expiredAccountsCount} Vencidas</span>
            <span className="text-slate-400">|</span>
            <span className="text-sky-700 font-bold">📦 {archivedAccountsCount} Arch.</span>
          </div>
        </div>
      </div>

      {/* Plan Breakdown Progress Cards */}
      <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#B8860B]" /> Desglose de Suscripciones por Plan
            </h3>
            <p className="text-xs text-slate-500">Distribución de clientes activos según el nivel de suscripción y límites de operación</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
            {activeAccountsCount} Cuentas Activas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Starter */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-slate-700">Plan Starter</span>
              <span className="text-xs font-bold text-slate-900 font-mono">S/ 29.99/mes</span>
            </div>
            <div className="text-2xl font-serif font-bold text-slate-800">
              {starterCount} <span className="text-xs text-slate-500 font-sans font-normal">empresas ({activeAccountsCount > 0 ? Math.round((starterCount / activeAccountsCount) * 100) : 0}%)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-slate-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${activeAccountsCount > 0 ? (starterCount / activeAccountsCount) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">Hasta 3 eventos simultáneos y 150 pases QR por evento.</p>
          </div>

          {/* Professional */}
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-amber-900">Plan Professional</span>
              <span className="text-xs font-bold text-amber-900 font-mono">S/ 59.99/mes</span>
            </div>
            <div className="text-2xl font-serif font-bold text-amber-800">
              {proCount} <span className="text-xs text-amber-900/70 font-sans font-normal">empresas ({activeAccountsCount > 0 ? Math.round((proCount / activeAccountsCount) * 100) : 0}%)</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2">
              <div 
                className="bg-[#B8860B] h-2 rounded-full transition-all duration-500" 
                style={{ width: `${activeAccountsCount > 0 ? (proCount / activeAccountsCount) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[11px] text-amber-900/80">Hasta 10 eventos simultáneos y 500 pases QR por evento.</p>
          </div>

          {/* Business */}
          <div className="p-4 rounded-xl border border-purple-300 bg-purple-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-purple-900">Plan Business</span>
              <span className="text-xs font-bold text-purple-900 font-mono">S/ 99.99/mes</span>
            </div>
            <div className="text-2xl font-serif font-bold text-purple-800">
              {bizCount} <span className="text-xs text-purple-900/70 font-sans font-normal">empresas ({activeAccountsCount > 0 ? Math.round((bizCount / activeAccountsCount) * 100) : 0}%)</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-700 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${activeAccountsCount > 0 ? (bizCount / activeAccountsCount) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[11px] text-purple-900/80">Eventos ilimitados y hasta 1,000 pases QR por evento.</p>
          </div>
        </div>
      </div>

      {/* Global Historical Audit Log Table */}
      <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <History className="w-5 h-5 text-[#B8860B]" /> Auditoría Consolidada de Suscripciones & Contratos
            </h3>
            <p className="text-xs text-slate-500">
              Trazabilidad inmutable de aperturas de contratos, renovaciones y upgrades de todas las empresas ({filteredHistoryRecords.length} movimientos)
            </p>
          </div>

          {/* Filters for History Table */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                placeholder="Buscar empresa, admin o nota..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#C5A059] focus:outline-none w-48 sm:w-60"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
            >
              <option value="ALL">Todos los Movimientos</option>
              <option value="INITIAL">Apertura (INITIAL)</option>
              <option value="EXTENSION">Renovación (EXTENSION)</option>
              <option value="PLAN_UPGRADE">Cambio Plan (UPGRADE)</option>
            </select>
          </div>
        </div>

        {filteredHistoryRecords.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
            <Filter className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            No se encontraron movimientos históricos con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Empresa / Planner</th>
                  <th className="py-3 px-3.5 whitespace-nowrap min-w-[155px]">Tipo Movimiento</th>
                  <th className="py-3 px-3 whitespace-nowrap">Plan Contratado</th>
                  <th className="py-3 px-3 whitespace-nowrap">Vigencia Contrato</th>
                  <th className="py-3 px-3 whitespace-nowrap">Duración</th>
                  <th className="py-3 px-3 whitespace-nowrap">Monto Est.</th>
                  <th className="py-3 px-3">Notas / Referencia</th>
                  <th className="py-3 px-4 whitespace-nowrap">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistoryRecords.map((rec) => {
                  return (
                    <tr key={rec.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block font-bold text-xs">{rec.companyName}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">{rec.contactEmail}</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap min-w-[155px]">
                        {rec.type === 'INITIAL' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Contrato Inicial
                          </span>
                        )}
                        {rec.type === 'EXTENSION' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 whitespace-nowrap shadow-2xs">
                            <RefreshCw className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Renovación (+{rec.durationDays}d)
                          </span>
                        )}
                        {rec.type === 'PLAN_UPGRADE' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 whitespace-nowrap shadow-2xs">
                            <TrendingUp className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Upgrade de Plan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-xs">
                          Plan {PLAN_LIMITS[rec.planCode].name}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {formatContractDateCivil(rec.startDate)} ➔ {formatContractDateCivil(rec.endDate)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600 whitespace-nowrap">
                        {rec.durationDays} días
                      </td>
                      <td className="py-3 px-3 font-bold font-mono text-emerald-700 whitespace-nowrap">
                        S/ {(rec.pricePEN || (rec.planCode === 'BUSINESS' ? 99.99 : rec.planCode === 'STARTER' ? 29.99 : 59.99)).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 italic text-[11px] max-w-xs truncate" title={rec.notes || 'Sin notas'}>
                        {rec.notes || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(rec.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )}
      </main>

      {/* MODAL: POST-CREATION NOTICE & EMAIL / WHATSAPP STATUS FEEDBACK */}
      {createdNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full card-luxury p-6 shadow-2xl border-2 border-[#C5A059] space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#B8860B]" /> Resultado de Creación de Cuenta
              </h3>
            </div>

            {/* Email Dispatch Result Badge */}
            {createdNoticeModal.emailStatus.success ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">¡Correo despachado exitosamente!</strong>
                  <span>Se ha enviado el correo de bienvenida con las credenciales a <strong>{createdNoticeModal.account.contactEmail}</strong> vía Resend API.</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-bold block">Atención sobre el Envío de Correo:</strong>
                  <span>{createdNoticeModal.emailStatus.message}</span>
                  {createdNoticeModal.emailStatus.isSandboxRestriction && (
                    <p className="text-[11px] text-amber-800 font-medium pt-1">
                      💡 <strong>Causa Resend Sandbox:</strong> Al usar el remite gratuito de prueba (<code className="font-mono">onboarding@resend.dev</code>), Resend solo permite enviar correos a tu propia cuenta registrada (<code className="font-mono">tech.innova.reg@gmail.com</code>). Puedes enviar las credenciales directamente por WhatsApp con el botón a continuación.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Account Credentials Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs border border-[#C5A059]/40 shadow-inner">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Empresa / Cliente:</span>
                <span className="font-serif font-bold text-amber-300 text-sm">{createdNoticeModal.account.companyName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Correo de Usuario:</span>
                <span className="font-mono text-slate-200">{createdNoticeModal.account.contactEmail}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Contraseña Asignada:</span>
                <span className="font-mono font-bold text-amber-400 text-sm bg-slate-800 px-2 py-0.5 rounded border border-amber-500/40">
                  {createdNoticeModal.initialPassword}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Enlace de Login:</span>
                <span className="font-mono text-slate-300 text-[11px]">https://eventcontrol-pe.vercel.app/login</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreatedNoticeModal(null)}
                className="w-full sm:w-1/4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => {
                  const rawPhone = createdNoticeModal.account.contactPhone || '';
                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                  const phoneParam = cleanPhone.length > 0 ? (cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`) : '';
                  const msg = `🎉 ¡Hola ${createdNoticeModal.account.adminName}! Tu cuenta para "${createdNoticeModal.account.companyName}" en EventControl.pe ya está activa.\n\n🌐 Acceso Web: https://eventcontrol-pe.vercel.app/login\n📧 Usuario: ${createdNoticeModal.account.contactEmail}\n🔑 Contraseña Inicial: ${createdNoticeModal.initialPassword}\n\nPor seguridad, te recomendamos cambiar tu clave al ingresar.`;
                  const waUrl = generateWhatsAppLink(phoneParam, msg);
                  window.open(waUrl, '_blank');
                }}
                className="w-full sm:w-2/5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
              >
                <MessageSquare className="w-4 h-4 text-emerald-100" /> Enviar por WhatsApp
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = `🎉 ¡Hola ${createdNoticeModal.account.adminName}! Tu cuenta para "${createdNoticeModal.account.companyName}" en EventControl.pe está activa.\n\nAcceso Web: https://eventcontrol-pe.vercel.app/login\nCorreo: ${createdNoticeModal.account.contactEmail}\nContraseña: ${createdNoticeModal.initialPassword}`;
                  handleCopyText(text, 'created-modal-copy');
                }}
                className="w-full sm:w-1/3 py-2.5 gold-button font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                {copiedKey === 'created-modal-copy' ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
                {copiedKey === 'created-modal-copy' ? '¡Copiado!' : 'Copiar Textos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTEND CONTRACT MODAL */}
      {extendingAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border-2 border-[#DBBB6E] space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Extender Contrato / Renovar Plan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extiende la suscripción para <strong className="text-slate-900">{extendingAccount.companyName}</strong>. La nueva fecha de vencimiento se calculará desde el día siguiente del fin del plan anterior.
            </p>

            <form onSubmit={handleExtendContractSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <div>Vencimiento Previo: <strong className="font-mono">{new Date(extendingAccount.contractEndDate).toLocaleDateString()}</strong></div>
                <div>Plan Actual: <strong>Plan {PLAN_LIMITS[extendingAccount.planCode].name}</strong></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Plan Contratado (Cambiar o Mantener Plan)
                </label>
                <select
                  value={selectedExtensionPlan}
                  onChange={(e) => setSelectedExtensionPlan(e.target.value as PlanCode)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                >
                  <option value="STARTER">Plan Starter (S/29/mes - 3 eventos, 150 pases/evt)</option>
                  <option value="PROFESSIONAL">Plan Professional (S/59/mes - 10 eventos, 500 pases/evt)</option>
                  <option value="BUSINESS">Plan Business (S/99/mes - Ilimitados evts, 1,000 pases/evt)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Período de Extensión tras Pago
                </label>
                <select
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                >
                  <option value={30}>+ 30 Días (Renovación Mensual)</option>
                  <option value={90}>+ 90 Días (Renovación Trimestral)</option>
                  <option value={180}>+ 180 Días (Renovación Semestral)</option>
                  <option value={365}>+ 365 Días (Renovación Anual Oficial)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notas de la Extensión (opcional)
                </label>
                <input
                  type="text"
                  value={extensionNotes}
                  onChange={(e) => setExtensionNotes(e.target.value)}
                  placeholder="Ej. Pago confirmado vía BCP / Factura F001-2026"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendingAccount(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#DBBB6E' }}
                  className="w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md hover:brightness-110"
                >
                  Confirmar Extensión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ADMIN ACCOUNT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Crear Nueva Cuenta de Administrador</h3>
            <p className="text-xs text-slate-500">
              Registra una cuenta de empresa cliente, asigna su plan y genera su acceso automático.
            </p>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre de la Empresa / Planner
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Gala Weddings & Co."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre del Administrador
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Ej. Fernando Morales"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico de Contacto
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="fernando@galaweddings.pe"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+51 987 123 456"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Plan Contratado
                  </label>
                  <select
                    value={planCode}
                    onChange={(e) => handleCreatePlanChange(e.target.value as PlanCode)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="STARTER">Starter (3 eventos, 150 pases/evt - S/29.99/mes)</option>
                    <option value="PROFESSIONAL">Professional (10 eventos, 500 pases/evt - S/59.99/mes)</option>
                    <option value="BUSINESS">Business (Ilimitados evts, 1,000 pases/evt - S/99.99/mes)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duración del Contrato
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => handleCreateDurationChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-semibold text-slate-800"
                  >
                    <option value={30}>30 Días (Suscripción Mensual)</option>
                    <option value={90}>90 Días (Suscripción Trimestral)</option>
                    <option value={180}>180 Días (Suscripción Semestral)</option>
                    <option value={365}>365 Días (Suscripción Anual Oficial)</option>
                  </select>
                </div>
              </div>

              {/* CONTRACT DATES WITH INTERACTIVE DATE PICKERS AND AUTOMATIC CALCULATION */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#B8860B]" /> Vigencia Oficial del Contrato
                  </span>
                  <span className="text-[10px] bg-amber-100 text-[#B8860B] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    Cálculo Automático
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                      Fecha de Contrato (Inicio)
                    </label>
                    <input
                      type="date"
                      required
                      value={createContractStartDate}
                      onChange={(e) => handleCreateStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                      Fecha de Vencimiento (Fin)
                    </label>
                    <input
                      type="date"
                      required
                      value={createContractEndDate}
                      onChange={(e) => setCreateContractEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-900 focus:ring-2 focus:ring-[#C5A059] focus:outline-none bg-amber-50/40"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800 leading-tight">
                  💡 Al seleccionar la <strong>Fecha de Contrato</strong> y la <strong>Duración/Plan</strong>, la Fecha de Vencimiento se calcula automáticamente. También puedes ajustarla manualmente con el selector de calendario.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                🔒 <strong>Asignación Automática:</strong> Se generará una contraseña inicial (por defecto <code className="font-mono font-bold">EventControl2026!</code>) y se registrará la primera suscripción en el histórico del cliente.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#DBBB6E' }}
                  className="w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md hover:brightness-110 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Procesando...
                    </>
                  ) : (
                    'Crear Cuenta Administradora'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ALL USER ATTRIBUTES MODAL (WITH DATE PICKERS & HISTORIC TRACE) */}
      {editingAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Editar Atributos de la Cuenta</h3>
            <p className="text-xs text-slate-500">Modifica cualquier dato del cliente (empresa, administrador, correo, teléfono, plan, fechas de contrato o estado).</p>

            <form onSubmit={handleSaveEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Empresa / Planner
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAccount.companyName}
                    onChange={(e) => setEditingAccount({ ...editingAccount, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre del Administrador
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAccount.adminName}
                    onChange={(e) => setEditingAccount({ ...editingAccount, adminName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={editingAccount.contactEmail}
                    onChange={(e) => setEditingAccount({ ...editingAccount, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={editingAccount.contactPhone || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Plan Contratado
                  </label>
                  <select
                    value={editingAccount.planCode}
                    onChange={(e) => {
                      const newP = e.target.value as PlanCode;
                      setEditingAccount({ ...editingAccount, planCode: newP });
                      // If start date exists, recalculate end date automatically based on a 365 days term
                      if (editStartDate) {
                        const newEnd = calculateContractEndDate(editStartDate, 365);
                        setEditEndDate(newEnd.split('T')[0]);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-bold"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={editingAccount.status}
                    onChange={(e) => setEditingAccount({ ...editingAccount, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-bold"
                  >
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="SUSPENDIDA">SUSPENDIDA</option>
                    <option value="VENCIDA">VENCIDA</option>
                    <option value="ARCHIVADA">ARCHIVADA</option>
                  </select>
                </div>
              </div>

              {/* DATE PICKERS FOR CONTRACT START AND END DATES */}
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#B8860B]" /> Atributos de Vigencia de Contrato (Date Pickers)
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                      Fecha de Contrato (Inicio)
                    </label>
                    <input
                      type="date"
                      required
                      value={editStartDate}
                      onChange={(e) => {
                        const s = e.target.value;
                        setEditStartDate(s);
                        // Recalculate end date with 365 days
                        if (s) {
                          const currentDur = calculateContractDurationDays(editingAccount.contractStartDate, editingAccount.contractEndDate);
                          const durToApply = editingAccount.planCode === 'STARTER' ? 30 : currentDur;
                          const newEnd = calculateContractEndDate(s, durToApply);
                          setEditEndDate(newEnd.split('T')[0]);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
                      Fecha de Vencimiento (Fin)
                    </label>
                    <input
                      type="date"
                      required
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-900 focus:ring-2 focus:ring-[#C5A059] focus:outline-none bg-amber-50/30"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setResendWhatsAppAccount({ account: editingAccount });
                    setSuperadminWhatsAppPhone(editingAccount.contactPhone || '');
                  }}
                  className="w-full py-2.5 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-emerald-800 font-bold border border-[#25D366]/40 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" /> Reenviar Credenciales por WhatsApp
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#DBBB6E' }}
                  className="w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md hover:brightness-110"
                >
                  Guardar Todos los Atributos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CAMBIAR CONTRASEÑA DE SUPERADMIN */}
      {showSuperPassModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border-2 border-[#C5A059] space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#B8860B]" /> Cambiar Contraseña de Superadmin
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Actualiza la clave privada del Super Administrador (<strong className="text-slate-900 font-mono">tech.innova.reg@gmail.com</strong>).
            </p>

            {superPassMsg && (
              <div className={`p-3 text-xs rounded-xl border ${
                superPassMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'
              }`}>
                {superPassMsg.text}
              </div>
            )}

            {!super2FAStep ? (
              /* STEP 1: ENTER PASSWORDS WITH EYE TOGGLE ICONS */
              <form onSubmit={handleStartSuperPass2FA} className="space-y-4 text-xs">
                {/* Current Password Field */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contraseña Actual de Superadmin
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassEye ? 'text' : 'password'}
                      required
                      value={superCurrentPass}
                      onChange={(e) => setSuperCurrentPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassEye(!showCurrentPassEye)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassEye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nueva Contraseña Privada
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassEye ? 'text' : 'password'}
                      required
                      value={superNewPass}
                      onChange={(e) => setSuperNewPass(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassEye(!showNewPassEye)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassEye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassEye ? 'text' : 'password'}
                      required
                      value={superConfirmPass}
                      onChange={(e) => setSuperConfirmPass(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassEye(!showConfirmPassEye)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassEye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuperPassModal(false);
                      setSuperPassMsg(null);
                    }}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSending2FAPin}
                    style={{ backgroundColor: '#DBBB6E' }}
                    className="w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md hover:brightness-110 flex items-center justify-center gap-2"
                  >
                    {isSending2FAPin ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Enviando PIN...
                      </>
                    ) : (
                      'Continuar a 2FA'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: 2FA EMAIL PIN VERIFICATION */
              <form onSubmit={handleConfirmSuperPassChangeWith2FA} className="space-y-4 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <strong className="font-bold block text-amber-950 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#B8860B]" /> Verificación 2FA Requerida
                  </strong>
                  <p className="text-[11px] text-amber-800">
                    Se envió un código PIN de 4 dígitos a <code className="font-mono font-bold">tech.innova.reg@gmail.com</code> para autorizar la actualización de contraseña.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Código PIN de 4 Dígitos
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={super2FAPinInput}
                    onChange={(e) => setSuper2FAPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-center text-xl font-mono tracking-widest font-extrabold focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSuper2FAStep(false);
                      setSuperPassMsg(null);
                    }}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#DBBB6E' }}
                    className="w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md hover:brightness-110"
                  >
                    Verificar y Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA ENVIAR / REENVIAR CREDENCIALES POR WHATSAPP (SUPERADMIN) */}
      {resendWhatsAppAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-emerald-500 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setResendWhatsAppAccount(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Enviar Acceso por WhatsApp</h2>
              <p className="text-xs text-slate-500">
                Envía las credenciales oficiales de acceso a <strong className="text-slate-800">{resendWhatsAppAccount.account.adminName}</strong> ({resendWhatsAppAccount.account.companyName}).
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 font-mono">
              <p><strong>Empresa:</strong> {resendWhatsAppAccount.account.companyName}</p>
              <p><strong>Administrador:</strong> {resendWhatsAppAccount.account.adminName}</p>
              <p><strong>Correo:</strong> {resendWhatsAppAccount.account.contactEmail}</p>
              <p><strong>Contraseña:</strong> {resendWhatsAppAccount.rawPass || resendWhatsAppAccount.account.initialPassword || 'EventControl2026!'}</p>
              <p><strong>Plan:</strong> Plan {resendWhatsAppAccount.account.planCode}</p>
              <p><strong>Vigencia:</strong> {new Date(resendWhatsAppAccount.account.contractEndDate).toLocaleDateString('es-PE')}</p>
            </div>

            <div className="space-y-1.5 text-xs text-left">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Número de WhatsApp (con código de país ej: +51 o 9 dígitos)
              </label>
              <input
                type="text"
                value={superadminWhatsAppPhone}
                onChange={(e) => setSuperadminWhatsAppPhone(e.target.value)}
                placeholder="Ej. +51 987654321 o dejar en blanco para abrir WhatsApp Web"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={getSuperadminWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setResendWhatsAppAccount(null)}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
              >
                <MessageSquare className="w-4 h-4" /> Abrir WhatsApp y Enviar Credenciales
              </a>

              <button
                onClick={() => setResendWhatsAppAccount(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DE CONTRATO Y SUSCRIPCIONES (METRIC TRACE) */}
      {historyModalAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-2xl w-full card-luxury p-6 shadow-2xl border-2 border-indigo-400 space-y-4 bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900">
                    Histórico de Contratos y Suscripciones
                  </h3>
                  <p className="text-xs text-slate-500">
                    {historyModalAccount.companyName} • {historyModalAccount.adminName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalAccount(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Summary Banner */}
            <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Plan Actual</span>
                <strong className="text-indigo-900 font-bold">Plan {PLAN_LIMITS[historyModalAccount.planCode]?.name}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Fecha Inicio Inicial</span>
                <strong className="text-slate-800 font-mono text-[11px] font-bold">
                  {new Date(historyModalAccount.contractStartDate).toLocaleDateString('es-PE')}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Vencimiento Vigente</span>
                <strong className="text-slate-800 font-mono text-[11px] font-bold">
                  {formatContractDateCivil(historyModalAccount.contractEndDate)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Registros</span>
                <strong className="text-indigo-700 font-extrabold">
                  {historyModalAccount.contractHistory?.length || 1} registros
                </strong>
              </div>
            </div>

            {/* Timeline / History Records List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Línea de Tiempo de Contrato & Renovaciones:
              </h4>

              <div className="space-y-2.5">
                {(historyModalAccount.contractHistory && historyModalAccount.contractHistory.length > 0
                  ? historyModalAccount.contractHistory
                  : [
                      {
                        id: `sub-init-${historyModalAccount.id}`,
                        type: 'INITIAL' as const,
                        planCode: historyModalAccount.planCode,
                        startDate: historyModalAccount.contractStartDate,
                        endDate: historyModalAccount.contractEndDate,
                        durationDays: calculateContractDurationDays(historyModalAccount.contractStartDate, historyModalAccount.contractEndDate),
                        pricePEN: PLAN_LIMITS[historyModalAccount.planCode]?.monthlyPricePEN,
                        notes: 'Alta y apertura oficial de cuenta administradora',
                        created_at: historyModalAccount.created_at || historyModalAccount.contractStartDate,
                      }
                    ]
                ).map((sub, idx) => (
                  <div key={sub.id || idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 hover:border-indigo-300 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          sub.type === 'INITIAL' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : sub.type === 'PLAN_UPGRADE'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {sub.type === 'INITIAL' ? '🏁 CONTRATO INICIAL' : sub.type === 'PLAN_UPGRADE' ? '🚀 UPGRADE DE PLAN' : '🔄 EXTENSIÓN / RENOVACIÓN'}
                        </span>
                        <strong className="text-slate-800 font-bold">Plan {PLAN_LIMITS[sub.planCode]?.name || sub.planCode}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(sub.created_at).toLocaleDateString('es-PE')} {new Date(sub.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Desde</span>
                        <span className="text-slate-800 font-bold">{formatContractDateCivil(sub.startDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Hasta</span>
                        <span className="text-indigo-900 font-bold">{formatContractDateCivil(sub.endDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Período</span>
                        <span className="text-emerald-700 font-bold">+{sub.durationDays} Días</span>
                      </div>
                    </div>

                    {sub.notes && (
                      <p className="text-[11px] text-slate-600 pt-1 italic">
                        📝 {sub.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalAccount(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cerrar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN PERMANENTE DE CUENTA */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border-2 border-rose-500 space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-serif font-bold text-slate-900">¿Eliminar Cuenta Definitivamente?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Estás a punto de eliminar permanentemente la cuenta de <strong className="text-slate-900">{accountToDelete.companyName}</strong> ({accountToDelete.contactEmail}).
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-900 space-y-1">
              <p>⚠️ <strong>Advertencia:</strong> Esta acción no se puede deshacer. Se removerán los accesos y credenciales de esta empresa en la consola.</p>
              <p className="text-slate-600">💡 <em>Si solo deseas suspenderla o pausarla temporalmente sin borrar sus datos, utiliza la opción <strong>Archivar</strong>.</em></p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Sí, Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
