'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Camera, QrCode, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, 
  Users, MapPin, RefreshCw, ArrowLeft, Zap, Lock, Wifi, WifiOff, Download, CloudUpload, Home, LogOut,
  Search, Check, Sparkles, ChevronDown
} from 'lucide-react';
import { resolveQRToken, getOrCreateGroupQRToken, findTokenAndGroupForScannedInput, extractTokenFromInput } from '@/lib/qr-engine';
import { executeAtomicCheckIn, simulateConcurrentScans, CheckInExecutionResult } from '@/lib/checkin';
import { 
  downloadEventOfflineManifest, executeOfflineCheckIn, 
  syncOfflineQueueToServer, getPendingOfflineQueueCount 
} from '@/lib/offline-db';
import { getEventGuestGroups, getWorkspaceEvents, getEventById } from '@/lib/events';
import { getEventTableAssignments, getEventTables } from '@/lib/tables';
import { getActiveSession, getAccountForSession } from '@/lib/superadmin-store';
import { GuestGroup, Event } from '@/lib/supabase/types';

export default function MobileScanCheckInPage() {
  const session = getActiveSession();
  const account = getAccountForSession();
  const isOperator = session?.user?.role === 'OPERATOR';
  const currentWorkspaceId = session?.user?.workspaceId || account?.workspaceId || 'ws-a-1111';

  // Workspace Events
  const [workspaceEvents, setWorkspaceEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(session?.user?.eventId || '');

  useEffect(() => {
    const events = getWorkspaceEvents(currentWorkspaceId);
    
    // Operator Role restriction: limit event list strictly to assigned event if specified
    const operatorEventId = session?.user?.eventId;
    let filteredEvents = events;
    if (isOperator && operatorEventId && events.some(e => e.id === operatorEventId)) {
      filteredEvents = events.filter(e => e.id === operatorEventId);
    }
    setWorkspaceEvents(filteredEvents);
    
    // Check URL params for event or token
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlEvt = params.get('event');
      const urlToken = params.get('token');

      if (urlEvt && filteredEvents.some(e => e.id === urlEvt)) {
        setSelectedEventId(urlEvt);
      } else if (isOperator && operatorEventId && filteredEvents.some(e => e.id === operatorEventId)) {
        setSelectedEventId(operatorEventId);
      } else if (filteredEvents.length > 0) {
        setSelectedEventId(filteredEvents[0].id);
      }

      if (urlToken) {
        setScannedInput(urlToken);
      }
    }
  }, [currentWorkspaceId, isOperator, session?.user?.eventId]);

  const activeEvent = getEventById(selectedEventId, currentWorkspaceId);

  // Dynamic Event Data
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  const reloadEventData = () => {
    if (!selectedEventId) return;
    setGroups(getEventGuestGroups(selectedEventId));
    setAssignments(getEventTableAssignments(selectedEventId));
    setTables(getEventTables(selectedEventId));
  };

  useEffect(() => {
    reloadEventData();
  }, [selectedEventId]);

  // Network & Offline State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [manifestDownloaded, setManifestDownloaded] = useState<boolean>(false);

  // QR Scanning & Selection State
  const [scannedInput, setScannedInput] = useState<string>('');
  const [selectedTokenHash, setSelectedTokenHash] = useState<string>('');
  const [matchedGroup, setMatchedGroup] = useState<GuestGroup | null>(null);
  const [scanErrorMsg, setScanErrorMsg] = useState<string | null>(null);
  const [passesRequested, setPassesRequested] = useState<number>(1);
  const [resultModal, setResultModal] = useState<CheckInExecutionResult | null>(null);
  const [concurrencyResult, setConcurrencyResult] = useState<{ operatorA: CheckInExecutionResult; operatorB: CheckInExecutionResult } | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Camera scanner hook using @zxing/library
  useEffect(() => {
    if (!isCameraActive || !videoRef.current) return;
    let codeReader: any = null;

    import('@zxing/library')
      .then(({ BrowserMultiFormatReader }) => {
        codeReader = new BrowserMultiFormatReader();
        codeReader.decodeFromVideoDevice(null, videoRef.current, (result: any, err: any) => {
          if (result) {
            const scannedText = result.getText();
            setScannedInput(scannedText);
            processScannedCode(scannedText);
          }
        });
      })
      .catch((err) => {
        console.warn('Camera reader failed to load:', err);
      });

    return () => {
      if (codeReader) {
        try {
          codeReader.reset();
        } catch (e) {}
      }
    };
  }, [isCameraActive, selectedEventId, groups]);

  // Resolve Table Name for Matched Group
  let matchedTableName = 'Sin Mesa Asignada';
  if (matchedGroup) {
    const asgn = assignments.find(a => a.group_id === matchedGroup.id);
    if (asgn) {
      const tbl = tables.find(t => t.id === asgn.table_id);
      if (tbl) matchedTableName = tbl.name;
    }
  }

  // Instant QR Processing Engine
  const processScannedCode = (rawCode: string) => {
    if (!rawCode || !rawCode.trim()) {
      setMatchedGroup(null);
      setSelectedTokenHash('');
      setScanErrorMsg(null);
      return;
    }

    const res = findTokenAndGroupForScannedInput(rawCode, selectedEventId, currentWorkspaceId, groups);

    if (res.valid && res.token && res.group) {
      setSelectedTokenHash(res.token.token_hash);
      setMatchedGroup(res.group);
      setScanErrorMsg(null);
      
      // Auto-set passes requested to remaining available or 1
      const available = Math.max(1, (res.group.max_passes || 1) - (res.group.checked_in_count || 0));
      setPassesRequested(Math.min(1, available));
      setResultModal(null);
    } else {
      setSelectedTokenHash('');
      setMatchedGroup(null);
      if (res.reason === 'REJECTED_DIFFERENT_EVENT') {
        const otherEvt = res.otherEventId ? getEventById(res.otherEventId, currentWorkspaceId) : null;
        const otherEvtName = otherEvt ? `"${otherEvt.name}"` : 'otro evento';
        setScanErrorMsg(`✕ CÓDIGO PERTENECE A OTRO EVENTO: Este pase es para ${otherEvtName}. No tiene acceso a este evento.`);
      } else if (res.reason === 'REJECTED_REVOKED') {
        setScanErrorMsg('✕ CÓDIGO QR REVOCADO: Este pase fue invalidado por el administrador.');
      } else {
        setScanErrorMsg('✕ CÓDIGO QR INVÁLIDO: No existe en la lista de invitados de este evento.');
      }
    }
  };

  const checkPendingQueue = async () => {
    try {
      const count = await getPendingOfflineQueueCount(selectedEventId);
      setPendingSyncCount(count);
    } catch (e) {}
  };

  useEffect(() => {
    checkPendingQueue();
  }, [selectedEventId]);

  const handleDownloadManifest = async () => {
    await downloadEventOfflineManifest(selectedEventId, currentWorkspaceId);
    setManifestDownloaded(true);
    alert(`¡Manifiesto de "${activeEvent?.name || 'Evento'}" guardado en IndexedDB! El escáner funcionará en puerta incluso sin internet.`);
  };

  const handleSyncQueue = async () => {
    setSyncStatusMsg('Sincronizando registros offline con el servidor...');
    const res = await syncOfflineQueueToServer(selectedEventId);
    await checkPendingQueue();
    reloadEventData();

    if (res.conflictCount > 0) {
      setSyncStatusMsg(`Sincronización completada: ${res.syncedCount} exitosos, ${res.conflictCount} conflictos de sobrecupo aislados.`);
    } else {
      setSyncStatusMsg(`¡Éxito! ${res.syncedCount} registros sincronizados atómicamente.`);
    }
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  const handleManualSelectGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      const token = getOrCreateGroupQRToken(groupId, selectedEventId, currentWorkspaceId);
      setSelectedTokenHash(token.token_hash);
      setMatchedGroup(group);
      setScannedInput(token.token_hash);
      setScanErrorMsg(null);
      setPassesRequested(1);
      setResultModal(null);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedTokenHash || !matchedGroup) {
      alert('Por favor escanea o ingresa un código QR válido primero.');
      return;
    }

    let res: CheckInExecutionResult;

    if (isOnline) {
      res = executeAtomicCheckIn(selectedTokenHash, passesRequested, 'operador-seguridad-01', selectedEventId);
    } else {
      res = await executeOfflineCheckIn(selectedTokenHash, passesRequested, 'operador-seguridad-01', selectedEventId);
      await checkPendingQueue();
    }

    setResultModal(res);
    reloadEventData();

    // Update matched group in memory
    const updatedGroups = getEventGuestGroups(selectedEventId);
    const reGroup = updatedGroups.find(g => g.id === matchedGroup.id);
    if (reGroup) {
      setMatchedGroup(reGroup);
    }
  };

  const handleSimulateConcurrency = () => {
    if (!selectedTokenHash) return;
    const res = simulateConcurrentScans(selectedTokenHash, 3, 3);
    setConcurrencyResult(res);
    reloadEventData();
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white p-4 max-w-md mx-auto flex flex-col justify-between selection:bg-[#C5A059] selection:text-white">
      {/* Top Header Mobile */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
          {isOperator ? (
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#C5A059]/40 shrink-0">
                <Image src="/logo-eventcontrol.jpg" alt="Logo" fill className="object-cover" />
              </div>
              <div>
                <span className="text-xs font-serif font-bold text-white tracking-wide block">
                  EventControl <span className="text-[#C5A059]">Escáner</span>
                </span>
                <span className="text-[9px] text-emerald-400 font-bold block">PUERTA Y ACCESO</span>
              </div>
            </div>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#C5A059]/40">
                <Image src="/logo-eventcontrol.jpg" alt="Logo" fill className="object-cover" />
              </div>
              <span className="text-xs text-slate-300 font-bold hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            {isOperator && (
              <>
                <Link 
                  href="/" 
                  className="text-[11px] text-slate-300 font-bold hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 transition flex items-center gap-1"
                  title="Página Principal Web"
                >
                  <Home className="w-3 h-3 text-[#C5A059]" /> Inicio
                </Link>
                <Link 
                  href="/login" 
                  className="text-[11px] text-red-400 font-bold hover:text-red-300 px-2.5 py-1 bg-red-950/60 rounded-lg border border-red-800/60 transition flex items-center gap-1"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3 h-3" /> Salir
                </Link>
              </>
            )}

            {/* Network Mode Toggle */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition border ${
                isOnline 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </button>
          </div>
        </div>

        {/* Dynamic Event Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1">
          <label className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
            🍷 EVENTO ACTIVO DE CONTROL:
          </label>
          {workspaceEvents.length > 0 ? (
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setScannedInput('');
                setMatchedGroup(null);
                setSelectedTokenHash('');
                setScanErrorMsg(null);
              }}
              className="w-full bg-slate-950 border border-slate-700 text-white text-xs py-2 px-3 rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-bold"
            >
              {workspaceEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name} ({evt.event_date || 'Sin fecha'})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-slate-400 font-semibold">{activeEvent?.name || 'Cargando evento...'}</div>
          )}
        </div>

        {/* Sync Status Banner */}
        {syncStatusMsg && (
          <div className="p-3 bg-amber-950 border border-amber-800 text-amber-200 text-xs rounded-xl text-center font-medium">
            {syncStatusMsg}
          </div>
        )}

        {/* Offline Controls Bar */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={handleDownloadManifest}
            className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition flex items-center justify-center gap-1 font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A059]" /> {manifestDownloaded ? 'Caché Actualizado' : 'Descargar Manifiesto Offline'}
          </button>

          {pendingSyncCount > 0 && (
            <button
              onClick={handleSyncQueue}
              className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1 animate-pulse"
            >
              <CloudUpload className="w-3.5 h-3.5" /> Sincronizar ({pendingSyncCount})
            </button>
          )}
        </div>

        {/* INSTANT SCANNER / CAM CAMERA VISOR */}
        <div className="bg-slate-900 border-2 border-[#C5A059]/60 rounded-2xl p-5 text-center space-y-3 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#C5A059]" /> Escáner de Puerta en Vivo
            </span>
            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`px-3 py-1 text-xs font-bold rounded-xl border transition flex items-center gap-1 ${
                isCameraActive 
                  ? 'bg-red-950 text-red-400 border-red-800' 
                  : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              {isCameraActive ? 'Detener Cámara' : 'Activar Cámara'}
            </button>
          </div>

          {/* Real Camera Feed or Visual Scanner Frame */}
          {isCameraActive ? (
            <div className="relative rounded-xl overflow-hidden bg-black border border-slate-700 h-48 flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-[#C5A059] rounded-xl pointer-events-none animate-pulse"></div>
              <div className="absolute text-[10px] bg-black/70 text-emerald-400 px-2 py-0.5 rounded-full bottom-2 font-mono">
                Buscando QR continuamente...
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="w-12 h-12 bg-[#C5A059]/20 rounded-full flex items-center justify-center mx-auto text-[#C5A059] border border-[#C5A059]/40">
                <QrCode className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400">
                Apunta la cámara o escribe/pega el código QR abajo. Se identificará automáticamente.
              </p>
            </div>
          )}

          {/* Direct Scanner Token Input Box */}
          <div className="space-y-1 text-left pt-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ⚡ Código QR Escaneado / Token:
            </label>
            <div className="relative">
              <input
                type="text"
                value={scannedInput}
                onChange={(e) => {
                  setScannedInput(e.target.value);
                  processScannedCode(e.target.value);
                }}
                placeholder="Escanea o pega el token QR aquí..."
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs py-2.5 pl-3 pr-9 rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-mono"
              />
              {scannedInput && (
                <button
                  onClick={() => {
                    setScannedInput('');
                    setMatchedGroup(null);
                    setSelectedTokenHash('');
                    setScanErrorMsg(null);
                  }}
                  className="absolute right-2 top-2.5 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Scan Error Message */}
          {scanErrorMsg && (
            <div className="p-2.5 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs font-semibold text-center animate-bounce">
              {scanErrorMsg}
            </div>
          )}
        </div>

        {/* MATCHED GUEST GROUP CARD (AUTO POPULATED FROM QR) */}
        {matchedGroup ? (
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> QR Identificado y Contrastado
                </span>
                <h3 className="text-lg font-bold text-white font-serif">{matchedGroup.group_name}</h3>
                {matchedGroup.responsible_phone && (
                  <p className="text-xs text-slate-400">Teléfono: {matchedGroup.responsible_phone}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                matchedGroup.status === 'COMPLETO' ? 'bg-red-950 text-red-400 border border-red-800' :
                matchedGroup.status === 'PARCIAL' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {matchedGroup.status}
              </span>
            </div>

            {/* Table & Pass Balance Details */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Mesa Asignada</span>
                <strong className="text-sm font-bold text-purple-400 flex items-center justify-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {matchedTableName}
                </strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Pases Ingresados</span>
                <strong className="text-sm font-bold text-emerald-400 mt-0.5 block">
                  {matchedGroup.checked_in_count || 0} / {matchedGroup.max_passes}
                </strong>
              </div>
            </div>

            {/* Quantity Touch Selectors */}
            {matchedGroup.status !== 'COMPLETO' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 text-center uppercase tracking-wider">
                  ¿Cuántas personas ingresan ahora?
                </label>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const available = matchedGroup.max_passes - (matchedGroup.checked_in_count || 0);
                    const disabled = num > available;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={disabled}
                        onClick={() => setPassesRequested(num)}
                        className={`py-3 text-base font-extrabold rounded-xl transition border ${
                          disabled
                            ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                            : passesRequested === num
                            ? 'bg-[#C5A059] border-[#C5A059] text-slate-950 shadow-lg scale-105'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleConfirmCheckIn}
                  className="w-full py-4 gold-button font-extrabold text-base rounded-2xl transition shadow-xl flex items-center justify-center gap-2 mt-4"
                >
                  <CheckCircle2 className="w-6 h-6" /> CONFIRMAR INGRESO ({passesRequested} PASES)
                </button>
              </div>
            ) : (
              <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-center space-y-1">
                <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="text-sm font-bold text-red-300 font-serif">GRUPO COMPLETO</h4>
                <p className="text-xs text-red-400">Todos los pases autorizados para esta lista han ingresado previamente.</p>
              </div>
            )}

            {/* Test Concurrency Button */}
            <div className="pt-2">
              <button
                onClick={handleSimulateConcurrency}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Simular 2 Operadores Simultáneos (Caso 5)
              </button>
            </div>
          </div>
        ) : (
          /* BACKUP / FALLBACK MANUAL SELECTOR */
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                ¿Problema al leer el QR con la cámara?
              </span>
              <p className="text-[11px] text-slate-500">
                Selecciona manualmente de la lista de invitados cargada ({groups.length} pases registrados):
              </p>
            </div>

            <select
              value=""
              onChange={(e) => handleManualSelectGroup(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white text-xs py-2.5 px-3 rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-semibold"
            >
              <option value="" disabled>-- Seleccionar invitado manualmente por nombre --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.group_name} ({g.checked_in_count || 0}/{g.max_passes} pases - {g.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* RESULT MODAL POPUP */}
      {resultModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`max-w-xs w-full p-6 rounded-3xl border shadow-2xl text-center space-y-4 ${
            resultModal.success 
              ? 'bg-slate-900 border-emerald-500/80 text-white' 
              : 'bg-slate-900 border-red-500/80 text-white'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold ${
              resultModal.success ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500' : 'bg-red-600/20 text-red-400 border border-red-500'
            }`}>
              {resultModal.success ? '✓' : '✕'}
            </div>

            <div>
              <h3 className={`text-xl font-extrabold font-serif ${resultModal.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {resultModal.success ? 'INGRESO AUTORIZADO' : 'INGRESO RECHAZADO'}
              </h3>
              <p className="text-xs text-slate-300 mt-1 font-medium">{resultModal.message}</p>
            </div>

            {resultModal.groupName && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Grupo:</span>
                  <strong className="text-white">{resultModal.groupName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mesa:</span>
                  <strong className="text-purple-400">{resultModal.tableName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Acumulado:</span>
                  <strong className="text-emerald-400">{resultModal.passesAccumulated} / {resultModal.maxPasses}</strong>
                </div>
              </div>
            )}

            <button
              onClick={() => setResultModal(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition border border-slate-700"
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}

      {/* CONCURRENCY SIMULATION MODAL POPUP (Caso 5) */}
      {concurrencyResult && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-sm w-full bg-slate-900 border border-amber-500/80 rounded-3xl p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <Zap className="w-5 h-5" /> Resultado de Concurrencia Simultánea (Caso 5)
            </div>
            <p className="text-xs text-slate-400">
              Dos operadores en puertas distintas enviaron un registro de 3 personas al mismo milisegundo:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-emerald-800">
                <strong className="text-emerald-400 font-bold block mb-1">Operador A (Puerta 1):</strong>
                <span>{concurrencyResult.operatorA.message}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-red-800">
                <strong className="text-red-400 font-bold block mb-1">Operador B (Puerta 2):</strong>
                <span>{concurrencyResult.operatorB.message}</span>
              </div>
            </div>

            <button
              onClick={() => setConcurrencyResult(null)}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <footer className="text-center text-[10px] text-slate-500 pt-4">
        EventControl Security PWA Module • Dexie.js Offline Cache
      </footer>
    </div>
  );
}
