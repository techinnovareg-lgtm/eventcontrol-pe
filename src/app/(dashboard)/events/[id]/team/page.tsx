'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Users, UserPlus, ShieldCheck, Lock, ArrowLeft, CheckCircle2, 
  Sparkles, X, MessageSquare, Check, Mail, Phone, Calendar, MapPin,
  Pencil, Trash2
} from 'lucide-react';
import EventNavHeader from '@/components/EventNavHeader';
import { getEventById } from '@/lib/events';
import { getActiveSession, getAccountForSession } from '@/lib/superadmin-store';
import { 
  getEventMembers, createWorkspaceMember, updateWorkspaceMember, deleteWorkspaceMember,
  WorkspaceMemberUser, WorkspaceUserRole 
} from '@/lib/workspace-users';

export default function EventTeamPage() {
  const params = useParams();
  const eventId = String(params.id || 'evt-102');
  const session = getActiveSession();
  const contractInfo = getAccountForSession();
  const currentWorkspaceId = session?.user?.workspaceId || contractInfo.workspaceId || 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);

  // Dynamic Team Members State for this Event
  const [teamMembers, setTeamMembers] = useState<WorkspaceMemberUser[]>([]);

  useEffect(() => {
    setTeamMembers(getEventMembers(eventId, currentWorkspaceId));
  }, [eventId, currentWorkspaceId]);

  // Create Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('puerta2026');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<WorkspaceUserRole>('OPERATOR');
  const [newMemberExpiresAt, setNewMemberExpiresAt] = useState('');
  const [createdMemberSuccess, setCreatedMemberSuccess] = useState<{ member: WorkspaceMemberUser; rawPass: string } | null>(null);

  // Edit Modal State
  const [editingMember, setEditingMember] = useState<WorkspaceMemberUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<WorkspaceUserRole>('OPERATOR');
  const [editStatus, setEditStatus] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editMemberSuccess, setEditMemberSuccess] = useState<string | null>(null);

  const handleCreateSubUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const pass = newMemberPassword.trim() || 'puerta2026';
    const created = createWorkspaceMember({
      workspaceId: currentWorkspaceId,
      eventId,
      name: newMemberName,
      email: newMemberEmail,
      password: pass,
      role: newMemberRole,
      credentialsExpiresAt: newMemberExpiresAt ? `${newMemberExpiresAt}T23:59:59.000Z` : undefined,
    });

    setTeamMembers(getEventMembers(eventId, currentWorkspaceId));
    setCreatedMemberSuccess({ member: created, rawPass: pass });
  };

  const openEditModal = (member: WorkspaceMemberUser) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditPassword(member.initialPassword || 'puerta2026');
    setEditRole(member.role);
    setEditStatus(member.status);
    setEditExpiresAt(member.credentialsExpiresAt ? member.credentialsExpiresAt.split('T')[0] : '');
    setEditMemberSuccess(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim() || !editEmail.trim()) return;

    updateWorkspaceMember(editingMember.id, {
      name: editName,
      email: editEmail,
      initialPassword: editPassword,
      role: editRole,
      status: editStatus,
      credentialsExpiresAt: editExpiresAt ? `${editExpiresAt}T23:59:59.000Z` : '',
    });

    setTeamMembers(getEventMembers(eventId, currentWorkspaceId));
    setEditMemberSuccess('¡Colaborador actualizado exitosamente!');
    setTimeout(() => {
      setEditingMember(null);
      setEditMemberSuccess(null);
    }, 1500);
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (confirm(`¿Estás seguro de eliminar a ${memberName} del equipo de este evento?`)) {
      deleteWorkspaceMember(memberId);
      setTeamMembers(getEventMembers(eventId, currentWorkspaceId));
    }
  };

  const resetInviteModal = () => {
    setShowInviteModal(false);
    setCreatedMemberSuccess(null);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPassword('puerta2026');
    setNewMemberPhone('');
    setNewMemberRole('OPERATOR');
    setNewMemberExpiresAt('');
  };

  const getWhatsAppDispatchLink = () => {
    if (!createdMemberSuccess) return '#';
    const eventTitle = event?.name || 'Evento Social';
    const text = encodeURIComponent(
      `Hola ${createdMemberSuccess.member.name}, se ha activado tu acceso como ${createdMemberSuccess.member.roleLabel} para el evento: "${eventTitle}".\n\n` +
      `🌐 Acceso Web: https://eventcontrol.pe/login\n` +
      `📧 Usuario / Correo: ${createdMemberSuccess.member.email}\n` +
      `🔑 Contraseña: ${createdMemberSuccess.rawPass}\n\n` +
      `Al ingresar irás directo al módulo de control y escáner QR de la puerta.`
    );
    const phoneCleaned = newMemberPhone.replace(/[^0-9]/g, '');
    return phoneCleaned ? `https://wa.me/${phoneCleaned}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <EventNavHeader currentTab="team" eventId={eventId} eventName={event?.name} />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Navigation & Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/events" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition mb-2">
              <ArrowLeft className="w-4 h-4 text-[#B8860B]" /> Volver al Catálogo de Eventos
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-[#B8860B]" /> Equipo & Operadores del Evento
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {event?.name || 'Evento Principal'} • {event?.event_date || 'Fecha programada'} • {event?.venue_name || 'Local'}
            </p>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="gold-button font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Invitar / Crear Operador de Puerta
          </button>
        </div>

        {/* Event Team Table Card */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B8860B]" /> Personal Asignado a este Evento ({teamMembers.length})
              </h2>
              <p className="text-xs text-slate-500">
                Los colaboradores creados aquí tendrán acceso a la plataforma para coordinar y escanear pases QR en puerta.
              </p>
            </div>
            <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ACCESO WEB ACTIVO
            </span>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-[#B8860B] rounded-2xl border border-[#C5A059]/40 flex items-center justify-center mx-auto shadow-sm">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No hay operadores asignados aún para {event?.name}</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Agrega al personal de seguridad y coordinadores que estarán en la puerta de este evento realizando la lectura de pases QR.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="gold-button font-bold text-xs px-5 py-3 rounded-xl transition shadow-md inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Crear Primer Operador para este Evento
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Colaborador / Usuario</th>
                    <th className="py-3.5 px-4">Rol Asignado</th>
                    <th className="py-3.5 px-4">Vencimiento Credenciales</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block text-sm">{m.name}</span>
                        <span className="text-xs text-slate-500 font-mono">{m.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold block ${
                          m.role === 'OWNER' ? 'text-amber-800 font-black' :
                          m.role === 'ADMIN' ? 'text-purple-700' :
                          m.role === 'COORDINADOR' ? 'text-indigo-700' :
                          'text-emerald-700 font-bold'
                        }`}>
                          {m.roleLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[180px]">{m.permissionsScope}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {(() => {
                          const expStr = m.credentialsExpiresAt || contractInfo?.contractEndDate;
                          if (!expStr) return <span className="text-slate-400 font-mono text-[10px]">Sin límite</span>;
                          const expDate = new Date(expStr);
                          const isExpired = Date.now() > expDate.getTime();
                          const formatted = expDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                          return (
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border inline-block ${
                              isExpired 
                                ? 'bg-red-100 text-red-800 border-red-300' 
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {isExpired ? `🔴 EXPIRADA (${formatted})` : `🟢 VIGENTE (${formatted})`}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          m.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(m)}
                            className="px-2.5 py-1 text-xs font-bold text-[#B8860B] hover:text-slate-900 bg-amber-50 hover:bg-amber-100 border border-[#C5A059]/40 rounded-lg transition flex items-center gap-1 shadow-2xs"
                            title="Editar datos del colaborador"
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </button>

                          {m.role !== 'OWNER' && (
                            <button
                              onClick={() => handleDeleteMember(m.id, m.name)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition"
                              title="Eliminar colaborador del evento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PARA CREAR / INVITAR OPERADOR DE EVENTO */}
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
                  <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Crear Operador para este Evento</h2>
                  <p className="text-xs text-slate-500">
                    Asigna un usuario de puerta para <strong className="text-slate-800">{event?.name || 'este evento'}</strong>.
                  </p>
                </div>

                <form onSubmit={handleCreateSubUser} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nombre del Operador / Colaborador
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Ej. Puerta Principal 2 - Pedro"
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
                      placeholder="puerta2@miestudio.pe"
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
                        WhatsApp (Opcional)
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
                      Rol Asignado
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as WorkspaceUserRole)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    >
                      <option value="OPERATOR">OPERADOR / SEGURIDAD (Escáner de Puerta únicamente)</option>
                      <option value="COORDINADOR">COORDINADOR (Edición de Listas y Mesas del Evento)</option>
                      <option value="ADMIN">ADMINISTRADOR (Acceso Completo al Evento)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      📅 Vencimiento de Credenciales
                    </label>
                    <input
                      type="date"
                      value={newMemberExpiresAt}
                      onChange={(e) => setNewMemberExpiresAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">
                      💡 <em>Si lo dejas en blanco, vencerá automáticamente cuando venza el plan contratado ({contractInfo?.contractEndDate ? new Date(contractInfo.contractEndDate).toLocaleDateString('es-PE') : 'Plan Principal'}).</em>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 gold-button font-bold text-xs rounded-xl transition shadow-md mt-2"
                  >
                    Crear Operador y Asignar al Evento
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">¡Operador Creado para {event?.name}!</h3>
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
                  <p><strong>Operador:</strong> {createdMemberSuccess.member.name}</p>
                  <p><strong>Correo:</strong> {createdMemberSuccess.member.email}</p>
                  <p><strong>Clave:</strong> {createdMemberSuccess.rawPass}</p>
                  <p><strong>Rol:</strong> {createdMemberSuccess.member.roleLabel}</p>
                  <p><strong>Evento:</strong> {event?.name}</p>
                </div>

                <div className="space-y-2">
                  <a
                    href={getWhatsAppDispatchLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <MessageSquare className="w-4 h-4" /> Enviar Acceso por WhatsApp
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

      {/* MODAL PARA EDITAR COLABORADOR / OPERADOR DE EVENTO */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-[#C5A059] shadow-2xl space-y-6 relative">
            <button
              onClick={() => setEditingMember(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-amber-50 text-[#B8860B] rounded-2xl border border-[#C5A059]/40 flex items-center justify-center mx-auto shadow-sm">
                <Pencil className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Editar Colaborador</h2>
              <p className="text-xs text-slate-500">
                Actualiza los accesos o datos del colaborador de <strong className="text-slate-800">{event?.name || 'este evento'}</strong>.
              </p>
            </div>

            {editMemberSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl text-center">
                {editMemberSuccess}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
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
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'ACTIVO' | 'INACTIVO')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  >
                    <option value="ACTIVO">ACTIVO (Permitir Ingreso)</option>
                    <option value="INACTIVO">INACTIVO (Bloquear Ingreso)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rol Asignado
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as WorkspaceUserRole)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                >
                  <option value="OPERATOR">OPERADOR / SEGURIDAD (Escáner de Puerta únicamente)</option>
                  <option value="COORDINADOR">COORDINADOR (Edición de Listas y Mesas del Evento)</option>
                  <option value="ADMIN">ADMINISTRADOR (Acceso Completo al Evento)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  📅 Vencimiento de Credenciales
                </label>
                <input
                  type="date"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  💡 <em>Dejar en blanco para aplicar vencimiento según plan del usuario principal ({contractInfo?.contractEndDate ? new Date(contractInfo.contractEndDate).toLocaleDateString('es-PE') : 'Plan'}).</em>
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 gold-button font-bold text-xs rounded-xl shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
