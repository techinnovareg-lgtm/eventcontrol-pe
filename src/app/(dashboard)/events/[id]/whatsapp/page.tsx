'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  MessageSquare, ArrowLeft, Send, CheckCircle2, PhoneOff, 
  Copy, ExternalLink, Settings, Sparkles, MapPin, QrCode, Users,
  ShieldAlert, Clock, AlertTriangle, ChevronDown, ChevronUp, Coffee,
  Lock, ShieldCheck, HelpCircle, Info, RefreshCw, FileText,
  Edit3, Save, X, Play, Pause, RotateCcw, Check, Grid,
  Globe, Laptop, Smartphone, Trash2, Undo2, Search, SlidersHorizontal
} from 'lucide-react';
import EventNavHeader from '@/components/EventNavHeader';
import { 
  getEventById, getEventByIdAsync, getEventGuestGroups, getEventGuestGroupsAsync,
  updateGuestGroupPhoneAsync 
} from '@/lib/events';
import { getEventTables, getEventTableAssignments } from '@/lib/tables';
import { getActiveSession, getAccountForSession } from '@/lib/superadmin-store';
import { Event, GuestGroup } from '@/lib/supabase/types';
import { getOrCreateGroupQRToken } from '@/lib/qr-engine';
import { 
  DEFAULT_WHATSAPP_TEMPLATE, FIRST_GREETING_SAFE_TEMPLATE, formatWhatsAppMessage,
  generateWhatsAppLink, dispatchWhatsAppMessage, recordWhatsAppSent, getWhatsAppSentLogMap,
  deleteWhatsAppSentLog, resetAllWhatsAppSentLogs,
  WALogItem, WhatsAppChannel, isMobileDevice
} from '@/lib/whatsapp';

