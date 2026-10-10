'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  UtensilsCrossed,
  Ticket,
  Users,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { generateDeterministicTokenString } from '@/lib/qr-engine';

interface PassData {
  event: {
    id: string;
    name: string;
    event_type: string;
    event_date: string;
    event_time: string;
    venue_name: string;
  };
  group: {
    id: string;
    group_name: string;
    responsible_phone: string;
    max_passes: number;
    checked_in_count: number;
    status: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO';
    companions?: Array<{
      id: string;
      name: string;
      isApproved: boolean;
      checkedIn?: boolean;
    }>;
  };
  tableName: string;
  tableCapacity?: number | null;
  token: string;
}

function GuestPassContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const eventIdParam = searchParams.get('event') || searchParams.get('eventId') || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passData, setPassData] = useState<PassData | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const qrRef = useRef<HTMLDivElement>(null);

  const fetchPassDetails = async (isManualRefresh = false) => {
    if (!token) {
      setErrorMsg('No se proporcionó ningún token o pase digital en el enlace.');
      setLoading(false);
      return;
    }

    if (isManualRefresh) setIsRefreshing(true);

    try {
      // 1. Primary: Fetch from public /api/pass endpoint
      const queryParams = new URLSearchParams({ token });
      if (eventIdParam) queryParams.set('event', eventIdParam);

      const res = await fetch(`/api/pass?${queryParams.toString()}`, { cache: 'no-store' });
      const data = await res.json();

      if (res.ok && data.success) {
        setPassData(data);
        setErrorMsg(null);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      // 2. Secondary Contingency: LocalStorage (if viewed by host or cached on device)
      if (typeof window !== 'undefined') {
        try {
          const rawGroupsStore = localStorage.getItem('eventcontrol_groups_v1');
          const rawEventsStore = localStorage.getItem('eventcontrol_events_v1');
          const rawTablesStore = localStorage.getItem('eventcontrol_tables_v1');
          const rawAsgnsStore = localStorage.getItem('eventcontrol_table_assignments_v1');

          if (rawGroupsStore && rawEventsStore) {
            const allGroups: Record<string, any[]> = JSON.parse(rawGroupsStore);
            const allEvents: any[] = JSON.parse(rawEventsStore);
            const allTables: Record<string, any[]> = rawTablesStore ? JSON.parse(rawTablesStore) : {};
            const allAsgns: Record<string, any[]> = rawAsgnsStore ? JSON.parse(rawAsgnsStore) : {};

            let foundGroup: any = null;
            let foundEventId: string = eventIdParam;

            for (const [evtId, gList] of Object.entries(allGroups)) {
              if (Array.isArray(gList)) {
                const tokenClean = token.trim().toLowerCase();
                const match = gList.find((g) => 
                  g.id === token || 
                  generateDeterministicTokenString(g.id) === token ||
                  (g.external_id && g.external_id.toLowerCase().trim() === tokenClean) ||
                  (g.group_name && g.group_name.toLowerCase().trim() === tokenClean) ||
                  (g.responsible_phone && token.replace(/\D/g, '') && g.responsible_phone.replace(/\D/g, '') === token.replace(/\D/g, ''))
                );
                if (match) {
                  foundGroup = match;
                  foundEventId = evtId;
                  break;
                }
              }
            }

            if (foundGroup) {
              const matchedEvent = allEvents.find((e) => e.id === foundEventId) || {
                id: foundEventId,
                name: 'Evento Oficial',
                event_type: 'Evento Social',
                event_date: new Date().toISOString().split('T')[0],
                event_time: '19:00',
                venue_name: 'Salón Principal',
              };

              let tableName = 'Sin Mesa Asignada';
              if (allAsgns[foundEventId] && allTables[foundEventId]) {
                const asgn = allAsgns[foundEventId].find((a: any) => a.group_id === foundGroup.id);
                if (asgn) {
                  const tbl = allTables[foundEventId].find((t: any) => t.id === asgn.table_id);
                  if (tbl) tableName = tbl.name;
                }
              }

              setPassData({
                event: {
                  id: matchedEvent.id,
                  name: matchedEvent.name,
                  event_type: matchedEvent.event_type || 'Evento',
                  event_date: matchedEvent.event_date,
                  event_time: matchedEvent.event_time || '',
                  venue_name: matchedEvent.venue_name || 'Salón Principal',
                },
                group: {
                  id: foundGroup.id,
                  group_name: foundGroup.group_name,
                  responsible_phone: foundGroup.responsible_phone || '',
                  max_passes: foundGroup.max_passes,
                  checked_in_count: foundGroup.checked_in_count || 0,
                  status: foundGroup.status || 'PENDIENTE',
                  companions: foundGroup.companions || [],
                },
                tableName,
                token,
              });
              setErrorMsg(null);
              setLoading(false);
              setIsRefreshing(false);
              return;
            }
          }
        } catch (localErr) {}
      }

      setErrorMsg(data.message || 'No se pudo encontrar la invitación asociada a este código.');
    } catch (err) {
      setErrorMsg('Ocurrió un error al cargar el pase. Por favor verifique su conexión e intente nuevamente.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPassDetails();
  }, [token, eventIdParam]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 50, 50, 900, 900);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `Pase-QR-${passData?.group.group_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Invitado'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const qrTargetUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/pass?token=${token}${passData?.event.id ? `&event=${passData.event.id}` : ''}`
      : `https://eventcontrol-pe.vercel.app/pass?token=${token}`;

  // Format Spanish date
  const formatFriendlyDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        const months = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]} de ${year}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-[#C5A059]/30 border-t-[#C5A059] animate-spin" />
          <Sparkles className="w-6 h-6 text-[#C5A059] absolute inset-0 m-auto" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide mb-1">Cargando tu Pase Digital VIP...</h2>
        <p className="text-slate-400 text-sm">Verificando invitación en EventControl</p>
      </div>
    );
  }

  if (errorMsg || !passData) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">Invitación no encontrada</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {errorMsg || 'El enlace que abrió no corresponde a un pase activo o el código es inválido.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => fetchPassDetails(true)}
              className="w-full py-3 bg-[#C5A059] hover:bg-[#B38F46] text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#C5A059]/20"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Reintentar Carga
            </button>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
              💡 <strong>Nota para el invitado:</strong> Tu pase de acceso es 100% libre y no requiere crear ninguna cuenta ni iniciar sesión. Si el código no carga, por favor solicita a los anfitriones del evento que te reenvíen tu enlace de pase digital.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { event, group, tableName } = passData;
  const isComplete = group.checked_in_count >= group.max_passes;
  const isPartial = group.checked_in_count > 0 && !isComplete;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center py-8 px-4 sm:px-6">
      {/* Brand Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#996515] flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] uppercase block">
              EventControl
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">Pase Digital Oficial</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
                Público • Sin cuenta
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchPassDetails(true)}
          title="Actualizar estado del pase"
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* Main Luxury VIP Pass Ticket */}
      <main className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-[#D4AF37]/30 rounded-3xl shadow-2xl overflow-hidden relative backdrop-blur-xl">
        {/* Golden top decorative banner */}
        <div className="h-2 w-full bg-gradient-to-r from-[#AA771C] via-[#F3E5AB] to-[#AA771C]" />

        {/* Event Header */}
        <div className="p-6 text-center border-b border-slate-800 relative bg-slate-900/60">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#F3E5AB] border border-[#D4AF37]/30 text-[11px] font-extrabold uppercase tracking-wider mb-3">
            <Ticket className="w-3 h-3 text-[#D4AF37]" /> Pase Digital VIP de Ingreso
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 leading-tight">
            {event.name}
          </h1>

          <p className="text-xs font-medium text-[#D4AF37] tracking-wider uppercase mb-4">
            {event.event_type}
          </p>

          {/* Event Quick Details Badges */}
          <div className="grid grid-cols-2 gap-2 text-left bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Fecha</span>
                <span className="text-xs font-bold text-slate-200">
                  {formatFriendlyDate(event.event_date)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Hora de Recepción</span>
                <span className="text-xs font-bold text-slate-200">
                  {event.event_time || 'Por confirmar'}
                </span>
              </div>
            </div>

            {event.venue_name && (
              <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-slate-900">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block font-medium">Lugar / Salón</span>
                  <span className="text-xs font-bold text-slate-200 truncate block">
                    {event.venue_name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guest VIP Pass Body */}
        <div className="p-6 space-y-6">
          {/* Guest Identity & Table Information */}
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Invitado de Honor / Familia
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {group.group_name}
            </h2>

            {/* Badges: Passes & Table */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white shadow-sm">
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{group.max_passes} Pases Autorizados</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#996515]/20 border border-[#D4AF37]/40 text-xs font-extrabold text-[#F3E5AB] shadow-sm">
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{tableName}</span>
              </div>
            </div>

            {/* Attendance Status Badge */}
            <div className="pt-2">
              {isComplete ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ingreso Registrado Completo ({group.checked_in_count}/{group.max_passes})
                </span>
              ) : isPartial ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" /> Ingreso Parcial Registrado ({group.checked_in_count}/{group.max_passes})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Pase Válido • Pendiente de Ingreso
                </span>
              )}
            </div>
          </div>

          {/* High-Contrast Luxury QR Card */}
          <div className="flex flex-col items-center justify-center">
            <div
              ref={qrRef}
              className="p-4 sm:p-5 bg-white rounded-3xl shadow-2xl border-4 border-[#D4AF37]/60 inline-block transition-transform hover:scale-[1.02]"
            >
              <QRCodeSVG
                value={qrTargetUrl}
                size={220}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: '',
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3 max-w-xs leading-relaxed">
              Muestra este código QR en la entrada del salón al personal de recepción para validar tu acceso al instante.
            </p>
          </div>

          {/* Companions Breakdown (if any) */}
          {group.companions && group.companions.length > 0 && (
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#D4AF37]" /> Integrantes Autorizados
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {1 + group.companions.filter((c) => c.isApproved).length} de {group.max_passes} confirmados
                </span>
              </div>

              <div className="divide-y divide-slate-800/60 text-xs">
                {/* Main guest */}
                <div className="py-1.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    {group.group_name} (Titular)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Autorizado
                  </span>
                </div>

                {/* Companions */}
                {group.companions.map((comp, idx) => (
                  <div key={comp.id || idx} className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-300 truncate flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${comp.isApproved ? 'text-emerald-400' : 'text-slate-500'}`}
                      />
                      {comp.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        comp.isApproved
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {comp.isApproved ? 'Autorizado' : 'Por confirmar'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons for Guest */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleDownloadQR}
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA771C] hover:from-[#E5C158] hover:to-[#B38F46] text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-[#D4AF37]/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" /> Guardar / Descargar Pase QR
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs rounded-2xl border border-slate-700/60 transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              {isCopied ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace de mi pase'}
            </button>

            {event.venue_name && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue_name} ${event.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2.5 text-xs font-semibold text-slate-400 hover:text-[#D4AF37] transition flex items-center justify-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" /> ¿Cómo llegar al salón? Ver en Google Maps
                <ChevronRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Footer info note */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
          Código de Seguridad Token:{' '}
          <span className="font-mono text-slate-400">{token.substring(0, 16)}...</span>
          <div className="mt-1 font-medium text-slate-600">
            Powered by EventControl • Protocolo de Acceso VIP Inteligente
          </div>
        </div>
      </main>

      {/* Security notice bottom */}
      <div className="w-full max-w-md text-center mt-6 text-[11px] text-slate-500 space-y-1">
        <p className="text-slate-400 font-medium">✨ Acceso oficial público • No necesitas crear cuenta ni iniciar sesión.</p>
        <p>Este pase es personal para el grupo registrado. Por favor, presente este código directamente en su pantalla al momento de ingresar.</p>
      </div>
    </div>
  );
}

export default function GuestPassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
          <div className="w-10 h-10 rounded-full border-4 border-[#C5A059]/30 border-t-[#C5A059] animate-spin" />
        </div>
      }
    >
      <GuestPassContent />
    </Suspense>
  );
}
