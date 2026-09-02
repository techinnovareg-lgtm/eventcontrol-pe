'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldCheck, Plus, Calendar, Clock, Mail, Phone, Lock, 
  KeyRound, RefreshCw, CheckCircle2, AlertTriangle, UserCheck, 
  Building, LayoutGrid, BarChart3, LogOut, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';
import { 
  getAllAdminAccounts, createAdminAccount, updateAdminAccount, 
  triggerPasswordReset, calculateRemainingDays, extendAdminContract, AdminAccount 
} from '@/lib/superadmin-store';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';

export default function SuperAdminPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>(() => getAllAdminAccounts());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [extendingAccount, setExtendingAccount] = useState<AdminAccount | null>(null);
  
  // Extension Modal State
  const [extensionDays, setExtensionDays] = useState(365);
  const [selectedExtensionPlan, setSelectedExtensionPlan] = useState<PlanCode>('PROFESSIONAL');
  
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // New Account Form State
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [planCode, setPlanCode] = useState<PlanCode>('PROFESSIONAL');
  const [durationDays, setDurationDays] = useState(365);

  const refreshList = () => {
    setAccounts(getAllAdminAccounts());
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminName || !contactEmail) return;

    const result = createAdminAccount({
      companyName,
      adminName,
      contactEmail,
      contactPhone,
      planCode,
      durationDays,
    });

    setCompanyName('');
    setAdminName('');
    setContactEmail('');
    setContactPhone('');
    setIsCreateModalOpen(false);
    refreshList();
    setNoticeMessage(result.tempPasswordNotice);
    setTimeout(() => setNoticeMessage(null), 8000);
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
    if (confirm(`¿Restablecer contraseña para la cuenta de "${account.companyName}"? Se enviará un enlace para definir su nueva clave.`)) {
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
      {/* Top Luxury Super User Header */}
      <header className="border-b border-[#C5A059]/30 bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md border border-[#C5A059]/40 group-hover:scale-105 transition-transform bg-white p-1">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-serif flex items-center gap-2">
                EventControl<span className="text-[#C5A059]">.pe</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#C5A059] text-white font-mono font-bold uppercase">
                  SUPER ADMIN
                </span>
              </span>
              <span className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold block font-mono">
                tech.innova.reg@gmail.com
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-700"
            >
              <BarChart3 className="w-4 h-4 text-[#C5A059]" /> Dashboard Principal
            </Link>
            <Link href="/login" className="p-2 text-slate-400 hover:text-white transition" title="Cerrar Sesión Super User">
              <LogOut className="w-5 h-5" />
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
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">Gestión de Cuentas y Extensión de Contratos</h1>
            <p className="text-xs text-slate-500">Administra todos los atributos de las cuentas cliente, actualiza planes y renueva contratos.</p>
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

        {/* Managed Client Accounts List (Clean Layout without Contraseña column) */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#B8860B]" /> Cuentas Administradoras de Eventos ({accounts.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Límites de plan aplicados automáticamente</span>
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
                  <th className="py-3.5 px-4 text-right">Acciones</th>
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

                      {/* Clean Non-Overflowing Plan Contratado Column */}
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
                          onClick={() => handleOpenExtendModal(acc)}
                          style={{ backgroundColor: '#DBBB6E' }}
                          className="px-3 py-1.5 text-white font-bold rounded-lg transition text-[11px] shadow-sm hover:brightness-110"
                          title="Extender Contrato / Renovar Plan"
                        >
                          Extender Contrato
                        </button>

                        <button
                          onClick={() => setEditingAccount({ ...acc })}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#B8860B] font-bold rounded-lg border border-[#C5A059]/40 transition text-[11px]"
                          title="Editar Todos los Atributos"
                        >
                          Editar
                        </button>
                        
                        <button
                          onClick={() => handleTriggerReset(acc)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 transition text-[11px]"
                          title="Restablecer Contraseña (Enviar Link por Correo)"
                        >
                          Reset Clave
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

      {/* EXTEND CONTRACT MODAL (WITH PLAN UPGRADE / CHANGE OPTION) */}
      {extendingAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border-2 border-[#DBBB6E] space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Extender Contrato / Renovar Plan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extiende la suscripción para <strong className="text-slate-900">{extendingAccount.companyName}</strong>. La nueva fecha de vencimiento se calculará **desde el día siguiente del fin del plan anterior**.
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
              Registra una cuenta de empresa cliente, asigna su plan y configura las limitaciones automáticamente.
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
                🔒 <strong>Privacidad de Contraseñas:</strong> El cliente recibirá un enlace inicial para definir su clave privada en su primer acceso.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#DBBB6E' }}
                  className="w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md hover:brightness-110"
                >
                  Crear Cuenta Administradora
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