export default function WhatsAppMessagingPage() {
  const params = useParams();
  const eventId = String(params.id || '');
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws-a-1111');

  const [event, setEvent] = useState<Event | undefined>(() => getEventById(eventId));
  const [groups, setGroups] = useState<GuestGroup[]>(() => getEventGuestGroups(eventId));
  const assignments = getEventTableAssignments(eventId);
  const tables = getEventTables(eventId);

  // Sent logs & Anti-ban state
  const [sentLogs, setSentLogs] = useState<Record<string, WALogItem>>({});
  const [messageMode, setMessageMode] = useState<'FULL_INVITATION' | 'FIRST_GREETING'>('FULL_INVITATION');
  const [template, setTemplate] = useState<string>(DEFAULT_WHATSAPP_TEMPLATE);
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);

  // Modals for Friendly Non-Expert UX
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);
  const [showAntiBanModal, setShowAntiBanModal] = useState<boolean>(false);
  const [showChannelModal, setShowChannelModal] = useState<boolean>(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState<boolean>(false);

  // Table Filters & Realtime Search
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [statusFilterTab, setStatusFilterTab] = useState<'ALL' | 'PENDING' | 'SENT' | 'NO_PHONE'>('ALL');
  const [tableFilterMode, setTableFilterMode] = useState<'ALL' | 'WITH_TABLE' | 'WITHOUT_TABLE'>('ALL');

  // Inline Phone Editing State
  const [editingPhoneGroupId, setEditingPhoneGroupId] = useState<string | null>(null);
  const [editingPhoneValue, setEditingPhoneValue] = useState<string>('');
  const [isSavingPhone, setIsSavingPhone] = useState<boolean>(false);

  // Anti-Spam Timer / Cooldown State
  const [lastSentTimestamp, setLastSentTimestamp] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Automated Batch Dispatch Runner State
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [autoBatchSize, setAutoBatchSize] = useState<number>(20);
  const [autoDelaySeconds, setAutoDelaySeconds] = useState<number>(35);
  const [autoRestMinutes, setAutoRestMinutes] = useState<number>(15);
  const [autoRestSecondsRemaining, setAutoRestSecondsRemaining] = useState<number>(0);
  const [autoBlockSentCount, setAutoBlockSentCount] = useState<number>(0);
  const [autoStatusText, setAutoStatusText] = useState<string>('Listo para iniciar envío asistido por bloques');
  const [currentAutoGroupName, setCurrentAutoGroupName] = useState<string | null>(null);

  const handleSkipToNextAutoRunner = () => {
    setLastSentTimestamp(1);
    setSecondsRemaining(0);
  };

  // Dispatch Channel & Tab Control (Bypass Meta intermediate landing page)
  const [dispatchChannel, setDispatchChannel] = useState<WhatsAppChannel>('web');
  const [reuseTab, setReuseTab] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChannel = localStorage.getItem('eventcontrol_wa_channel') as WhatsAppChannel;
      if (savedChannel && ['web', 'desktop_app', 'wa_me'].includes(savedChannel)) {
        setDispatchChannel(savedChannel);
      } else if (isMobileDevice()) {
        setDispatchChannel('wa_me');
      } else {
        setDispatchChannel('web');
      }

      const savedReuse = localStorage.getItem('eventcontrol_wa_reuse_tab');
      if (savedReuse !== null) {
        setReuseTab(savedReuse === 'true');
      }
    }
  }, []);

  const handleChannelChange = (ch: WhatsAppChannel) => {
    setDispatchChannel(ch);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eventcontrol_wa_channel', ch);
    }
  };

  const handleReuseTabChange = (val: boolean) => {
    setReuseTab(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eventcontrol_wa_reuse_tab', String(val));
    }
  };

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

  // Anti-Spam Cooldown Countdown (1 sec ticker)
  useEffect(() => {
    if (!lastSentTimestamp) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastSentTimestamp) / 1000);
      const remaining = Math.max(0, autoDelaySeconds - elapsed);
      setSecondsRemaining(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSentTimestamp, autoDelaySeconds]);

  // Automated Batch Dispatch Runner Loop
  useEffect(() => {
    if (!isAutoRunning) return;

    const autoInterval = setInterval(() => {
      // 1. Check if resting between blocks
      if (autoRestSecondsRemaining > 0) {
        setAutoRestSecondsRemaining(prev => {
          const next = prev - 1;
          if (next <= 0) {
            setAutoBlockSentCount(0);
            setAutoStatusText('☕ Pausa completada. Reanudando envío del siguiente bloque...');
            return 0;
          }
          const m = Math.floor(next / 60);
          const s = next % 60;
          setAutoStatusText(`☕ Pausa de Seguridad en curso: ${m}m ${s < 10 ? '0' : ''}${s}s para reanudar`);
          return next;
        });
        return;
      }

      // 2. Check if currently waiting for anti-spam delay between individual messages
      if (lastSentTimestamp) {
        const elapsedSec = Math.floor((Date.now() - lastSentTimestamp) / 1000);
        if (elapsedSec < autoDelaySeconds) {
          const rem = autoDelaySeconds - elapsedSec;
          setSecondsRemaining(rem);
          setAutoStatusText(`⏳ Chat precargado para "${currentAutoGroupName || 'invitado'}". Presiona ENTER en WhatsApp para enviar. Siguiente contacto en ${rem}s...`);
          return;
        }
      }

      // 3. Find next pending group with phone number
      const pendingGroup = groups.find(g => !sentLogs[g.id] && g.responsible_phone && g.responsible_phone.trim() !== '');

      if (!pendingGroup) {
        setIsAutoRunning(false);
        setCurrentAutoGroupName(null);
        setAutoStatusText('🎉 ¡Envío asistido finalizado! Todos los grupos han sido despachados.');
        return;
      }

      // 4. Check if we reached block limit (e.g. 20 messages)
      if (autoBlockSentCount >= autoBatchSize) {
        const restSec = autoRestMinutes * 60;
        setAutoRestSecondsRemaining(restSec);
        setAutoStatusText(`☕ Bloque de ${autoBatchSize} invitaciones completado. Iniciando pausa de seguridad de ${autoRestMinutes} minutos...`);
        return;
      }

      // 5. Dispatch message to next group
      const data = getGroupDetails(pendingGroup);
      const message = formatWhatsAppMessage(template, data);
      const phone = pendingGroup.responsible_phone!.trim();

      // Dispatch directly using selected channel and tab management
      dispatchWhatsAppMessage(phone, message, dispatchChannel, reuseTab);

      const sentIso = recordWhatsAppSent(eventId, pendingGroup.id, phone, messageMode);
      setSentLogs(prev => ({
        ...prev,
        [pendingGroup.id]: {
          groupId: pendingGroup.id,
          phone,
          sentAt: sentIso,
          messageType: messageMode,
        }
      }));

      setCurrentAutoGroupName(pendingGroup.group_name);
      setLastSentTimestamp(Date.now());
      setSecondsRemaining(autoDelaySeconds);
      setAutoBlockSentCount(prev => prev + 1);
      setAutoStatusText(`📲 Precargado en WhatsApp: "${pendingGroup.group_name}" (${autoBlockSentCount + 1}/${autoBatchSize}). Presiona ENTER en WhatsApp para enviar. Siguiente en ${autoDelaySeconds}s.`);

    }, 1000);

    return () => clearInterval(autoInterval);
  }, [
    isAutoRunning, autoRestSecondsRemaining, lastSentTimestamp, autoDelaySeconds,
    groups, sentLogs, autoBlockSentCount, autoBatchSize, autoRestMinutes, template, eventId, messageMode,
    dispatchChannel, reuseTab, currentAutoGroupName
  ]);

  // Compute table assignment counts
  const groupsWithTableCount = groups.filter(g => assignments.some(a => a.group_id === g.id)).length;
  const groupsWithoutTableCount = Math.max(0, groups.length - groupsWithTableCount);

  const handleStartAutoRunner = () => {
    if (groupsWithoutTableCount > 0) {
      const confirmSend = confirm(
        `⚠️ ADVERTENCIA DE ASIGNACIÓN DE MESAS\n\nTienes ${groupsWithoutTableCount} pases sin mesa asignada.\n\nSi envías los mensajes de WhatsApp ahora, la etiqueta {MESA} dirá "Sin Mesa Asignada" en las invitaciones.\n\n¿Deseas continuar de todas formas con el envío automático?`
      );
      if (!confirmSend) return;
    }

    const pending = groups.filter(g => !sentLogs[g.id] && g.responsible_phone && g.responsible_phone.trim() !== '');
    if (pending.length === 0) {
      alert('No hay invitaciones pendientes con número de teléfono registrado.');
      return;
    }
    setIsAutoRunning(true);
    setAutoStatusText('🚀 Iniciando despacho asistido... Abriendo primer chat en WhatsApp.');
  };

  const handlePauseAutoRunner = () => {
    setIsAutoRunning(false);
    setAutoStatusText('⏸️ Envío asistido pausado por el usuario.');
    setCurrentAutoGroupName(null);
  };

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
      ? `${window.location.origin}/pass?token=${token.token_hash}&event=${eventId}` 
      : `https://eventcontrol-pe.vercel.app/pass?token=${token.token_hash}&event=${eventId}`;

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
    
    // Dispatch directly using selected channel and tab management
    dispatchWhatsAppMessage(phone, message, dispatchChannel, reuseTab);
    
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
    setSecondsRemaining(autoDelaySeconds);
  };

  // Reenviar mensaje
  const handleResendWhatsApp = (phone: string, group: any) => {
    handleOpenWhatsApp(phone, group);
  };

  // Eliminar registro de envío individual (volver a pendiente)
  const handleDeleteSentLog = (groupId: string, groupName: string) => {
    const confirmDel = confirm(
      `¿Deseas eliminar el registro de envío de "${groupName}" y volver a marcarlo como PENDIENTE?`
    );
    if (!confirmDel) return;

    deleteWhatsAppSentLog(eventId, groupId);
    setSentLogs(prev => {
      const updated = { ...prev };
      delete updated[groupId];
      return updated;
    });
  };

  // Restablecer todos a Pendiente (global)
  const handleResetAllSentLogs = () => {
    const confirmReset = confirm(
      `⚠️ RESTABLECER TODOS LOS ENVÍOS\n\n¿Estás seguro de restablecer todos los registros de envío a PENDIENTE para este evento?\n\nEsta acción borrará el historial de horas de envío para que puedas despachar nuevamente a todos los invitados.`
    );
    if (!confirmReset) return;

    resetAllWhatsAppSentLogs(eventId);
    setSentLogs({});
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

  // Handlers for Inline Phone Editing
  const handleStartEditPhone = (group: GuestGroup) => {
    setEditingPhoneGroupId(group.id);
    setEditingPhoneValue(group.responsible_phone || '');
  };

  const handleCancelEditPhone = () => {
    setEditingPhoneGroupId(null);
    setEditingPhoneValue('');
  };

  const handleSavePhone = async (groupId: string) => {
    const trimmed = editingPhoneValue.trim();
    setIsSavingPhone(true);
    try {
      await updateGuestGroupPhoneAsync(eventId, groupId, trimmed);
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, responsible_phone: trimmed } : g));
      setEditingPhoneGroupId(null);
      setEditingPhoneValue('');
    } catch (err) {
      console.error('Error updating group phone:', err);
      alert('Error al guardar el número de teléfono. Inténtalo de nuevo.');
    } finally {
      setIsSavingPhone(false);
    }
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
  const noPhoneCount = groups.filter(g => !g.responsible_phone || !g.responsible_phone.trim()).length;
  const sentPercentage = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  // Filtered groups according to tabs and search query
  const filteredGroups = useMemo(() => {
    const query = tableSearchQuery.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return groups.filter(g => {
      const hasPhone = Boolean(g.responsible_phone && g.responsible_phone.trim());
      const isSent = Boolean(sentLogs[g.id]);

      // Status tab filter
      if (statusFilterTab === 'PENDING' && isSent) return false;
      if (statusFilterTab === 'SENT' && !isSent) return false;
      if (statusFilterTab === 'NO_PHONE' && hasPhone) return false;

      // Table assignment filter
      const hasTable = assignments.some(a => a.group_id === g.id);
      if (tableFilterMode === 'WITH_TABLE' && !hasTable) return false;
      if (tableFilterMode === 'WITHOUT_TABLE' && hasTable) return false;

      // Search query filter
      if (query) {
        const normName = g.group_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const phone = (g.responsible_phone || '').replace(/\D/g, '');
        const asgn = assignments.find(a => a.group_id === g.id);
        const tblName = asgn ? (tables.find(t => t.id === asgn.table_id)?.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';

        return normName.includes(query) || phone.includes(query) || tblName.includes(query);
      }

      return true;
    });
  }, [groups, sentLogs, assignments, tables, statusFilterTab, tableFilterMode, tableSearchQuery]);

  const channelLabel = dispatchChannel === 'desktop_app' 
    ? 'App WhatsApp' 
    : dispatchChannel === 'wa_me' 
    ? 'Enlace Móvil (wa.me)' 
    : 'WhatsApp Web Directo';

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col select-none">
      <EventNavHeader currentTab="whatsapp" eventId={eventId} eventName={event?.name} />
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5 w-full">

        {/* 1. COMPACT & CLEAN HEADER WITH DYNAMIC HELP BUTTONS */}
        <div className="bg-white rounded-2xl p-5 border border-[#C5A059]/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Protegido
              </span>
              <span className="text-[11px] font-serif font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-[#C5A059]/40">
                🍷 {event?.name || 'Evento'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-1.5">
              Despacho de Pases por WhatsApp
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Envía invitaciones con pase QR individual y mesa asignada de forma rápida, segura y guiada.
            </p>
          </div>

          {/* Dynamic Interactive Action Pills */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowHowItWorksModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs"
              title="Aprende cómo funciona el despacho asistido en 3 pasos simples"
            >
              <Info className="w-4 h-4 text-emerald-600" />
              <span>¿Cómo Funciona?</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAntiBanModal(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition flex items-center gap-1.5 shadow-2xs"
              title="Consejos clave para proteger tu número de bloqueos de Meta"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Consejos Anti-Baneo</span>
            </button>

            <button
              type="button"
              onClick={() => setShowChannelModal(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-300 transition flex items-center gap-1.5 shadow-2xs"
              title="Cambia el canal entre WhatsApp Web, App Escritorio o Móvil"
            >
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>Canal: {channelLabel}</span>
            </button>
          </div>
        </div>

        {/* 2. TABLE ASSIGNMENT ALERT (ONLY IF GUESTS HAVE NO TABLE ASSIGNED) */}
        {groupsWithoutTableCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="text-amber-950 font-bold block">
                  Hay {groupsWithoutTableCount} pases sin mesa asignada
                </strong>
                <span className="text-amber-800 text-[11px]">
                  Si envías ahora, las invitaciones dirán "Sin Mesa Asignada". Puedes asignar mesas primero si lo prefieres.
                </span>
              </div>
            </div>

            <Link
              href={`/events/${eventId}/tables`}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-2xs"
            >
              <Grid className="w-3.5 h-3.5" /> Asignar Mesas Primero
            </Link>
          </div>
        )}

        {/* 3. EXECUTIVE DISPATCH COMMAND CENTER (UNIFIED PROGRESS & RUNNER) */}
        <div className="bg-white rounded-2xl border border-emerald-300/80 shadow-md p-5 space-y-4">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Invitados</span>
              <strong className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{totalCount}</strong>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Pases Enviados</span>
              <strong className="text-xl font-bold text-emerald-800 font-mono mt-0.5 block">
                {sentCount} <span className="text-xs font-semibold text-emerald-600">({sentPercentage}%)</span>
              </strong>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <span className="text-[10px] text-amber-700 font-bold uppercase block">Pendientes</span>
              <strong className="text-xl font-bold text-amber-900 font-mono mt-0.5 block">{pendingCount}</strong>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Sin Teléfono</span>
              <strong className="text-xl font-bold text-slate-600 font-mono mt-0.5 block">{noPhoneCount}</strong>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Progreso global del despacho:</span>
              <span className="font-bold text-emerald-700">{sentCount} de {totalCount} completados</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                style={{ width: `${sentPercentage}%` }}
              />
            </div>
          </div>

          {/* Automated Batch Runner Control Strip */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400" /> Despacho Automático Asistido
                </span>
                {secondsRemaining > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/30 border border-amber-400/50 text-amber-300 text-[10px] font-bold rounded-full animate-pulse">
                    Pausa anti-spam: {secondsRemaining}s
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/90 font-mono">
                {autoStatusText}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isAutoRunning ? (
                <button
                  type="button"
                  onClick={handleStartAutoRunner}
                  className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Iniciar Envío Asistido
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSkipToNextAutoRunner}
                    className="px-3.5 py-2.5 bg-emerald-300 hover:bg-emerald-200 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                    title="Cargar inmediatamente el siguiente invitado"
                  >
                    <span>⏭️ Siguiente</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePauseAutoRunner}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 animate-pulse"
                  >
                    <Pause className="w-4 h-4 fill-current" /> Pausar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. COLLAPSIBLE TEMPLATE & PREVIEW ACCORDION (UNCLUTTERED BY DEFAULT) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Plantilla del Mensaje de WhatsApp: {messageMode === 'FULL_INVITATION' ? '💬 Invitación Completa (Con QR y Mesa)' : '🛡️ Primer Saludo Seguro (Sin Link)'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {showTemplateEditor ? 'Toca para ocultar el editor' : 'Toca para ver o personalizar el texto del mensaje'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {showTemplateEditor ? 'Ocultar' : 'Personalizar Texto'}
              </span>
              {showTemplateEditor ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </button>

          {showTemplateEditor && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Editor Column */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Tipo de mensaje:</span>
                    <button
                      onClick={() => handleModeChange(messageMode)}
                      className="text-[11px] text-emerald-700 hover:underline font-semibold"
                    >
                      Restablecer texto original
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => handleModeChange('FULL_INVITATION')}
                      className={`py-2 px-3 rounded-xl border text-center transition ${
                        messageMode === 'FULL_INVITATION'
                          ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      💬 Con Pase QR y Mesa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange('FIRST_GREETING')}
                      className={`py-2 px-3 rounded-xl border text-center transition ${
                        messageMode === 'FIRST_GREETING'
                          ? 'bg-indigo-700 border-indigo-700 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🛡️ Saludo Sin Enlace
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500">
                    Etiquetas: <code className="bg-slate-200 text-slate-800 px-1 rounded">&#123;GRUPO&#125;</code>, <code className="bg-slate-200 text-slate-800 px-1 rounded">&#123;EVENTO&#125;</code>, <code className="bg-slate-200 text-slate-800 px-1 rounded">&#123;MESA&#125;</code>, <code className="bg-slate-200 text-slate-800 px-1 rounded">&#123;ENLACE_QR&#125;</code>.
                  </p>
                </div>

                {/* Live WhatsApp Bubble Preview */}
                <div className="bg-emerald-950 text-white rounded-xl p-4 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Vista Previa en WhatsApp
                    </span>
                    <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-800/80 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      {groups.length > 0 ? formatWhatsAppMessage(template, getGroupDetails(groups[0])) : 'Sin invitados registrados.'}
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-300/70 italic">
                    * El mensaje se abrirá en WhatsApp precargado con los datos del invitado seleccionado.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. GUEST INVITATION TABLE WITH SEARCH, RE-SEND & RESET ACTIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          {/* Table Header with Search, Filter Tabs and Reset Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Lista de Invitados ({filteredGroups.length} mostrados de {groups.length})
                </h3>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatusFilterTab('ALL')}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    statusFilterTab === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilterTab('PENDING')}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    statusFilterTab === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  ⏰ Pendientes ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilterTab('SENT')}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    statusFilterTab === 'SENT'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  ✅ Enviados ({sentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilterTab('NO_PHONE')}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    statusFilterTab === 'NO_PHONE'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sin Teléfono ({noPhoneCount})
                </button>
              </div>
            </div>

            {/* Google-Style Table Search Bar & Reset Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, teléfono o mesa..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs py-2 pl-9 pr-8 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {tableSearchQuery && (
                  <button
                    onClick={() => setTableSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {sentCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAllSentLogs}
                  className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:border-red-300 transition flex items-center gap-1.5 shadow-2xs"
                  title="Restablecer todos los envíos de este evento a estado pendiente"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Todos</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Body */}
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">No se encontraron invitados con los filtros actuales.</p>
              <p className="text-slate-400">Prueba cambiando la búsqueda o seleccionando la pestaña "Todos".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-600 uppercase text-[11px]">
                    <th className="py-3 px-3">Invitado / Familia</th>
                    <th className="py-3 px-3">Pases</th>
                    <th className="py-3 px-3">Mesa</th>
                    <th className="py-3 px-3">Teléfono</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGroups.map((group) => {
                    const hasPhone = Boolean(group.responsible_phone && group.responsible_phone.trim());
                    const logItem = sentLogs[group.id];
                    const isSent = Boolean(logItem);
                    const sentTimeFormatted = logItem ? formatSentTime(logItem.sentAt) : null;
                    const isEditingThisPhone = editingPhoneGroupId === group.id;

                    return (
                      <tr key={group.id} className="hover:bg-slate-50/80 transition">
                        {/* Name Column */}
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block font-semibold">{group.group_name}</strong>
                        </td>

                        {/* Passes Column */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {group.max_passes} {group.max_passes === 1 ? 'pase' : 'pases'}
                          </span>
                        </td>

                        {/* Table Column */}
                        <td className="py-3 px-3">
                          <span className="text-purple-700 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-purple-500" /> {getGroupDetails(group).tableName}
                          </span>
                        </td>

                        {/* Phone Column with Inline Edit */}
                        <td className="py-3 px-3 font-mono">
                          {isEditingThisPhone ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingPhoneValue}
                                onChange={(e) => setEditingPhoneValue(e.target.value)}
                                placeholder="987654321"
                                disabled={isSavingPhone}
                                className="w-28 px-2 py-1 text-xs border border-emerald-500 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white font-mono"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSavePhone(group.id)}
                                disabled={isSavingPhone}
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition"
                                title="Guardar teléfono"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEditPhone}
                                disabled={isSavingPhone}
                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {hasPhone ? (
                                <span className="text-slate-700 font-semibold">{group.responsible_phone}</span>
                              ) : (
                                <span className="text-slate-400 italic">Sin teléfono</span>
                              )}
                              <button
                                onClick={() => handleStartEditPhone(group)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                                title="Editar número de teléfono"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isSent ? (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enviado: {sentTimeFormatted}
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3 text-amber-600" /> Pendiente
                            </span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasPhone ? (
                              <>
                                {!isSent ? (
                                  <button
                                    onClick={() => handleOpenWhatsApp(group.responsible_phone!, group)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                                    title="Enviar pase por WhatsApp"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Enviar</span>
                                  </button>
                                ) : (
                                  <>
                                    {/* Botón Reenviar */}
                                    <button
                                      onClick={() => handleResendWhatsApp(group.responsible_phone!, group)}
                                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition flex items-center gap-1"
                                      title="Reenviar mensaje por WhatsApp"
                                    >
                                      <RotateCcw className="w-3 h-3 text-amber-700" />
                                      <span>Reenviar</span>
                                    </button>

                                    {/* Botón Desmarcar / Volver a Pendiente */}
                                    <button
                                      onClick={() => handleDeleteSentLog(group.id, group.group_name)}
                                      className="p-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-500 border border-slate-200 hover:border-red-300 rounded-xl transition"
                                      title="Desmarcar y volver a poner como PENDIENTE"
                                    >
                                      <Undo2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}

                                {/* Copiar texto */}
                                <button
                                  onClick={() => handleCopyMessage(group)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                                  title="Copiar texto del mensaje"
                                >
                                  {copiedGroup === group.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleStartEditPhone(group)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" /> Agregar Teléfono
                              </button>
                            )}
                          </div>
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

      {/* MODAL 1: ¿CÓMO FUNCIONA EL DESPACHO ASISTIDO? */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  💬
                </div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  ¿Cómo funciona el Envío de WhatsApp?
                </h3>
              </div>
              <button
                onClick={() => setShowHowItWorksModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para garantizar que Meta (WhatsApp) nunca bloquee ni suspenda tu número por comportamiento de "bot", el sistema funciona con el protocolo oficial:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <div>
                  <strong className="text-emerald-950 font-bold block">1 Clic abre el chat directamente</strong>
                  <span className="text-emerald-800 text-[11px]">
                    Al presionar "Enviar", se abre WhatsApp con el contacto y el texto del pase QR precargado listo para mandar.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <div>
                  <strong className="text-indigo-950 font-bold block">Presiona ENTER (↵) en WhatsApp</strong>
                  <span className="text-indigo-800 text-[11px]">
                    Solo debes presionar la tecla Enter o el botón de enviar en WhatsApp para despachar el mensaje.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <div>
                  <strong className="text-amber-950 font-bold block">Pausa de Ritmo y Cero Riesgo de Baneo</strong>
                  <span className="text-amber-800 text-[11px]">
                    El sistema respeta una pausa de 30-40 segundos entre invitados. Así tu número se mantiene 100% seguro y activo.
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorksModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
            >
              Entendido, volver al despacho
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: CONSEJOS ANTI-BANEO PARA WEDDING PLANNERS */}
      {showAntiBanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Protocolos Anti-Baneo de WhatsApp (Meta)
                </h3>
              </div>
              <button
                onClick={() => setShowAntiBanModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-emerald-600" /> 1. Ritmo de Envío (30-60s)
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Evita enviar decenas de mensajes por segundo. Dejar 30-40 segundos entre mensajes simula uso humano legítimo.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                  <Coffee className="w-4 h-4 text-amber-600" /> 2. Descansos por Bloques
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Envía en bloques de 20 invitaciones y toma una pausa de 15 minutos antes de despachar el siguiente grupo.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                  <PhoneOff className="w-4 h-4 text-red-600" /> 3. No Usar Listas de Difusión
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Las listas de difusión no llegan a contactos que no te tienen guardado. El envío directo individual es 100% efectivo.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                  <FileText className="w-4 h-4 text-indigo-600" /> 4. Personalización del Mensaje
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Cada mensaje lleva el nombre de la familia y su mesa. La variación de texto evita los filtros de spam de Meta.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                  <HelpCircle className="w-4 h-4 text-purple-600" /> 5. Pregunta de Confirmación
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  La plantilla invita al invitado a responder ("¿Nos acompañan?"). Cuando el invitado responde, el chat se valida.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                  <Lock className="w-4 h-4 text-blue-600" /> 6. Primer Saludo Seguro
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Para números desconocidos, puedes usar el modo "Primer Saludo Seguro" sin enlace web previo.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAntiBanModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
            >
              Cerrar Guía
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: CANAL DE ENVÍO DIRECTO (SIN PANTALLA INTERMEDIA) */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Configuración del Canal de Envío
                </h3>
              </div>
              <button
                onClick={() => setShowChannelModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Elige cómo deseas que se abran las conversaciones de WhatsApp para omitir pantallas intermedias:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleChannelChange('web')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  dispatchChannel === 'web'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold block">WhatsApp Web Directo</span>
                    <span className="text-[11px] text-slate-500 font-normal">Abre directo la conversación en el navegador (Recomendado PC)</span>
                  </div>
                </div>
                {dispatchChannel === 'web' && <Check className="w-4 h-4 text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => handleChannelChange('desktop_app')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  dispatchChannel === 'desktop_app'
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-xs font-bold block">App Oficial de Escritorio</span>
                    <span className="text-[11px] text-slate-500 font-normal">Abre directamente la aplicación instalada en Windows/Mac</span>
                  </div>
                </div>
                {dispatchChannel === 'desktop_app' && <Check className="w-4 h-4 text-indigo-600" />}
              </button>

              <button
                type="button"
                onClick={() => handleChannelChange('wa_me')}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  dispatchChannel === 'wa_me'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold block">Enlace Universal (wa.me)</span>
                    <span className="text-[11px] text-slate-500 font-normal">Ideal para teléfonos móviles o tabletas</span>
                  </div>
                </div>
                {dispatchChannel === 'wa_me' && <Check className="w-4 h-4 text-amber-600" />}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reuseTab}
                  onChange={(e) => handleReuseTabChange(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium">Reutilizar la misma pestaña de WhatsApp Web (evita abrir 50 pestañas)</span>
              </label>
            </div>

            <button
              onClick={() => setShowChannelModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
            >
              Guardar y Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
