'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, Users, ShieldCheck, UserPlus, Lock, Key, 
  ArrowLeft, CheckCircle2, AlertTriangle, Play, Calendar, 
  Clock, ShieldAlert, Check, User, Mail, Phone, Sparkles, CheckSquare
} from 'lucide-react';
import { testCrossWorkspaceIsolation } from '@/lib/workspace';
import { PLAN_LIMITS } from '@/lib/plans';
import { getActiveSession, calculateRemainingDays, changeUserPassword, getAccountForSession } from '@/lib/superadmin-store';

export default function AccountProfilePage() {
  const session = getActiveSession();
  const contractInfo = getAccountForSession();

  const plan = PLAN_LIMITS[contractInfo.planCode];
  const remainingDays = calculateRemainingDays(contractInfo.contractEndDate);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'team'>('profile');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cross Isolation Test State
  const [isolationResult, setIsolationResult] = useState<{ passed: boolean; logs: string[] } | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    const res = changeUserPassword(session?.user.id || 'usr-admin-01', newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg({ type: 'success', text: res.message });
    setTimeout(() => setPasswordMsg(null), 6000);
  };

  const handleRunIsolationTest = () => {
    const res = testCrossWorkspaceIsolation();
    setIsolationResult(res);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white">
      {/* Top Navbar Header */}
      <header className="border-b border-[#C5A059]/40 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md border border-[#C5A059]/40 group-hover:scale-105 transition-transform bg-white p-0.5">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover rounded-lg"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#1A1A1A] font-serif">
                EventControl<span className="text-[#C5A059]">.pe</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                Mi Perfil y Mi Cuenta
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* USER PROFILE CARD */}
            <div className="flex items-center gap-2 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#C5A059]/40">
              <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#B8860B] text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-amber-200 shrink-0">
                {(session?.user?.name || contractInfo.adminName || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block leading-tight pr-1">
                <span className="text-xs font-bold text-slate-900 block max-w-[180px] truncate">
                  {session?.user?.name || contractInfo.adminName || contractInfo.companyName}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block max-w-[180px] truncate">
                  {session?.user?.email || contractInfo.contactEmail}
                </span>
              </div>
            </div>

            <Link href="/dashboard" className="text-xs text-[#B8860B] hover:underline font-bold flex items-center gap-1 bg-amber-50 px-3 py-2 rounded-xl border border-[#C5A059]/30">
              <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 w-full">
        
        {/* Account Title Bar */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest">
                Información Oficial de la Cuenta
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                CUENTA ACTIVA
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A]">{contractInfo.companyName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Administrador Principal: {contractInfo.adminName} ({contractInfo.contactEmail})</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'profile'
                  ? 'gold-button shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5 inline mr-1" /> Mi Perfil & Contrato
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'security'
                  ? 'gold-button shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 inline mr-1" /> Cambiar Contraseña
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'team'
                  ? 'gold-button shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1" /> Equipo & Roles
            </button>
          </div>
        </div>

        {/* TAB 1: MI PERFIL & DETALLES DEL CONTRATO */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Contract Key Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="card-luxury p-5 border-2 border-[#C5A059]">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Plan Contratado</span>
                <strong className="text-2xl font-serif font-bold text-[#B8860B] mt-1 block">Plan {plan.name}</strong>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">S/{plan.monthlyPricePEN} / mes</span>
              </div>

              <div className="card-luxury p-5 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Fecha de Contratación</span>
                <strong className="text-lg font-bold text-slate-900 mt-2 block font-mono">
                  {new Date(contractInfo.contractStartDate).toLocaleDateString()}
                </strong>
                <span className="text-[10px] text-slate-400 block">Fecha oficial de inicio</span>
              </div>

              <div className="card-luxury p-5 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Fecha de Vencimiento</span>
                <strong className="text-lg font-bold text-slate-900 mt-2 block font-mono">
                  {new Date(contractInfo.contractEndDate).toLocaleDateString()}
                </strong>
                <span className="text-[10px] text-slate-400 block">Término de la suscripción</span>
              </div>

              <div className="card-luxury p-5 border border-emerald-300 bg-emerald-50/50">
                <span className="text-xs text-emerald-900 uppercase font-semibold block">Días Restantes</span>
                <strong className="text-3xl font-serif font-black text-emerald-700 mt-1 block">{remainingDays} Días</strong>
                <span className="text-[10px] text-emerald-800 font-bold block">Servicio activo al día</span>
              </div>
            </div>

            {/* Plan Features & Limit Gauges */}
            <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#B8860B]" /> Funciones Habilitadas en tu Plan ({plan.name})
                </h3>
                <span className="text-xs text-[#B8860B] font-bold">Límites aplicados automáticamente</span>
              </div>

              {/* Limit Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase">Eventos Activos</span>
                    <strong className="text-slate-900 font-bold">
                      1 / {plan.maxActiveEvents === -1 ? 'Ilimitados' : plan.maxActiveEvents}
                    </strong>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#C5A059] h-full w-1/3"></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Capacidad para gestionar bodas simultáneas</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase">Pases por Evento</span>
                    <strong className="text-slate-900 font-bold">Hasta {plan.maxPassesPerEvent} pases</strong>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full w-3/4"></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Invitados y familias autorizadas por boda</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase">Integrantes de Equipo</span>
                    <strong className="text-slate-900 font-bold">1 / {plan.maxWorkspaceUsers} usuarios</strong>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full w-1/5"></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Accesos RBAC para coordinadores y seguridad</span>
                </div>
              </div>

              {/* Complete Features Checklist */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Detalle de Funciones Incluidas en tu Suscripción:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0" />
                      <span className="font-semibold text-slate-800">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAMBIAR CONTRASEÑA */}
        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto card-luxury p-8 border border-[#C5A059]/40 shadow-xl space-y-6 animate-fade-in-up">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-amber-50 text-[#B8860B] rounded-2xl border border-[#C5A059]/40 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Actualizar Contraseña</h2>
              <p className="text-xs text-slate-500">
                Mantén segura tu cuenta actualizando tu contraseña periódicamente.
              </p>
            </div>

            {passwordMsg && (
              <div className={`p-3 text-xs rounded-xl border ${
                passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 gold-button font-bold text-xs rounded-xl transition shadow-md"
              >
                Guardar Nueva Contraseña
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: EQUIPO & ROLES RBAC */}
        {activeTab === 'team' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#B8860B]" /> Integrantes del Equipo (Workspace A)
                </h3>
                <button className="gold-button font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Invitar Usuario
                </button>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Rol Asignado</th>
                    <th className="py-3 px-4">Alcance de Permisos</th>
                    <th className="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Ana María Gamarra (ana@amgweddings.pe)</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">OWNER (Propietario)</td>
                    <td className="py-3 px-4 text-slate-600">Acceso total, facturación, usuarios y eventos</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">Activo</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Carlos Pérez (carlos@amgweddings.pe)</td>
                    <td className="py-3 px-4 font-bold text-indigo-700">COORDINADOR</td>
                    <td className="py-3 px-4 text-slate-600">Edición de eventos, invitados, mesas y cortes</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">Activo</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Puerta Principal 1 (puerta1@amgweddings.pe)</td>
                    <td className="py-3 px-4 font-bold text-amber-800">SEGURIDAD (Puerta)</td>
                    <td className="py-3 px-4 text-slate-600">Escaneo de QR y registro de check-in únicamente</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">Activo</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Security Isolation Test Runner */}
            <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-serif font-bold text-[#1A1A1A]">Prueba de Aislamiento de Workspaces (Seguridad Multi-Tenant)</h4>
                  <p className="text-xs text-slate-500">Valida que ningún usuario de este Workspace pueda acceder a datos de otros clientes.</p>
                </div>
                <button
                  onClick={handleRunIsolationTest}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Ejecutar Prueba
                </button>
              </div>

              {isolationResult && (
                <div className={`p-4 rounded-xl text-xs space-y-2 border ${
                  isolationResult.passed ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'
                }`}>
                  <div className="font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isolationResult.passed ? '¡Prueba Exitosa! Aislamiento 100% verificado.' : 'Falló la prueba.'}</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 font-mono text-[11px]">
                    {isolationResult.logs.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
