'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  MessageSquare, ArrowLeft, Send, CheckCircle2, PhoneOff, 
  Copy, ExternalLink, Settings, Sparkles, MapPin, QrCode, Users
} from 'lucide-react';
import { getEventById, getEventGuestGroups } from '@/lib/events';
import { getEventTables, getEventTableAssignments } from '@/lib/tables';
import { getOrCreateGroupQRToken } from '@/lib/qr-engine';
import { 
  DEFAULT_WHATSAPP_TEMPLATE, formatWhatsAppMessage, generateWhatsAppLink 
} from '@/lib/whatsapp';

export default function WhatsAppMessagingPage() {
  const params = useParams();
  const eventId = String(params.id || 'evt-102');
  const currentWorkspaceId = 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);
  const groups = getEventGuestGroups(eventId);
  const assignments = getEventTableAssignments(eventId);
  const tables = getEventTables(eventId);

  const [template, setTemplate] = useState<string>(DEFAULT_WHATSAPP_TEMPLATE);
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);

  const getGroupDetails = (group: any) => {
    const token = getOrCreateGroupQRToken(group.id, eventId, currentWorkspaceId);
    const qrUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/scan?token=${token.token_hash}` 
      : `https://app.eventos.pe/scan?token=${token.token_hash}`;

    const asgn = assignments.find(a => a.group_id === group.id);
    let tableName = 'Sin Mesa Asignada';
    if (asgn) {
      const tbl = tables.find(t => t.id === asgn.table_id);
      if (tbl) tableName = tbl.name;
    }

    return {
      groupName: group.group_name,
      eventName: event?.name || 'Evento',
      tableName,
      qrUrl,
    };
  };

  const handleOpenWhatsApp = (phone: string, group: any) => {
    const data = getGroupDetails(group);
    const message = formatWhatsAppMessage(template, data);
    const link = generateWhatsAppLink(phone, message);
    window.open(link, '_blank');
  };

  const handleCopyMessage = (group: any) => {
    const data = getGroupDetails(group);
    const message = formatWhatsAppMessage(template, data);
    navigator.clipboard.writeText(message);
    setCopiedGroup(group.id);
    setTimeout(() => setCopiedGroup(null), 2000);
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
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> WhatsApp Asistido (Costo S/ 0)
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Envío de Códigos QR por WhatsApp</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Genera enlaces directos wa.me para enviar los mensajes preparados desde tu propia cuenta sin costo de mensajería API.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Envío asistido activo</span>
          </div>
        </div>

        {/* Template Editor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Template Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" /> Plantilla del Mensaje
            </h3>
            <p className="text-xs text-slate-500">
              Personaliza el mensaje. Puedes usar las variables: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono text-[11px]">&#123;GRUPO&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono text-[11px]">&#123;EVENTO&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono text-[11px]">&#123;MESA&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono text-[11px]">&#123;ENLACE_QR&#125;</code>.
            </p>

            <textarea
              rows={8}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <button
              onClick={() => setTemplate(DEFAULT_WHATSAPP_TEMPLATE)}
              className="text-xs text-slate-500 hover:text-emerald-600 underline font-medium"
            >
              Restablecer plantilla predeterminada
            </button>
          </div>

          {/* Message Live Preview */}
          <div className="bg-emerald-950 text-white rounded-2xl border border-emerald-900 p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Vista Previa WhatsApp</h3>
              </div>

              <div className="p-4 bg-emerald-900/60 rounded-xl border border-emerald-800 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {groups.length > 0 ? formatWhatsAppMessage(template, getGroupDetails(groups[0])) : 'Sin grupos cargados.'}
              </div>
            </div>

            <div className="text-[11px] text-emerald-400/80 italic border-t border-emerald-900 pt-3">
              * El mensaje se abrirá en WhatsApp Web (Desktop) o en la app de WhatsApp (Smartphone) listo para presionar Enviar.
            </div>
          </div>
        </div>

        {/* Guest Groups Dispatch List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Lista de Invitados para Envío ({groups.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Grupo / Responsable</th>
                  <th className="py-3 px-4">Pases</th>
                  <th className="py-3 px-4">Mesa</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Acción WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map((group) => {
                  const hasPhone = Boolean(group.responsible_phone && group.responsible_phone.trim());

                  return (
                    <tr key={group.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{group.group_name}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{group.max_passes} pases</td>
                      <td className="py-3 px-4 text-purple-700 font-semibold">{getGroupDetails(group).tableName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {hasPhone ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Send className="w-3 h-3" /> {group.responsible_phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic flex items-center gap-1">
                            <PhoneOff className="w-3 h-3" /> Sin Teléfono
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {hasPhone ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenWhatsApp(group.responsible_phone!, group)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Enviar por WhatsApp
                            </button>
                            <button
                              onClick={() => handleCopyMessage(group)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                              title="Copiar texto del mensaje"
                            >
                              {copiedGroup === group.id ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Acción deshabilitada</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
