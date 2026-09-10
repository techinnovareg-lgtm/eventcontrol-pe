'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft, RefreshCw, ShieldAlert, Download, Phone, Check, Copy, FileSpreadsheet } from 'lucide-react';
import EventNavHeader from '@/components/EventNavHeader';
import { getEventById, getEventByIdAsync, getEventGuestGroups, getEventGuestGroupsAsync } from '@/lib/events';
import { getOrCreateGroupQRToken, revokeAndRegenerateQRToken } from '@/lib/qr-engine';
import { getActiveSession, getAccountForSession } from '@/lib/superadmin-store';
import { Event } from '@/lib/supabase/types';

export default function QRManagementPage() {
  const params = useParams();
  const eventId = String(params.id || '');
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws-a-1111');
  const [event, setEvent] = useState<Event | undefined>(() => getEventById(eventId));
  const [groups, setGroups] = useState(() => getEventGuestGroups(eventId));

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
      // Force re-render
      setCopiedTokenId(`regen-${Date.now()}`);
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
            <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">Gestión de Códigos QR por Grupo</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada grupo posee un token único de 256 bits sin datos personales codificados en la imagen (Cero PII).
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

            return (
              <div key={group.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center justify-between">
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-brand-100 text-brand-800 text-xs font-bold rounded-full">
                      {group.max_passes} Pases Autorizados
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${token.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {token.is_active ? 'ACTIVO' : 'REVOCADO'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-4">{group.group_name}</h3>

                  {/* QR SVG Render */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mb-4 shadow-inner">
                    <QRCodeSVG
                      value={qrPayloadUrl}
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="text-xs text-slate-400 font-mono mb-4 break-all px-2">
                    Token: {token.token_hash.substring(0, 16)}...
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full space-y-2 pt-4 border-t border-slate-100">
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
