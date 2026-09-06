'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldCheck, Plus, Calendar, Clock, Mail, Phone, Lock, 
  KeyRound, RefreshCw, CheckCircle2, AlertTriangle, UserCheck, 
  Building, LayoutGrid, BarChart3, LogOut, ArrowRight, ShieldAlert, Sparkles,
  Copy, Check, Send, ExternalLink, Eye, Info
} from 'lucide-react';
import { 
  getAllAdminAccounts, createAdminAccount, updateAdminAccount, 
  triggerPasswordReset, calculateRemainingDays, extendAdminContract, 
  AdminAccount, getActiveSession, SUPER_ADMIN_EMAIL, sendClientWelcomeEmail 
} from '@/lib/superadmin-store';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';

export default function SuperAdminPage() {
  const session = getActiveSession();
  const isAuthorized = session?.user?.role === 'SUPER_USER' || session?.user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const [accounts, setAccounts] = useState<AdminAccount[]>(() => getAllAdminAccounts());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [extendingAccount, setExtendingAccount] = useState<AdminAccount | null>(null);
  const [viewingCredentialsAccount, setViewingCredentialsAccount] = useState<AdminAccount | null>(null);
  
  // Notice & Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [createdNoticeModal, setCreatedNoticeModal] = useState<{
    account: AdminAccount;
    initialPassword: string;
    emailStatus: { success: boolean; message: string; isSandboxRestriction?: boolean; error?: string };
  } | null>(null);

  // Extension Modal State
  const [extensionDays, setExtensionDays] = useState(365);
  const [selectedExtensionPlan, setSelectedExtensionPlan] = useState<PlanCode>('PROFESSIONAL');

  // New Account Form State
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [planCode, setPlanCode] = useState<PlanCode>('PROFESSIONAL');
  const [durationDays, setDurationDays] = useState(365);

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
    });

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
  };

  const handleExtendContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingAccount) return;

    const result = extendAdminContract(extendingAccount.id, extensionDays, selectedExtensionPlan);
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

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    updateAdminAccount(editingAccount.id, {
      companyName: editingAccount.companyName,
      adminName: editingAccount.adminName,
      contactEmail: editingAccount.contactEmail,
      contactPhone: editingAccount.contactPhone,
      planCode: editingAccount.planCode,
      status: editingAccount.status,
      contractEndDate: editingAccount.contractEndDate,
    });

    setEditingAccount(null);
    refreshList();
    setNoticeMessage(`¡Atributos de la cuenta "${editingAccount.companyName}" actualizados exitosamente!`);
    setTimeout(() => setNoticeMessage(null), 6000);
  };

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

          {/* Superadmin Active Profile */}
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

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          <div className="card-luxury p-5 border border-[#C5A059]/30">
            <span className="text-xs text-slate-500 uppercase font-semibold block">Cuentas Administradoras</span>
            <strong className="text-3xl font-serif font-bold text-[#1A1A1A] mt-1 block">{accounts.length}</strong>
          </div>
          <div className="card-luxury p-5 border border-emerald-200 bg-emerald-50/50">
            <span className="text-xs text-emerald-800 uppercase font-semibold block">Cuentas Activas</span>
            <strong className="text-3xl font-serif font-bold text-emerald-700 mt-1 block">
              {accounts.filter(a => a.status === 'ACTIVA').length}
            </strong>
          </div>
          <div className="card-luxury p-5 border border-amber-200 bg-amber-50/50">
            <span className="text-xs text-amber-800 uppercase font-semibold block">Próximos a Vencer (&lt; 7 días)</span>
            <strong className="text-3xl font-serif font-bold text-amber-700 mt-1 block">
              {accounts.filter(a => calculateRemainingDays(a.contractEndDate) <= 7).length}
            </strong>
          </div>
          <div className="card-luxury p-5 border border-purple-200 bg-purple-50/50">
            <span className="text-xs text-purple-900 uppercase font-semibold block">Planes Professional / Business</span>
            <strong className="text-3xl font-serif font-bold text-purple-800 mt-1 block">
              {accounts.filter(a => a.planCode !== 'STARTER').length}
            </strong>
          </div>
        </div>

        {/* Managed Client Accounts List */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#B8860B]" /> Cuentas Administradoras de Eventos ({accounts.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Visualización de credenciales y envío de correos activos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 uppercase">
                  <th className="py-3.5 px-4">Empresa / Planner</th>
                  <th className="py-3.5 px-4">Administrador & Correo</th>
                  <th className="py-3.5 px-4">Plan Contratado</th>
                  <th className="py-3.5 px-4">Vencimiento & Días</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones de Cuenta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {accounts.map((acc) => {
                  const remDays = calculateRemainingDays(acc.contractEndDate);
                  const plan = PLAN_LIMITS[acc.planCode];
                  const isNearExpiration = remDays <= 7;

                  return (
                    <tr key={acc.id} className={`hover:bg-amber-50/40 transition ${isNearExpiration ? 'bg-amber-50/70' : ''}`}>
                      
                      {/* Empresa / Planner */}
                      <td className="py-3.5 px-4">
                        <strong className="font-bold text-slate-900 block text-sm">{acc.companyName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">Workspace: {acc.workspaceId}</span>
                      </td>

                      {/* Administrador & Correo */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{acc.adminName}</span>
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#B8860B]" /> {acc.contactEmail}
                        </span>
                        {acc.contactPhone && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {acc.contactPhone}
                          </span>
                        )}
                      </td>

                      {/* Plan Contratado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold text-xs shadow-sm bg-amber-50 text-[#B8860B] border-[#DBBB6E]/50">
                          <span>Plan {plan.name}</span>
                          <span className="text-[10px] font-normal text-slate-500">(S/{plan.monthlyPricePEN}/mes)</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Evts: {plan.maxActiveEvents === -1 ? 'Ilimitados' : plan.maxActiveEvents} • Pases: {plan.maxPassesPerEvent}
                        </span>
                      </td>

                      {/* Vencimiento & Días */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-800 block font-bold">
                          {new Date(acc.contractEndDate).toLocaleDateString()}
                        </span>
                        <span className={`text-[10px] font-extrabold block ${remDays <= 7 ? 'text-red-600 animate-pulse' : 'text-emerald-700'}`}>
                          {remDays <= 7 ? `⚠️ Alerta: ${remDays} días` : `${remDays} días restantes`}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          acc.status === 'ACTIVA' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {acc.status}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setViewingCredentialsAccount(acc)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-amber-300 font-bold rounded-lg transition text-[11px] shadow-sm inline-flex items-center gap-1"
                          title="Ver Credenciales y Clave de Acceso"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-300" /> Clave
                        </button>

                        <button
                          onClick={() => handleResendEmail(acc)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 transition text-[11px] inline-flex items-center gap-1"
                          title="Enviar o Re-enviar Correo de Bienvenida con Credenciales"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" /> Reenviar Correo
                        </button>

                        <button
                          onClick={() => handleOpenExtendModal(acc)}
                          style={{ backgroundColor: '#DBBB6E' }}
                          className="px-2.5 py-1.5 text-white font-bold rounded-lg transition text-[11px] shadow-sm hover:brightness-110"
                          title="Extender Contrato / Renovar Plan"
                        >
                          Extender
                        </button>

                        <button
                          onClick={() => setEditingAccount({ ...acc })}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#B8860B] font-bold rounded-lg border border-[#C5A059]/40 transition text-[11px]"
                          title="Editar Todos los Atributos"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: VIEW CLIENT CREDENTIALS & QUICK COPY */}
      {viewingCredentialsAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border-2 border-[#C5A059] space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#B8860B]" /> Credenciales del Cliente
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">ID: {viewingCredentialsAccount.id}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Empresa / Planner:</span>
                  <strong className="text-slate-900 text-sm font-serif">{viewingCredentialsAccount.companyName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Administrador:</span>
                  <span className="text-slate-800 font-semibold">{viewingCredentialsAccount.adminName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Correo de Acceso:</span>
                  <span className="font-mono text-slate-900 font-bold">{viewingCredentialsAccount.contactEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Contraseña Asignada:</span>
                  <span className="font-mono text-[#B8860B] font-bold text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                    {viewingCredentialsAccount.initialPassword || 'EventControl2026!'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">URL de Login:</span>
                  <span className="font-mono text-blue-700 text-[11px]">https://eventcontrol-pe.vercel.app/login</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <span>
                  Puedes copiar estos datos de acceso y entregárselos al cliente directamente por WhatsApp o correo privado.
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingCredentialsAccount(null)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const pass = viewingCredentialsAccount.initialPassword || 'EventControl2026!';
                  const text = `🎉 ¡Hola ${viewingCredentialsAccount.adminName}! Tu cuenta para "${viewingCredentialsAccount.companyName}" en EventControl.pe está activa.\n\nAcceso Web: https://eventcontrol-pe.vercel.app/login\nCorreo: ${viewingCredentialsAccount.contactEmail}\nContraseña: ${pass}`;
                  handleCopyText(text, 'viewing-copy');
                }}
                className="w-2/3 py-2.5 gold-button font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                {copiedKey === 'viewing-copy' ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
                {copiedKey === 'viewing-copy' ? '¡Copiado!' : 'Copiar Credenciales'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POST-CREATION NOTICE & EMAIL STATUS FEEDBACK */}
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
                      💡 <strong>Causa Resend Sandbox:</strong> Al usar el remite gratuito de prueba (<code className="font-mono">onboarding@resend.dev</code>), Resend solo permite enviar correos a tu propia cuenta registrada (<code className="font-mono">tech.innova.reg@gmail.com</code>). Para enviar a dominios de clientes finales sin restricción, debes verificar un dominio propio en Resend. Puedes copiar la contraseña a continuación y entregársela al cliente manualmente.
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

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreatedNoticeModal(null)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = `🎉 ¡Hola ${createdNoticeModal.account.adminName}! Tu cuenta para "${createdNoticeModal.account.companyName}" en EventControl.pe está activa.\n\nAcceso Web: https://eventcontrol-pe.vercel.app/login\nCorreo: ${createdNoticeModal.account.contactEmail}\nContraseña: ${createdNoticeModal.initialPassword}`;
                  handleCopyText(text, 'created-modal-copy');
                }}
                className="w-2/3 py-2.5 gold-button font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                {copiedKey === 'created-modal-copy' ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
                {copiedKey === 'created-modal-copy' ? '¡Copiado al Portapapeles!' : 'Copiar Credenciales'}
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
                  <option value={365}>+ 365 Días (Renovación Anual Oficial)</option>
                </select>
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
                    onChange={(e) => setPlanCode(e.target.value as PlanCode)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  >
                    <option value="STARTER">Starter (3 eventos, 150 pases/evt)</option>
                    <option value="PROFESSIONAL">Professional (10 eventos, 500 pases/evt)</option>
                    <option value="BUSINESS">Business (Ilimitados evts, 1,000 pases/evt)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duración del Contrato
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  >
                    <option value={30}>30 Días (Prueba / Mensual)</option>
                    <option value={90}>90 Días (Trimestral)</option>
                    <option value={365}>365 Días (Anual Oficial)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                🔒 <strong>Asignación Automática:</strong> Se generará una contraseña inicial (por defecto <code className="font-mono font-bold">EventControl2026!</code>) y se despachará el correo de bienvenida. Podrás copiar las credenciales inmediatamente tras crear la cuenta.
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

      {/* EDIT ALL USER ATTRIBUTES MODAL */}
      {editingAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Editar Atributos de la Cuenta</h3>
            <p className="text-xs text-slate-500">Modifica cualquier dato del cliente (empresa, administrador, correo, teléfono, plan o estado).</p>

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
                    onChange={(e) => setEditingAccount({ ...editingAccount, planCode: e.target.value as PlanCode })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
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
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                  >
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="SUSPENDIDA">SUSPENDIDA</option>
                    <option value="VENCIDA">VENCIDA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de Vencimiento (ISO Date String)
                </label>
                <input
                  type="text"
                  required
                  value={editingAccount.contractEndDate}
                  onChange={(e) => setEditingAccount({ ...editingAccount, contractEndDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                />
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
    </div>
  );
}
