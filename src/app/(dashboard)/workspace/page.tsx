'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, Users, ShieldCheck, UserPlus, Lock, Key, 
  ArrowLeft, CheckCircle2, AlertTriangle, Play, Calendar, 
  Clock, ShieldAlert, Check, User, Mail, Phone, Sparkles, CheckSquare,
  X, MessageSquare, Shield, HelpCircle, FileText, QrCode, MapPin, ExternalLink
} from 'lucide-react';
import { testCrossWorkspaceIsolation } from '@/lib/workspace';
import { PLAN_LIMITS, checkCanAddWorkspaceMember, ROLE_PERMISSIONS, RolePermissionDetail } from '@/lib/plans';
import { getActiveSession, calculateRemainingDays, changeUserPassword, getAccountForSession } from '@/lib/superadmin-store';
import { getWorkspaceMembers, createWorkspaceMember, WorkspaceMemberUser, WorkspaceUserRole, formatExpirationDate } from '@/lib/workspace-users';
import { getWorkspaceEvents, getWorkspaceEventsAsync, getLastActiveEventId, getEventById } from '@/lib/events';
import { generateWhatsAppLink } from '@/lib/whatsapp';

export default function AccountProfilePage() {
  const session = getActiveSession();
  const contractInfo = getAccountForSession();

  const currentWorkspaceId = session?.user?.workspaceId || contractInfo.workspaceId || 'ws-a-1111';
  const plan = PLAN_LIMITS[contractInfo.planCode] || PLAN_LIMITS.STARTER;
  const remainingDays = calculateRemainingDays(contractInfo.contractEndDate);

  const userRole = session?.user?.role || 'OWNER';
  const isOperator = userRole === 'OPERATOR';
  const isCoordinator = userRole === 'COORDINADOR';
  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'SUPER_USER';

  const currentRolePermission: RolePermissionDetail = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.OWNER;

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'team'>('profile');

  // Team Members Dynamic State
  const [teamMembers, setTeamMembers] = useState<WorkspaceMemberUser[]>([]);
  const [activeEventsCount, setActiveEventsCount] = useState<number>(0);

  // Assigned event details if user is coordinator
  const assignedEventId = session?.user?.eventId;
  const assignedEvent = assignedEventId ? getEventById(assignedEventId, currentWorkspaceId) : undefined;

  useEffect(() => {
    const activeSess = getActiveSession();
    if (activeSess?.user?.role === 'OPERATOR') {
      const scanRoute = activeSess.user.eventId ? `/scan?event=${activeSess.user.eventId}` : '/scan';
      window.location.href = scanRoute;
      return;
    }

    setTeamMembers(getWorkspaceMembers(currentWorkspaceId));
    setActiveEventsCount(getWorkspaceEvents(currentWorkspaceId).length);
    getWorkspaceEventsAsync(currentWorkspaceId).then(evts => {
      setActiveEventsCount(evts.length);
    });
  }, [currentWorkspaceId]);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sub-User Invitation Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('puerta2026');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<WorkspaceUserRole>('OPERATOR');
  const [createdMemberSuccess, setCreatedMemberSuccess] = useState<{ member: WorkspaceMemberUser; rawPass: string } | null>(null);

  // Cross Isolation Test State
  const [isolationResult, setIsolationResult] = useState<{ passed: boolean; logs: string[] } | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPass = currentPassword.trim();
    const expectedPass = contractInfo.initialPassword || 'EventControl2026!';
    const isCurrentValid = currentPass === expectedPass;

    if (!isCurrentValid) {
      setPasswordMsg({ type: 'error', text: 'La contraseña actual ingresada es incorrecta.' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'La contraseña nueva debe tener al menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
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

  const handleCreateSubUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    // Enforce Plan Limits on Workspace Users
    const planCheck = checkCanAddWorkspaceMember(contractInfo.planCode, teamMembers.length);
    if (!planCheck.allowed) {
      alert(`⚠️ RESTRICCIÓN DE PLAN CONTRATADO\n\n${planCheck.reason}`);
      return;
    }

    const pass = newMemberPassword.trim() || 'puerta2026';
    const created = createWorkspaceMember({
      workspaceId: currentWorkspaceId,
      name: newMemberName,
      email: newMemberEmail,
      password: pass,
      role: newMemberRole,
    });

    setTeamMembers(getWorkspaceMembers(currentWorkspaceId));
    setCreatedMemberSuccess({ member: created, rawPass: pass });
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setCreatedMemberSuccess(null);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPassword('puerta2026');
    setNewMemberPhone('');
    setNewMemberRole('OPERATOR');
  };

  // Resend WhatsApp Modal State
  const [resendWhatsAppMember, setResendWhatsAppMember] = useState<{ member: WorkspaceMemberUser; rawPass?: string } | null>(null);
  const [resendPhone, setResendPhone] = useState<string>('');

  const getRoleMessageDetails = (role: WorkspaceUserRole) => {
    switch (role) {
      case 'COORDINADOR':
        return {
          roleTitle: 'COORDINADOR (Gestión & Mesas)',
          instruction: 'Al ingresar podrás coordinar el plano de mesas, invitados y reportes del evento asignado.',
        };
      case 'ADMIN':
        return {
          roleTitle: 'ADMINISTRADOR (Acceso Completo)',
          instruction: 'Al ingresar tendrás acceso administrativo completo para gestionar eventos y equipos.',
        };
      case 'OWNER':
        return {
          roleTitle: 'PROPIETARIO',
          instruction: 'Al ingresar tendrás control total del espacio de trabajo, eventos, facturación y equipo.',
        };
      case 'OPERATOR':
      default:
        return {
          roleTitle: 'SEGURIDAD (Puerta)',
          instruction: 'Al ingresar irás directo al módulo de control y escáner QR de la puerta.',
        };
    }
  };

  const getResendWhatsAppLink = () => {
    if (!resendWhatsAppMember) return '#';
    const member = resendWhatsAppMember.member;
    const pass = resendWhatsAppMember.rawPass || member.initialPassword || 'puerta2026';
    const { roleTitle, instruction } = getRoleMessageDetails(member.role);
    const text = encodeURIComponent(
      `Hola ${member.name}, te recordamos tus credenciales de acceso a la plataforma EventControl.pe (${contractInfo.companyName}).\n\n` +
      `🌐 Acceso Web: https://eventcontrol-pe.vercel.app/login\n` +
      `📧 Usuario / Correo: ${member.email}\n` +
      `🔑 Contraseña: ${pass}\n` +
      `👤 Rol Asignado: ${roleTitle}\n\n` +
      `${instruction}`
    );
    const phoneCleaned = resendPhone.replace(/[^0-9]/g, '');
    return generateWhatsAppLink(phoneCleaned, text);
  };

  const getWhatsAppDispatchLink = () => {
    if (!createdMemberSuccess) return '#';
    const member = createdMemberSuccess.member;
    const { roleTitle, instruction } = getRoleMessageDetails(member.role);
    const text = encodeURIComponent(
      `Hola ${member.name}, se ha creado tu acceso a la plataforma EventControl.pe (${contractInfo.companyName}).\n\n` +
      `🌐 Acceso Web: https://eventcontrol-pe.vercel.app/login\n` +
      `📧 Usuario / Correo: ${member.email}\n` +
      `🔑 Contraseña: ${createdMemberSuccess.rawPass}\n` +
      `👤 Rol Asignado: ${roleTitle}\n\n` +
      `${instruction}`
    );
    const phoneCleaned = newMemberPhone.replace(/[^0-9]/g, '');
    return generateWhatsAppLink(phoneCleaned, text);
  };

  // Back link URL resolution
  const backHref = (() => {
    if (isCoordinator && assignedEventId) {
      return `/dashboard?eventId=${encodeURIComponent(assignedEventId)}`;
    }
    const lastId = getLastActiveEventId(currentWorkspaceId);
    return lastId ? `/dashboard?eventId=${encodeURIComponent(lastId)}` : '/dashboard';
  })();

  const activeUserName = session?.user?.name || contractInfo.adminName || contractInfo.companyName;
  const activeUserEmail = session?.user?.email || contractInfo.contactEmail;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white relative">
      {/* Top Navbar Header */}
      <header className="border-b border-[#C5A059]/40 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href={backHref} className="flex items-center gap-3 group">
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
                Detalles de Mi Cuenta & Perfil
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* USER PROFILE CARD */}
            <div className="flex items-center gap-2 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#C5A059]/40">
              <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#B8860B] text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-amber-200 shrink-0">
                {activeUserName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block leading-tight pr-1">
                <span className="text-xs font-bold text-slate-900 block max-w-[180px] truncate">
                  {activeUserName}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block max-w-[180px] truncate">
                  {activeUserEmail}
                </span>
              </div>
            </div>

            <Link href={backHref} className="text-xs text-[#B8860B] hover:underline font-bold flex items-center gap-1 bg-amber-50 px-3 py-2 rounded-xl border border-[#C5A059]/30">
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
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest">
                Detalles Oficiales de la Cuenta
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${currentRolePermission.badgeColor}`}>
                {currentRolePermission.title}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                CUENTA ACTIVA
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A]">{contractInfo.companyName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Usuario en sesión: <strong>{activeUserName}</strong> ({activeUserEmail}) • Workspace: <code className="text-slate-700 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">{currentWorkspaceId}</code>
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'profile'
                  ? 'gold-button shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5 inline mr-1" /> Mi Perfil & Restricciones
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
            {isOwnerOrAdmin && (
              <button
                onClick={() => setActiveTab('team')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'team'
                    ? 'gold-button shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1" /> Equipo & Roles ({teamMembers.length})
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: MI PERFIL, MATRIZ DE PERMISOS & DETALLES DEL PLAN */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* 1. INDIVIDUAL USER PROFILE & ROLE PERMISSIONS CARD */}
            <div className="card-luxury p-6 border-2 border-[#C5A059]/50 shadow-lg bg-gradient-to-r from-amber-50/30 via-white to-amber-50/10 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C5A059] to-[#B8860B] text-white flex items-center justify-center font-bold text-xl shadow-md border border-amber-200 shrink-0">
                    {activeUserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-serif font-bold text-slate-900">{activeUserName}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${currentRolePermission.badgeColor}`}>
                        {currentRolePermission.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono block mt-0.5">{activeUserEmail}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alcance del Rol</span>
                  <span className="text-xs font-semibold text-slate-800">{currentRolePermission.scope}</span>
                </div>
              </div>

              {/* Special Context for Coordinator */}
              {isCoordinator && (
                <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <strong className="text-indigo-950 block font-bold">
                        Evento Asignado: {assignedEvent ? assignedEvent.name : 'Asignación Global de Eventos'}
                      </strong>
                      <span className="text-indigo-800 text-[11px]">
                        Tienes autorización para gestionar la lista de invitados, asignar mesas y supervisar el ingreso en este evento.
                      </span>
                    </div>
                  </div>

                  {assignedEvent && (
                    <Link
                      href={`/dashboard?eventId=${assignedEvent.id}`}
                      className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg transition shrink-0 inline-flex items-center gap-1 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ir al Evento
                    </Link>
                  )}
                </div>
              )}

              {/* Role Permissions Breakdown: What you CAN and CANNOT do */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                {/* Permitted Actions */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2.5">
                  <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Funciones Permitidas para tu Perfil
                  </span>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    {currentRolePermission.canManageWorkspace && (
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Administración total del Espacio de Trabajo y Contrato
                      </li>
                    )}
                    {currentRolePermission.canCreateEvents && (
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Creación y edición de nuevos eventos según límites del plan
                      </li>
                    )}
                    {currentRolePermission.canManageTeam && (
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Invitación y gestión de personal (coordinadores y operadores)
                      </li>
                    )}
                    {currentRolePermission.canManageGuestsAndTables && (
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Gestión de invitados, pases QR y asignación de mesas en plano
                      </li>
                    )}
                    {currentRolePermission.canViewReports && (
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Cortes de asistencia de catering y reportes ejecutivos en PDF/Excel
                      </li>
                    )}
                    {currentRolePermission.canScanQR && (
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Escáner QR de puerta con validación atómica y modo offline
                      </li>
                    )}
                  </ul>
                </div>

                {/* Restricted Actions */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" /> Restricciones de Seguridad de este Perfil
                  </span>
                  <ul className="space-y-1.5 text-slate-600 text-[11px]">
                    {!currentRolePermission.canManageWorkspace && (
                      <li className="flex items-center gap-2 text-slate-500">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> No puedes modificar datos fiscales ni el plan de la empresa
                      </li>
                    )}
                    {!currentRolePermission.canCreateEvents && (
                      <li className="flex items-center gap-2 text-slate-500">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> No puedes crear nuevos eventos fuera de tu asignación
                      </li>
                    )}
                    {!currentRolePermission.canManageTeam && (
                      <li className="flex items-center gap-2 text-slate-500">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> No puedes invitar ni eliminar a otros colaboradores del workspace
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-slate-500">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Aislamiento estricto: cero acceso a datos de otras empresas o bodas
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 2. CONTRACT KEY INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="card-luxury p-5 border-2 border-[#C5A059]">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Plan Contratado</span>
                <strong className="text-2xl font-serif font-bold text-[#B8860B] mt-1 block">Plan {plan.name}</strong>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">S/ {plan.monthlyPricePEN.toFixed(2)} / mes</span>
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

            {/* 3. PLAN LIMIT GAUGES & CAPACITIES */}
            <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#B8860B]" /> Restricciones y Capacidades de tu Plan ({plan.name})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Límites técnicos aplicados automáticamente en toda la plataforma según tu contrato.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#B8860B] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Plan {plan.name} Activo
                </span>
              </div>

              {/* 4 Gauges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Gauge 1: Active Events */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase text-[11px]">Eventos Activos</span>
                    <strong className="text-slate-900 font-bold">
                      {activeEventsCount} / {plan.maxActiveEvents === -1 ? 'Ilimitados' : plan.maxActiveEvents}
                    </strong>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        plan.maxActiveEvents !== -1 && activeEventsCount >= plan.maxActiveEvents ? 'bg-red-500' : 'bg-[#C5A059]'
                      }`}
                      style={{ 
                        width: plan.maxActiveEvents === -1 
                          ? `${Math.min(100, Math.max(20, activeEventsCount * 20))}%` 
                          : `${Math.min(100, (activeEventsCount / plan.maxActiveEvents) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {plan.maxActiveEvents === -1 
                      ? 'Sin límite de eventos simultáneos' 
                      : `Máximo ${plan.maxActiveEvents} eventos simultáneos`}
                  </span>
                </div>

                {/* Gauge 2: Passes Per Event */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase text-[11px]">Pases por Evento</span>
                    <strong className="text-slate-900 font-bold">Hasta {plan.maxPassesPerEvent}</strong>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full w-full"></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Límite máximo de personas autorizadas por evento
                  </span>
                </div>

                {/* Gauge 3: Workspace Users */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase text-[11px]">Usuarios Equipo</span>
                    <strong className="text-slate-900 font-bold">
                      {teamMembers.length} / {plan.maxWorkspaceUsers === -1 ? 'Ilimitados' : plan.maxWorkspaceUsers}
                    </strong>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        plan.maxWorkspaceUsers !== -1 && teamMembers.length >= plan.maxWorkspaceUsers ? 'bg-red-500' : 'bg-purple-600'
                      }`}
                      style={{ 
                        width: plan.maxWorkspaceUsers === -1 
                          ? '30%' 
                          : `${Math.min(100, (teamMembers.length / plan.maxWorkspaceUsers) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {plan.maxWorkspaceUsers === 1 ? '1 Usuario (Planner independiente)' : `Hasta ${plan.maxWorkspaceUsers} coordinadores y operadores`}
                  </span>
                </div>

                {/* Gauge 4: Cuts Per Event */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase text-[11px]">Cortes de Catering</span>
                    <strong className="text-slate-900 font-bold">
                      {plan.maxCutsPerEvent === -1 ? 'Ilimitados' : `${plan.maxCutsPerEvent} por evento`}
                    </strong>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-full"></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {plan.maxCutsPerEvent === -1 ? 'Snapshots ilimitados para catering' : `Hasta ${plan.maxCutsPerEvent} snapshots por boda`}
                  </span>
                </div>
              </div>

              {/* Complete Features Checklist */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Detalle de Funciones Incluidas en tu Suscripción ({plan.name}):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex items-center gap-2 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0" />
                      <span className="font-semibold text-slate-800 text-[11px]">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. PLATFORM ROLES HIERARCHY MATRIX (EDUCATIONAL UX) */}
            <div className="card-luxury p-6 border border-slate-200 shadow-sm space-y-4 bg-white">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Matriz de Perfiles y Roles del Sistema (RBAC)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conoce el alcance, funciones y responsabilidades de cada perfil dentro de la plataforma EventControl.pe.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {Object.values(ROLE_PERMISSIONS).map((rp) => (
                  <div key={rp.role} className={`p-4 rounded-2xl border space-y-2 ${rp.role === userRole ? 'ring-2 ring-[#C5A059] bg-amber-50/40 border-amber-300' : 'bg-slate-50/70 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rp.badgeColor}`}>
                        {rp.title}
                      </span>
                      {rp.role === userRole && (
                        <span className="text-[10px] font-extrabold text-[#B8860B] uppercase">Tu Rol</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {rp.description}
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 text-[10px] font-mono text-slate-500">
                      <strong>Alcance:</strong> {rp.scope}
                    </div>
                  </div>
                ))}
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

        {/* TAB 3: EQUIPO & ROLES RBAC (ONLY OWNER & ADMIN) */}
        {activeTab === 'team' && isOwnerOrAdmin && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#B8860B]" /> Integrantes del Equipo ({contractInfo.companyName})
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                      Capacidad: {teamMembers.length} / {plan.maxWorkspaceUsers === -1 ? 'Ilimitados' : plan.maxWorkspaceUsers} Usuarios
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gestiona los accesos de tu personal de coordinadores y escáner de puerta para todos los eventos del workspace.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    const planCheck = checkCanAddWorkspaceMember(contractInfo.planCode, teamMembers.length);
                    if (!planCheck.allowed) {
                      alert(`⚠️ RESTRICCIÓN DE PLAN CONTRATADO\n\n${planCheck.reason}`);
                      return;
                    }
                    setShowInviteModal(true);
                  }}
                  className="gold-button font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" /> Invitar Usuario / Operador
                </button>
              </div>

              {teamMembers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-12 h-12 bg-amber-50 text-[#B8860B] rounded-2xl border border-[#C5A059]/30 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No hay colaboradores adicionales registrados</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Agrega a los coordinadores y operadores de puerta que realizarán los escaneos el día de tus eventos.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const planCheck = checkCanAddWorkspaceMember(contractInfo.planCode, teamMembers.length);
                      if (!planCheck.allowed) {
                        alert(`⚠️ RESTRICCIÓN DE PLAN CONTRATADO\n\n${planCheck.reason}`);
                        return;
                      }
                      setShowInviteModal(true);
                    }}
                    className="gold-button font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" /> Crear Primer Sub-usuario
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Rol Asignado</th>
                      <th className="py-3 px-4">Alcance de Permisos</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{m.email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${
                            m.role === 'OWNER' ? 'text-amber-800 font-extrabold' :
                            m.role === 'ADMIN' ? 'text-purple-700' :
                            m.role === 'COORDINADOR' ? 'text-indigo-700' :
                            'text-emerald-700 font-bold'
                          }`}>
                            {m.roleLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{m.permissionsScope}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setResendWhatsAppMember({ member: m });
                              setResendPhone('');
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition inline-flex items-center gap-1 shadow-2xs"
                            title="Reenviar credenciales por WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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

      {/* MODAL PARA CREAR / INVITAR SUB-USUARIO (OPERADOR DE PUERTA / COORDINADOR) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-[#C5A059] shadow-2xl space-y-6 relative">
            <button
              onClick={resetInviteModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {!createdMemberSuccess ? (
              <>
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-amber-50 text-[#B8860B] rounded-2xl border border-[#C5A059]/40 flex items-center justify-center mx-auto shadow-sm">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Invitar Colaborador / Sub-usuario</h2>
                  <p className="text-xs text-slate-500">
                    Crea un acceso para tu personal de puerta (escáner) o coordinadores.
                  </p>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 inline-block mt-1">
                    Plan {plan.name}: {teamMembers.length} de {plan.maxWorkspaceUsers} usuarios ocupados
                  </span>
                </div>

                <form onSubmit={handleCreateSubUser} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nombre Completo del Colaborador
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Ej. Juan Operador Puerta Norte"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Correo Electrónico de Ingreso
                    </label>
                    <input
                      type="email"
                      required
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="puerta.norte@miestudio.pe"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Contraseña de Ingreso
                      </label>
                      <input
                        type="text"
                        required
                        value={newMemberPassword}
                        onChange={(e) => setNewMemberPassword(e.target.value)}
                        placeholder="puerta2026"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Teléfono WhatsApp (Opcional)
                      </label>
                      <input
                        type="text"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        placeholder="+51 987654321"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Rol y Permisos
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as WorkspaceUserRole)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    >
                      <option value="OPERATOR">SEGURIDAD (Puerta) - Escáner QR únicamente</option>
                      <option value="COORDINADOR">COORDINADOR - Gestión de Eventos, Mesas e Invitados</option>
                      <option value="ADMIN">ADMINISTRADOR - Acceso completo operativo</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 gold-button font-bold text-xs rounded-xl transition shadow-md mt-2"
                  >
                    Crear Sub-usuario e Integrar
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">¡Sub-usuario Registrado con Éxito!</h3>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
                  <p><strong>Nombre:</strong> {createdMemberSuccess.member.name}</p>
                  <p><strong>Correo:</strong> {createdMemberSuccess.member.email}</p>
                  <p><strong>Clave:</strong> {createdMemberSuccess.rawPass}</p>
                  <p><strong>Rol:</strong> {createdMemberSuccess.member.roleLabel}</p>
                </div>

                <div className="space-y-2">
                  <a
                    href={getWhatsAppDispatchLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <MessageSquare className="w-4 h-4" /> Enviar Credenciales por WhatsApp
                  </a>

                  <button
                    onClick={resetInviteModal}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                  >
                    Listo / Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA REENVIAR CREDENCIALES POR WHATSAPP (EQUIPO WORKSPACE) */}
      {resendWhatsAppMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-emerald-500 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setResendWhatsAppMember(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Reenviar Acceso por WhatsApp</h2>
              <p className="text-xs text-slate-500">
                Envía las credenciales oficiales de acceso a <strong className="text-slate-800">{resendWhatsAppMember.member.name}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 font-mono">
              <p><strong>Colaborador:</strong> {resendWhatsAppMember.member.name}</p>
              <p><strong>Correo:</strong> {resendWhatsAppMember.member.email}</p>
              <p><strong>Contraseña:</strong> {resendWhatsAppMember.rawPass || resendWhatsAppMember.member.initialPassword || 'puerta2026'}</p>
              <p><strong>Rol:</strong> {resendWhatsAppMember.member.roleLabel}</p>
              <p><strong>Empresa:</strong> {contractInfo.companyName}</p>
            </div>

            <div className="space-y-1.5 text-xs text-left">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Número de WhatsApp (con código de país ej: +51 o 9 dígitos)
              </label>
              <input
                type="text"
                value={resendPhone}
                onChange={(e) => setResendPhone(e.target.value)}
                placeholder="Ej. +51 987654321 o dejar en blanco para abrir WhatsApp Web"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={getResendWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setResendWhatsAppMember(null)}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
              >
                <MessageSquare className="w-4 h-4" /> Abrir WhatsApp y Enviar Credenciales
              </a>

              <button
                onClick={() => setResendWhatsAppMember(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
