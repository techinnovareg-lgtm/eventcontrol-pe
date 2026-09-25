'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  MessageSquare, ArrowLeft, Send, CheckCircle2, PhoneOff, 
  Copy, ExternalLink, Settings, Sparkles, MapPin, QrCode, Users,
  ShieldAlert, Clock, AlertTriangle, ChevronDown, ChevronUp, Coffee,
  Lock, ShieldCheck, HelpCircle, Info, RefreshCw, FileText
} from 'lucide-react';
import EventNavHeader from '@/components/EventNavHeader';
import { getEventById, getEventByIdAsync, getEventGuestGroups, getEventGuestGroupsAsync } from '@/lib/events';
import { getEventTables, getEventTableAssignments } from '@/lib/tables';
import { getActiveSession, getAccountForSession } from '@/lib/superadmin-store';
import { Event } from '@/lib/supabase/types';
import { getOrCreateGroupQRToken } from '@/lib/qr-engine';
import { 
  DEFAULT_WHATSAPP_TEMPLATE, FIRST_GREETING_SAFE_TEMPLATE, formatWhatsAppMessage,
  generateWhatsAppLink, recordWhatsAppSent, getWhatsAppSentLogMap, WALogItem
} from '@/lib/whatsapp';

export default function WhatsAppMessagingPage() {
  const params = useParams();
  const eventId = String(params.id || '');
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws-a-1111');

  const [event, setEvent] = useState<Event | undefined>(() => getEventById(eventId));
  const [groups, setGroups] = useState(() => getEventGuestGroups(eventId));
  const assignments = getEventTableAssignments(eventId);
  const tables = getEventTables(eventId);

  // Sent logs & Anti-ban state
  const [sentLogs, setSentLogs] = useState<Record<string, WALogItem>>({});
  const [messageMode, setMessageMode] = useState<'FULL_INVITATION' | 'FIRST_GREETING'>('FULL_INVITATION');
  const [template, setTemplate] = useState<string>(DEFAULT_WHATSAPP_TEMPLATE);
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);
  const [showAntiBanGuide, setShowAntiBanGuide] = useState<boolean>(true);

  // Anti-Spam Timer / Cooldown State
  const [lastSentTimestamp, setLastSentTimestamp] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

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
        setSentLogs(getWhatsAppSentLogMap(eventId));
      }
    }
    loadOnlineData();
  }, [eventId]);

  useEffect(() => {
    if (!lastSentTimestamp) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastSentTimestamp) / 1000);
      const remaining = Math.max(0, 35 - elapsed); // 35s recommended delay
      setSecondsRemaining(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSentTimestamp]);

  const handleModeChange = (mode: 'FULL_INVITATION' | 'FIRST_GREETING') => {
    setMessageMode(mode);
    if (mode === 'FULL_INVITATION') {
      setTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    } else {
      setTemplate(FIRST_GREETING_SAFE_TEMPLATE);
    }
  };

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
    // Check if sending too fast (< 15 seconds)
    if (lastSentTimestamp) {
      const elapsedSec = (Date.now() - lastSentTimestamp) / 1000;
      if (elapsedSec < 15) {
        const confirmSend = confirm(
          `⏱️ PAUSA ANTI-SPAM RECOMENDADA\n\nHan transcurrido solo ${Math.floor(elapsedSec)}s desde tu último envío. Para evitar que WhatsApp bloquee tu cuenta por detectar comportamiento de "bot", se recomienda esperar de 30 a 60 segundos entre mensajes.\n\n¿Deseas continuar enviando de todas formas?`
        );
        if (!confirmSend) return;
      }
    }

    const data = getGroupDetails(group);
    const message = formatWhatsAppMessage(template, data);
    const link = generateWhatsAppLink(phone, message);
    
    // Record timestamp sent_at
    const sentIso = recordWhatsAppSent(eventId, group.id, phone, messageMode);
    setSentLogs(prev => ({
      ...prev,
      [group.id]: {
        groupId: group.id,
        phone,
        sentAt: sentIso,
        messageType: messageMode,
      }
    }));
    setLastSentTimestamp(Date.now());
    setSecondsRemaining(35);

    window.open(link, '_blank');
  };

  const handleCopyMessage = (group: any) => {
    const data = getGroupDetails(group);
    const message = formatWhatsAppMessage(template, data);
    navigator.clipboard.writeText(message);
    setCopiedGroup(group.id);
    
    // Record timestamp sent_at
    const sentIso = recordWhatsAppSent(eventId, group.id, group.responsible_phone || '', messageMode);
    setSentLogs(prev => ({
      ...prev,
      [group.id]: {
        groupId: group.id,
        phone: group.responsible_phone || '',
        sentAt: sentIso,
        messageType: messageMode,
      }
    }));

    setTimeout(() => setCopiedGroup(null), 2000);
  };

  const formatSentTime = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${day}/${month} ${timeStr}`;
    } catch (e) {
      return isoString;
    }
  };

  // Dispatch Batch Statistics
  const totalCount = groups.length;
  const sentCount = Object.keys(sentLogs).length;
  const pendingCount = Math.max(0, totalCount - sentCount);
  const currentBatchMessageNum = (sentCount % 25) + 1;
  const currentBatchNum = Math.floor(sentCount / 25) + 1;
  const isRestingPeriod = sentCount > 0 && sentCount % 25 === 0 && pendingCount > 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col select-none">
      <EventNavHeader currentTab="whatsapp" eventId={eventId} eventName={event?.name} />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">

        {/* Page Title & Status Banner */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> WhatsApp Asistido con Protección Anti-Baneo
              </span>
              <span className="text-[11px] font-serif font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-[#C5A059]/40 shadow-2xs">
                🍷 Evento: {event?.name}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">Despacho de Invitaciones por WhatsApp</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistema de envío seguro con temporizador de ritmo, descansos por bloque y registro de hora de envío.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 self-start sm:self-auto">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-[11px]">Protección Anti-Spam Activa</strong>
              <span className="text-[10px] text-emerald-700">Ritmo seguro: 30-60s entre envíos</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE WHATSAPP ANTI-BAN SAFETY GUIDE ACCORDION */}
        <div className="card-luxury border border-amber-300 bg-amber-50/40 p-5 shadow-sm space-y-3">
          <button
            type="button"
            onClick={() => setShowAntiBanGuide(!showAntiBanGuide)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="text-sm font-bold text-amber-955 uppercase tracking-wider">
                🛡️ Guía y Protocolos Anti-Baneo de WhatsApp para Wedding Planners
              </h3>
            </div>
            {showAntiBanGuide ? <ChevronUp className="w-5 h-5 text-amber-700" /> : <ChevronDown className="w-5 h-5 text-amber-700" />}
          </button>

          {showAntiBanGuide && (
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs border-t border-amber-200/80 animate-in fade-in duration-200">
              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" /> 1. Ritmo de Envío (30-60s)
                </span>
                <p className="text-[#4A5568] text-[11px] leading-relaxed">
                  Deja pasar entre 30 segundos y 1 minuto entre cada mensaje. WhatsApp detecta envíos automáticos instantáneos como comportamiento de bot.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-700" /> 2. Descansos por Bloques
                </span>
                <p className="text-[#4A5568] text-[11px] leading-relaxed">
                  Envía en bloques de 20 a 30 invitaciones y realiza una pausa obligatoria de 15 a 20 minutos antes de continuar con el siguiente grupo.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <PhoneOff className="w-4 h-4 text-red-600" /> 3. No Usar Listas de Difusión
                </span>
                <p className="text-[#4A5568] text-[11px] leading-relaxed">
                  Las listas de difusión NO entregan el mensaje a contactos que no te tienen agendado. El envío directo wa.me garantiza entrega individual.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" /> 4. Personalización Obligatoria
                </span>
                <p className="text-[#4A5568] text-[11px] leading-relaxed">
                  Varía el texto usando las etiquetas <code className="bg-slate-100 text-emerald-800 px-1 rounded">&#123;GRUPO&#125;</code> y <code className="bg-slate-100 text-emerald-800 px-1 rounded">&#123;MESA&#125;</code>. Los mensajes 100% idénticos activan el filtro de spam.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-600" /> 5. Pregunta de Confirmación (CTA)
                </span>
                <p className="text-[#4A5568] text-[11px] leading-relaxed">
                  Concluye el mensaje con una pregunta (ej. <em>"¿Nos acompañan? Avísame para confirmar..."</em>). La respuesta del invitado elimina el riesgo de baneo.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600" /> 6. Saludo Seguro Sin Enlace
                </span>
                <p className="text-[#4A5568] text-[11px] leading-relaxed">
                  Si vas a enviar a números lejanos o no agendados, utiliza la plantilla "Primer Saludo Seguro" sin URL previa para evitar alertas de spam.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BATCH MONITOR & COOLDOWN BAR */}
        <div className="card-luxury p-5 border border-emerald-300 bg-white shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Monitor de Ritmo y Cooldown Anti-Spam</h4>
                <p className="text-xs text-slate-500">
                  Progreso: <strong className="text-emerald-700">{sentCount} de {totalCount} enviadas</strong> ({totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                Bloque #{currentBatchNum} (Envío {currentBatchMessageNum} de 25)
              </span>

              {secondsRemaining > 0 ? (
                <span className="text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-amber-700" /> Espera recomendada: {secondsRemaining}s
                </span>
              ) : (
                <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Listo para siguiente envío
                </span>
              )}
            </div>
          </div>

          {/* Resting Period Warning */}
          {isRestingPeriod && (
            <div className="p-3 bg-amber-100/80 border border-amber-300 rounded-xl flex items-center gap-3 text-xs text-amber-950 font-semibold">
              <Coffee className="w-6 h-6 text-amber-700 shrink-0" />
              <div>
                <strong className="block text-amber-900 font-bold">☕ PAUSA DE SEGURIDAD RECOMENDADA (15 - 20 minutos)</strong>
                <span>Has completado {sentCount} envíos en el Bloque #{currentBatchNum - 1}. Toma un descanso para garantizar que tu cuenta de WhatsApp no sea sancionada.</span>
              </div>
            </div>
          )}
        </div>

        {/* MODE SELECTOR & TEMPLATE EDITOR GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Template Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600" /> Modo y Plantilla del Mensaje
              </h3>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => handleModeChange('FULL_INVITATION')}
                className={`py-2 px-3 rounded-lg transition text-center ${messageMode === 'FULL_INVITATION' ? 'bg-emerald-700 text-white shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                💬 Invitación Completa (Con QR)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('FIRST_GREETING')}
                className={`py-2 px-3 rounded-lg transition text-center ${messageMode === 'FIRST_GREETING' ? 'bg-indigo-700 text-white shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🛡️ Primer Saludo Seguro (Sin Link)
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Variables disponibles: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono text-[11px]">&#123;GRUPO&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono text-[11px]">&#123;EVENTO&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono text-[11px]">&#123;MESA&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono text-[11px]">&#123;ENLACE_QR&#125;</code>.
            </p>

            <textarea
              rows={8}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <div className="flex justify-between items-center text-xs">
              <button
                onClick={() => handleModeChange(messageMode)}
                className="text-slate-500 hover:text-emerald-600 underline font-medium"
              >
                Restablecer plantilla del modo
              </button>
            </div>
          </div>

          {/* Message Live Preview */}
          <div className="bg-emerald-950 text-white rounded-2xl border border-emerald-900 p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Vista Previa WhatsApp (Personalizada)</h3>
              </div>

              <div className="p-4 bg-emerald-900/60 rounded-xl border border-emerald-800 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {groups.length > 0 ? formatWhatsAppMessage(template, getGroupDetails(groups[0])) : 'Sin grupos cargados.'}
              </div>
            </div>

            <div className="text-[11px] text-emerald-400/80 italic border-t border-emerald-900 pt-3">
              * El mensaje se abrirá en WhatsApp Web o App personalizado con el nombre del invitado y su hora de envío auditada.
            </div>
          </div>
        </div>

        {/* GUEST GROUPS DISPATCH LIST WITH TIMESTAMP LOGGING */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Lista de Invitados para Envío ({groups.length})
            </h3>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                ✅ Enviados: {sentCount}
              </span>
              <span className="text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                ⏰ Pendientes: {pendingCount}
              </span>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">Aún no hay invitados importados para este evento.</p>
              <p className="text-slate-500">Carga tu lista de invitados desde la sección de Excel para habilitar los envíos asistidos por WhatsApp.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Grupo / Responsable</th>
                  <th className="py-3 px-4">Pases</th>
                  <th className="py-3 px-4">Mesa</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Hora de Envío (sent_at)</th>
                  <th className="py-3 px-4">Acción WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map((group) => {
                  const hasPhone = Boolean(group.responsible_phone && group.responsible_phone.trim());
                  const logItem = sentLogs[group.id];
                  const sentTimeFormatted = logItem ? formatSentTime(logItem.sentAt) : null;

                  return (
                    <tr key={group.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{group.group_name}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{group.max_passes} pases</td>
                      <td className="py-3 px-4 text-purple-700 font-semibold">{getGroupDetails(group).tableName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {hasPhone ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Send className="w-3 h-3 text-emerald-600" /> {group.responsible_phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic flex items-center gap-1">
                            <PhoneOff className="w-3 h-3" /> Sin Teléfono
                          </span>
                        )}
                      </td>
                      
                      {/* Recorded Sent Timestamp Column */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sentTimeFormatted ? (
                          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enviado: {sentTimeFormatted}
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded italic">
                            ⏰ Pendiente
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
                              title="Copiar texto del mensaje y registrar envío"
                            >
                              {copiedGroup === group.id ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Sin teléfono registrado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
