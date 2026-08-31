'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft, RefreshCw, ShieldAlert, Download, Phone, Check, Copy } from 'lucide-react';
import { getEventById, getEventGuestGroups } from '@/lib/events';
import { getOrCreateGroupQRToken, revokeAndRegenerateQRToken } from '@/lib/qr-engine';

export default function QRManagementPage() {
  const params = useParams();
  const eventId = String(params.id || 'evt-102');
  const currentWorkspaceId = 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);
  const groups = getEventGuestGroups(eventId);

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
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Volver a Eventos
          </Link>
          <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-3 py-1 rounded-full">
            {event?.name || 'Evento'}
          </span>
        </div>

        {/* Page Title */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Generación Criptográfica de QR</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Gestión de Códigos QR por Grupo</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada grupo posee un token único de 256 bits sin datos personales codificados en la imagen (Cero PII).
            </p>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600 shrink-0" />
            <span><strong>{groups.length}</strong> QR Generados</span>
          </div>
        </div>

        {/* QR List Grid */}
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
      </div>
    </div>
  );
}
