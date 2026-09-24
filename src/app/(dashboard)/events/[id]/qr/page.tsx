'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft, RefreshCw, ShieldAlert, Download, Phone, Check, Copy, FileSpreadsheet, UserCheck, Users, CheckCircle2, XCircle, AlertTriangle, UserPlus, Edit3 } from 'lucide-react';
import EventNavHeader from '@/components/EventNavHeader';
import { getEventById, getEventByIdAsync, getEventGuestGroups, getEventGuestGroupsAsync, updateGuestGroupCompanionsAsync } from '@/lib/events';
import { getOrCreateGroupQRToken, revokeAndRegenerateQRToken } from '@/lib/qr-engine';
import { getActiveSession, getAccountForSession } from '@/lib/superadmin-store';
import { Event, GuestCompanion } from '@/lib/supabase/types';

export default function QRManagementPage() {
  const params = useParams();
  const eventId = String(params.id || '');
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws-a-1111');
  const [event, setEvent] = useState<Event | undefined>(() => getEventById(eventId));
  const [groups, setGroups] = useState(() => getEventGuestGroups(eventId));
  const [editingCompanionName, setEditingCompanionName] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadOnlineData() {
      const session = getActiveSession();
      const account = getAccountForSession();
      const wsId = session?.user?.workspaceId || account?.workspaceId || 'ws-a-1111';
      setCurrentWorkspaceId(wsId);
      if (eventId) {
        const [evt, grps] = await Promise.all([
          getEventByIdAsync(eventId, wsId),
          getEventGuestGroupsAsync(eventId),
        ]);
        if (evt) setEvent(evt);
        if (grps) setGroups(grps);
      }
    }
    loadOnlineData();
  }, [eventId]);

  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const handleCopyLink = (tokenHash: string, id: string) => {
    const qrUrl = `${window.location.origin}/scan?token=${tokenHash}`;
    navigator.clipboard.writeText(qrUrl);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handleRegenerate = (groupId: string) => {
    if (confirm('¿Estás seguro de regenerar el código QR? El código anterior quedará invalidad e inutilizable inmediatamente.')) {
      revokeAndRegenerateQRToken(groupId, eventId, currentWorkspaceId);
      setCopiedTokenId(`regen-${Date.now()}`);
    }
  };

  const handleToggleCompanionApproval = async (groupId: string, companionId: string, isApproved: boolean) => {
    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return;

    const companions = targetGroup.companions ? [...targetGroup.companions] : [];
    const compIdx = companions.findIndex(c => c.id === companionId);
    if (compIdx !== -1) {
      companions[compIdx] = { ...companions[compIdx], isApproved };
      await updateGuestGroupCompanionsAsync(eventId, groupId, companions);
      const updatedGrps = await getEventGuestGroupsAsync(eventId);
      setGroups(updatedGrps);
    }
  };

  const handleVerifyUnnamedCompanion = async (groupId: string, companionId: string) => {
    const nameInput = (editingCompanionName[companionId] || '').trim();
    if (!nameInput) {
      alert('Por favor ingrese el nombre completo del acompañante para verificarlo y autorizar su acceso.');
      return;
    }

    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return;

    const companions = targetGroup.companions ? [...targetGroup.companions] : [];
    const compIdx = companions.findIndex(c => c.id === companionId);
    if (compIdx !== -1) {
      companions[compIdx] = {
        ...companions[compIdx],
        name: nameInput,
        isNamed: true,
        isApproved: true,
      };
      await updateGuestGroupCompanionsAsync(eventId, groupId, companions);
      const updatedGrps = await getEventGuestGroupsAsync(eventId);
      setGroups(updatedGrps);
      setEditingCompanionName(prev => ({ ...prev, [companionId]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <EventNavHeader currentTab="qr" eventId={eventId} eventName={event?.name} />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">

        {/* Page Title */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Generación Criptográfica de QR</span>
              <span className="text-[11px] font-serif font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-[#C5A059]/40 shadow-2xs">
                🍷 Evento: {event?.name}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">Gestión de Códigos QR por Grupo y Protocolos de Acompañantes</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Control estricto de accesos: los acompañantes sin verificar o no autorizados serán filtrados automáticamente en la puerta.
            </p>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-center gap-2 self-start sm:self-auto">
            <QrCode className="w-5 h-5 text-indigo-600 shrink-0" />
            <span><strong>{groups.length}</strong> QR Generados</span>
          </div>
        </div>

        {/* QR List Grid or Empty State */}
        {groups.length === 0 ? (
          <div className="card-luxury p-12 text-center border border-dashed border-slate-300 rounded-2xl space-y-3 bg-white">
            <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-serif font-bold text-slate-800">Aún no hay códigos QR generados</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Para generar pases QR únicos por familia o grupo, primero importa tu lista de invitados desde la sección de Excel.
            </p>
            <div className="pt-2">
              <Link
                href={`/events/${eventId}/import`}
                className="inline-flex items-center gap-2 gold-button px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" /> Ir a Importar Invitados desde Excel
              </Link>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const token = getOrCreateGroupQRToken(group.id, eventId, currentWorkspaceId);
            const qrPayloadUrl = typeof window !== 'undefined' ? `${window.location.origin}/scan?token=${token.token_hash}` : `https://app.eventos.pe/scan?token=${token.token_hash}`;

            // Ensure companions exist if max_passes > 1
            const companionSlotsCount = Math.max(0, group.max_passes - 1);
            let companionsList: GuestCompanion[] = group.companions || [];
            
            if (companionSlotsCount > 0 && companionsList.length === 0) {
              companionsList = Array.from({ length: companionSlotsCount }).map((_, idx) => ({
                id: `comp-${idx + 1}-${group.id}`,
                name: `Acompañante ${idx + 1}`,
                isNamed: false,
                isApproved: false,
              }));
            }

            const approvedCount = 1 + companionsList.filter(c => c.isApproved).length;

            return (
              <div key={group.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-brand-100 text-brand-800 text-xs font-bold rounded-full">
                      {group.max_passes} Pases Permitidos
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${token.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {token.is_active ? 'ACTIVO' : 'REVOCADO'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1 text-center">{group.group_name}</h3>
                  <div className="text-center text-xs text-slate-500 mb-3">
                    Capacidad Autorizada en Puerta: <strong className="text-emerald-700">{approvedCount} de {group.max_passes}</strong>
                  </div>

                  {/* QR SVG Render */}
                  <div className="text-center">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mb-3 shadow-inner">
                      <QRCodeSVG
                        value={qrPayloadUrl}
                        size={130}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* Control de Acompañantes / Protocolos */}
                  {companionSlotsCount > 0 && (
                    <div className="mt-2 pt-3 border-t border-slate-100 text-left space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-600" /> Acompañantes ({companionsList.length})
                        </span>
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                          {companionsList.filter(c => c.isApproved).length} Autorizados
                        </span>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {companionsList.map((comp, idx) => (
                          <div key={comp.id || idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                            {/* Protocol 1: Named Companion */}
                            {comp.isNamed ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={comp.isApproved}
                                      onChange={(e) => handleToggleCompanionApproval(group.id, comp.id, e.target.checked)}
                                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                                    />
                                    <span className={`font-semibold truncate ${comp.isApproved ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                                      {comp.name}
                                    </span>
                                  </label>
                                </div>

                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${comp.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                  {comp.isApproved ? 'Autorizado' : 'Sin Acceso'}
                                </span>
                              </div>
                            ) : (
                              /* Protocol 2: Unnamed / Generic Companion */
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" /> {comp.name || `Acompañante ${idx + 1}`}
                                  </span>
                                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                    Por Verificar
                                  </span>
                                </div>

                                <div className="flex gap-1.5 pt-0.5">
                                  <input
                                    type="text"
                                    placeholder="Nombre y Apellido..."
                                    value={editingCompanionName[comp.id] || ''}
                                    onChange={(e) => setEditingCompanionName({ ...editingCompanionName, [comp.id]: e.target.value })}
                                    className="flex-1 text-xs px-2 py-1 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyUnnamedCompanion(group.id, comp.id)}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition shrink-0"
                                  >
                                    Verificar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono mt-3 text-center break-all">
                    Token: {token.token_hash.substring(0, 16)}...
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full space-y-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleCopyLink(token.token_hash, group.id)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    {copiedTokenId === group.id ? (
                      <> <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado al Portapapeles </>
                    ) : (
                      <> <Copy className="w-3.5 h-3.5" /> Copiar Enlace QR </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRegenerate(group.id)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 border border-slate-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerar Token / Revocar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>
    </div>
  );
}
