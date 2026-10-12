'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Camera, QrCode, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, 
  Users, MapPin, RefreshCw, ArrowLeft, Zap, Lock, Wifi, WifiOff, Download, CloudUpload, Home, LogOut,
  Search, Check, Sparkles, ChevronDown, X, User
} from 'lucide-react';
import { PLAN_LIMITS } from '@/lib/plans';
import { resolveQRToken, getOrCreateGroupQRToken, findTokenAndGroupForScannedInput, extractTokenFromInput } from '@/lib/qr-engine';
import { executeAtomicCheckIn, executeAtomicCheckInAsync, simulateConcurrentScans, CheckInExecutionResult } from '@/lib/checkin';
import { 
  downloadEventOfflineManifest, executeOfflineCheckIn, 
  syncOfflineQueueToServer, getPendingOfflineQueueCount 
} from '@/lib/offline-db';
import { 
  getEventGuestGroups, getWorkspaceEvents, getEventById,
  getWorkspaceEventsAsync, getEventByIdAsync, getEventGuestGroupsAsync,
  getLastActiveEventId, setLastActiveEventId
} from '@/lib/events';
import { 
  getEventTableAssignments, getEventTables,
  getEventTableAssignmentsAsync, getEventTablesAsync 
} from '@/lib/tables';
import { getActiveSession, setActiveSession, getAccountForSession } from '@/lib/superadmin-store';
import { GuestGroup, Event } from '@/lib/supabase/types';
import { checkInRealtimeChannel } from '@/lib/realtime';

export default function MobileScanCheckInPage() {
  const session = getActiveSession();
  const account = getAccountForSession();
  const isOperator = session?.user?.role === 'OPERATOR';
  const currentWorkspaceId = session?.user?.workspaceId || account?.workspaceId || 'ws-a-1111';

  // Workspace Events
  const [workspaceEvents, setWorkspaceEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(session?.user?.eventId || '');

  useEffect(() => {
    let isMounted = true;

    async function loadEventsAsync() {
      const activeSession = getActiveSession();
      if (!activeSession) {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const urlToken = params.get('token');
          const urlEvt = params.get('event') || params.get('eventId');
          if (urlToken) {
            window.location.href = `/pass?token=${encodeURIComponent(urlToken)}${urlEvt ? `&event=${encodeURIComponent(urlEvt)}` : ''}`;
            return;
          }
          window.location.href = '/login';
        }
        return;
      }

      const operatorEventId = activeSession?.user?.eventId;

      // Strict Event Isolation: If operator or collaborator is assigned to a specific event, isolate completely
      if (operatorEventId) {
        let opEvt = await getEventByIdAsync(operatorEventId, currentWorkspaceId);
        if (!opEvt) {
          const allEvts = await getWorkspaceEventsAsync(currentWorkspaceId);
          opEvt = allEvts.find(e => e.id === operatorEventId) || undefined;
        }
        if (!isMounted) return;
        setWorkspaceEvents(opEvt ? [opEvt] : []);
        setSelectedEventId(operatorEventId);
        return;
      }

      let events: Event[] = await getWorkspaceEventsAsync(currentWorkspaceId);

      if (!isMounted) return;
      setWorkspaceEvents(events);

      // Pre-select priority event: 1) URL event/eventId param, 2) Last remembered active event, 3) first available event
      let targetId = selectedEventId;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlEvt = params.get('event') || params.get('eventId');
        const urlToken = params.get('token');

        if (urlEvt && events.some(e => e.id === urlEvt)) {
          targetId = urlEvt;
        }
        if (urlToken) {
          setScannedInput(urlToken);
          try {
            const cleanUrl = window.location.pathname + (urlEvt ? `?event=${encodeURIComponent(urlEvt)}` : '');
            window.history.replaceState({}, '', cleanUrl);
          } catch (e) {}
        }
      }

      if (!targetId || !events.some(e => e.id === targetId)) {
        const rememberedId = getLastActiveEventId(currentWorkspaceId);
        if (rememberedId && events.some(e => e.id === rememberedId)) {
          targetId = rememberedId;
        } else if (events.length > 0) {
          targetId = events[0].id;
        }
      }

      if (targetId) {
        setSelectedEventId(targetId);
        setLastActiveEventId(targetId, currentWorkspaceId);
      }
    }

    loadEventsAsync();

    return () => {
      isMounted = false;
    };
  }, [currentWorkspaceId, isOperator, session?.user?.eventId]);

  const activeEvent = getEventById(selectedEventId, currentWorkspaceId) || workspaceEvents.find(e => e.id === selectedEventId);

  // Dynamic Event Data
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isRefreshingList, setIsRefreshingList] = useState<boolean>(false);

  // Live Pass Attendance Grid State
  const [gridFilterTab, setGridFilterTab] = useState<'ALL' | 'PARTIAL' | 'COMPLETE' | 'PENDING'>('ALL');
  const [gridSearchTerm, setGridSearchTerm] = useState<string>('');

  const reloadEventData = async () => {
    if (!selectedEventId) return;
    setIsRefreshingList(true);
    const updatedEvt = await getEventByIdAsync(selectedEventId, currentWorkspaceId);
    if (updatedEvt) {
      setWorkspaceEvents(prev => {
        const idx = prev.findIndex(e => e.id === updatedEvt.id);
        if (idx !== -1) {
          const clone = [...prev];
          clone[idx] = updatedEvt;
          return clone;
        }
        return [updatedEvt, ...prev];
      });
    }
    const guestList = await getEventGuestGroupsAsync(selectedEventId);
    const tablesList = await getEventTablesAsync(selectedEventId);
    const assignmentsList = await getEventTableAssignmentsAsync(selectedEventId);

    if (guestList.length > 0 || groups.length === 0) {
      setGroups(guestList);
      setMatchedGroup(prev => {
        if (!prev) return null;
        const fresh = guestList.find(g => g.id === prev.id);
        return fresh || prev;
      });
    }
    if (tablesList.length > 0 || tables.length === 0) {
      setTables(tablesList);
    }
    if (assignmentsList.length > 0 || assignments.length === 0) {
      setAssignments(assignmentsList);
    }
    setIsRefreshingList(false);
  };

  useEffect(() => {
    reloadEventData();

    // Subscribe to instant BroadcastChannel notifications for 0ms cross-tab sync
    const unsubscribe = checkInRealtimeChannel.subscribe((data) => {
      reloadEventData();
    });

    // Auto-sync polling every 5s to catch online sync from other doors or PC
    const timer = setInterval(() => {
      if (selectedEventId) {
        getEventByIdAsync(selectedEventId, currentWorkspaceId).then(evt => {
          if (evt) {
            setWorkspaceEvents(prev => {
              const idx = prev.findIndex(e => e.id === evt.id);
              if (idx !== -1) {
                const clone = [...prev];
                clone[idx] = evt;
                return clone;
              }
              return [evt, ...prev];
            });
          }
        });
        getEventGuestGroupsAsync(selectedEventId).then(list => {
          if (list && list.length > 0) {
            setGroups(list);
            setMatchedGroup(prev => {
              if (!prev) return null;
              const fresh = list.find(g => g.id === prev.id);
              return fresh || prev;
            });
          }
        });
        getEventTablesAsync(selectedEventId).then(tList => {
          if (tList && tList.length > 0) setTables(tList);
        });
        getEventTableAssignmentsAsync(selectedEventId).then(aList => {
          if (aList && aList.length > 0) setAssignments(aList);
        });
      }
    }, 5000);

    return () => {
      clearInterval(timer);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [selectedEventId, currentWorkspaceId]);

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

  // Operator Profile Modal State
  const [showOperatorProfileModal, setShowOperatorProfileModal] = useState<boolean>(false);

  // Google-style Predictive Guest Search for Manual Selector
  const [manualSearchQuery, setManualSearchQuery] = useState<string>('');
  const [isManualSearchFocused, setIsManualSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsManualSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            processScannedCode(scannedText, true);
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
    const currentAsgns = assignments.length > 0 ? assignments : getEventTableAssignments(selectedEventId);
    const currentTbls = tables.length > 0 ? tables : getEventTables(selectedEventId);
    const groupAsgns = currentAsgns.filter(a => a.group_id === matchedGroup.id);
    if (groupAsgns.length > 0) {
      const details = groupAsgns.map(asgn => {
        const tbl = currentTbls.find(t => t.id === asgn.table_id);
        const tableName = tbl?.name || 'Mesa';
        return asgn.guest_name_label ? `${tableName} (${asgn.guest_name_label})` : tableName;
      });
      matchedTableName = Array.from(new Set(details)).join(' • ');
    }
  }

  const handleToggleCamera = () => {
    if (!isCameraActive) {
      // Clean previous scan state when opening camera for a NEW scan
      setScannedInput('');
      setSelectedTokenHash('');
      setMatchedGroup(null);
      setScanErrorMsg(null);
      setIsCameraActive(true);
    } else {
      // Stop camera stream cleanly preserving scanned result
      setIsCameraActive(false);
    }
  };

  const handleCloseResultModal = () => {
    setResultModal(null);
    setScannedInput('');
    setSelectedTokenHash('');
    setMatchedGroup(null);
    setScanErrorMsg(null);
  };

  // Instant QR Processing Engine
  const processScannedCode = (rawCode: string, isFromCamera = false) => {
    if (!rawCode || !rawCode.trim()) {
      if (!isFromCamera) {
        setMatchedGroup(null);
        setSelectedTokenHash('');
        setScanErrorMsg(null);
      }
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

      // Lock scanned pass and stop camera on valid scan to lock guest pass and prevent infinite loop/flicker
      if (isFromCamera) {
        setIsCameraActive(false);
      }
    } else {
      // Motion blur / frame loss protection: if camera scan read invalid text while a valid group is ALREADY matched, do not wipe it
      if (isFromCamera && matchedGroup) {
        return;
      }

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
      if (isFromCamera) {
        setIsCameraActive(false);
      }
    }
  };

  useEffect(() => {
    if (scannedInput && groups.length > 0 && !matchedGroup) {
      processScannedCode(scannedInput);
    }
  }, [groups, scannedInput]);

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

  // Contingency Security Policy: Manual selection without QR requires Wedding Planner PIN for Operators
  const [isManualAuthorized, setIsManualAuthorized] = useState<boolean>(!isOperator);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pendingManualGroupId, setPendingManualGroupId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const selectGroupDirectly = (groupId: string) => {
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

  const handleManualSelectGroup = (groupId: string) => {
    // If free manual checkin is enabled by Wedding Planner or user is not Operator, bypass PIN check
    const isFreeAllowed = !!activeEvent?.allow_free_manual_checkin;
    if (isOperator && !isManualAuthorized && !isFreeAllowed) {
      setPendingManualGroupId(groupId);
      setPinInput('');
      setPinError(null);
      setShowPinModal(true);
      return;
    }

    selectGroupDirectly(groupId);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();

    // Query fresh event from central online server DB in real-time
    const freshEvt = await getEventByIdAsync(selectedEventId, currentWorkspaceId);
    const expectedPin = (freshEvt?.contingency_pin || activeEvent?.contingency_pin || '1234').trim();

    if (cleanPin === expectedPin) {
      setIsManualAuthorized(true);
      setShowPinModal(false);
      setPinError(null);
      if (pendingManualGroupId) {
        const targetId = pendingManualGroupId;
        setPendingManualGroupId(null);
        selectGroupDirectly(targetId);
      }
    } else {
      setPinError(`✕ PIN de autorización incorrecto. Ingrese el PIN de 4 dígitos configurado por el o la organizadora del evento.`);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedTokenHash || !matchedGroup) {
      alert('Por favor escanea o ingresa un código QR válido primero.');
      return;
    }

    let res: CheckInExecutionResult;

    if (isOnline) {
      res = await executeAtomicCheckInAsync(selectedTokenHash, passesRequested, 'operador-seguridad-01', selectedEventId);
    } else {
      res = await executeOfflineCheckIn(selectedTokenHash, passesRequested, 'operador-seguridad-01', selectedEventId);
      await checkPendingQueue();
    }

    setResultModal(res);

    // Completely clear scanned QR inputs and matched group so the main scanner screen returns to clean state
    setScannedInput('');
    setSelectedTokenHash('');
    setMatchedGroup(null);
    setScanErrorMsg(null);

    await reloadEventData();
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
          {(!session || session?.user?.role === 'OPERATOR' || isOperator) ? (
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
            <Link 
              href={selectedEventId ? `/dashboard?eventId=${encodeURIComponent(selectedEventId)}` : '/dashboard'} 
              className="flex items-center gap-2"
            >
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#C5A059]/40">
                <Image src="/logo-eventcontrol.jpg" alt="Logo" fill className="object-cover" />
              </div>
              <span className="text-xs text-slate-300 font-bold hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            {(!session || session?.user?.role === 'OPERATOR' || isOperator) && (
              <>
                <button
                  type="button"
                  onClick={() => setShowOperatorProfileModal(true)}
                  className="text-[11px] text-amber-300 font-bold hover:text-white px-2.5 py-1 bg-amber-950/60 rounded-lg border border-amber-800/60 transition flex items-center gap-1 shadow-sm"
                  title="Ver Mi Cuenta y Restricciones"
                >
                  <User className="w-3 h-3 text-[#C5A059]" /> Mi Cuenta
                </button>
                <Link 
                  href="/" 
                  className="text-[11px] text-slate-300 font-bold hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 transition flex items-center gap-1"
                  title="Página Principal Web"
                >
                  <Home className="w-3 h-3 text-[#C5A059]" /> Inicio
                </Link>
                <button 
                  onClick={() => {
                    setActiveSession(null);
                    if (typeof window !== 'undefined') window.location.href = '/login';
                  }} 
                  className="text-[11px] text-red-400 font-bold hover:text-red-300 px-2.5 py-1 bg-red-950/60 rounded-lg border border-red-800/60 transition flex items-center gap-1"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3 h-3" /> Salir
                </button>
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

        {/* Dynamic Event Selector / Locked Event Badge for Collaborators */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
              {session?.user?.eventId ? <Lock className="w-3 h-3 text-emerald-400" /> : <span>🍷</span>}
              {session?.user?.eventId ? 'EVENTO EXCLUSIVO ASIGNADO:' : 'EVENTO ACTIVO DE CONTROL:'}
            </label>
            {session?.user?.eventId && (
              <span className="text-[9px] bg-emerald-950/80 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-800/50">
                ACCESO AUTORIZADO
              </span>
            )}
          </div>
          {session?.user?.eventId ? (
            <div className="w-full bg-slate-950 border border-slate-800 text-white text-xs py-2 px-3 rounded-xl flex items-center justify-between font-bold">
              <span className="truncate text-slate-100">{activeEvent?.name || 'Evento Asignado'}</span>
              <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-2">
                {activeEvent?.event_date || 'Sin fecha'}
              </span>
            </div>
          ) : workspaceEvents.length > 0 ? (
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setLastActiveEventId(e.target.value, currentWorkspaceId);
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

        {/* Offline & Guest Refresh Controls Bar */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={reloadEventData}
            disabled={isRefreshingList}
            className="flex-1 py-2 px-3 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800 rounded-xl transition flex items-center justify-center gap-1.5 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshingList ? 'animate-spin' : ''}`} />
            {isRefreshingList ? 'Cargando Invitados...' : `Actualizar Lista (${groups.length} pases)`}
          </button>

          <button
            onClick={handleDownloadManifest}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition flex items-center justify-center gap-1 font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A059]" /> {manifestDownloaded ? 'Manifiesto Listo' : 'Manifiesto Offline'}
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
              onClick={handleToggleCamera}
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

            {/* Quantity Touch & Stepper Selectors */}
            {matchedGroup.status !== 'COMPLETO' ? (() => {
              const availablePasses = Math.max(1, matchedGroup.max_passes - (matchedGroup.checked_in_count || 0));
              const quickOptions = [1, 2, 3, 4, 5, 10, 15, 20].filter(n => n <= availablePasses);

              return (
                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-bold text-slate-300 text-center uppercase tracking-wider">
                    ¿Cuántas personas ingresan ahora? (Disponibles: {availablePasses})
                  </label>

                  {/* Stepper Counter Controls (- / +) */}
                  <div className="flex items-center justify-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      disabled={passesRequested <= 1}
                      onClick={() => setPassesRequested(Math.max(1, passesRequested - 1))}
                      className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xl font-bold border border-slate-700 flex items-center justify-center transition"
                    >
                      -
                    </button>

                    <div className="text-center px-4">
                      <span className="text-2xl font-extrabold text-[#C5A059] block font-mono">
                        {passesRequested}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {passesRequested === 1 ? 'Persona / Pase' : 'Personas / Pases'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={passesRequested >= availablePasses}
                      onClick={() => setPassesRequested(Math.min(availablePasses, passesRequested + 1))}
                      className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xl font-bold border border-slate-700 flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>

                  {/* Dynamic Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {quickOptions.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPassesRequested(num)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition border ${
                          passesRequested === num
                            ? 'bg-[#C5A059] border-[#C5A059] text-slate-950 shadow-md scale-105'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPassesRequested(availablePasses)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition border ${
                        passesRequested === availablePasses
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : 'bg-emerald-950/80 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                      }`}
                    >
                      TODOS ({availablePasses})
                    </button>
                  </div>

                  <button
                    onClick={handleConfirmCheckIn}
                    className="w-full py-4 gold-button font-extrabold text-base rounded-2xl transition shadow-xl flex items-center justify-center gap-2 mt-4"
                  >
                    <CheckCircle2 className="w-6 h-6" /> CONFIRMAR INGRESO ({passesRequested} {passesRequested === 1 ? 'PASE' : 'PASES'})
                  </button>
                </div>
              );
            })() : (
              <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-center space-y-1">
                <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="text-sm font-bold text-red-300 font-serif">GRUPO COMPLETO</h4>
                <p className="text-xs text-red-400">Todos los pases autorizados para esta lista han ingresado previamente.</p>
              </div>
            )}
          </div>
        ) : (
          /* GOOGLE-STYLE PREDICTIVE GUEST SEARCH / MANUAL SELECTOR */
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-3.5 shadow-xl">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Search className="w-4 h-4 text-[#C5A059]" /> Búsqueda Manual de Invitados por Nombre
              </span>
              <p className="text-[11px] text-slate-400">
                Escribe como en Google para autocompletar rápidamente entre los {groups.length} invitados cargados:
              </p>
            </div>

            {/* Google Search Style Bar with Floating Autocomplete Dropdown */}
            <div ref={searchContainerRef} className="relative w-full">
              <div className={`relative flex items-center w-full rounded-2xl transition-all duration-200 ${
                isManualSearchFocused
                  ? 'ring-2 ring-[#C5A059] shadow-lg shadow-[#C5A059]/10 bg-slate-950 border-[#C5A059]'
                  : 'bg-slate-950 border border-slate-700 hover:border-slate-600'
              }`}>
                <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-slate-400">
                  <Search className={`w-4 h-4 transition-colors ${isManualSearchFocused ? 'text-[#C5A059]' : 'text-slate-400'}`} />
                </div>

                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => {
                    setManualSearchQuery(e.target.value);
                    setIsManualSearchFocused(true);
                  }}
                  onFocus={() => setIsManualSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const normalized = manualSearchQuery.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                      const matches = groups.filter((g) => {
                        if (!normalized) return true;
                        const nName = g.group_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        const ph = (g.responsible_phone || '').replace(/\D/g, '');
                        return nName.includes(normalized) || ph.includes(normalized);
                      });
                      if (matches.length > 0) {
                        handleManualSelectGroup(matches[0].id);
                        setManualSearchQuery('');
                        setIsManualSearchFocused(false);
                      }
                    } else if (e.key === 'Escape') {
                      setIsManualSearchFocused(false);
                    }
                  }}
                  placeholder="Escribe el nombre del invitado, familia o teléfono..."
                  className="w-full bg-transparent text-white text-xs py-3 pr-9 focus:outline-none placeholder:text-slate-500 font-medium"
                />

                {manualSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualSearchQuery('');
                      setIsManualSearchFocused(true);
                    }}
                    className="absolute right-3 p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Floating Dropdown Results */}
              {isManualSearchFocused && (() => {
                const normalized = manualSearchQuery.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const filtered = groups.filter((g) => {
                  if (!normalized) return true;
                  const nName = g.group_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const ph = (g.responsible_phone || '').replace(/\D/g, '');
                  const asgn = assignments.find(a => a.group_id === g.id);
                  const tblName = asgn ? (tables.find(t => t.id === asgn.table_id)?.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
                  return nName.includes(normalized) || ph.includes(normalized) || tblName.includes(normalized);
                });

                return (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-semibold px-3.5">
                      <span>
                        {filtered.length} {filtered.length === 1 ? 'coincidencia' : 'coincidencias'} {manualSearchQuery ? `para "${manualSearchQuery}"` : 'en total'}
                      </span>
                      <span className="text-[10px] text-[#C5A059] uppercase tracking-wider font-bold">
                        Toca o Presiona Enter
                      </span>
                    </div>

                    <div className="overflow-y-auto divide-y divide-slate-800/80">
                      {filtered.length === 0 ? (
                        <div className="p-5 text-center text-slate-400 text-xs space-y-1">
                          <p className="font-semibold text-slate-300">No se encontraron invitados</p>
                          <p className="text-[11px] text-slate-500">Intenta con otro apellido o término de búsqueda.</p>
                        </div>
                      ) : (
                        filtered.map((g) => {
                          const asgn = assignments.find(a => a.group_id === g.id);
                          const tblName = asgn ? (tables.find(t => t.id === asgn.table_id)?.name || 'Sin mesa') : 'Sin mesa';
                          const isComp = g.status === 'COMPLETO' || (g.checked_in_count || 0) >= g.max_passes;
                          const isPart = (g.checked_in_count || 0) > 0 && !isComp;

                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                handleManualSelectGroup(g.id);
                                setManualSearchQuery('');
                                setIsManualSearchFocused(false);
                              }}
                              className="w-full text-left p-3 hover:bg-slate-800/90 active:bg-[#C5A059]/20 transition flex items-center justify-between gap-3 group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-xs truncate group-hover:text-[#C5A059] transition-colors">
                                    {g.group_name}
                                  </span>
                                  {g.responsible_phone && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      ({g.responsible_phone})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                  <span className="flex items-center gap-1 text-purple-400 font-semibold">
                                    <MapPin className="w-3 h-3" /> {tblName}
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-semibold">
                                    {g.checked_in_count || 0}/{g.max_passes} pases
                                  </span>
                                </div>
                              </div>

                              <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isComp
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : isPart
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}>
                                {isComp ? 'COMPLETO' : isPart ? 'PARCIAL' : 'PENDIENTE'}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* RESUMEN EN VIVO DE AVANCE DE INGRESO Y GRILLA DE PASES */}
        {(() => {
          const totalPasses = groups.reduce((sum, g) => sum + (g.max_passes || 0), 0);
          const enteredPasses = groups.reduce((sum, g) => sum + (g.checked_in_count || 0), 0);
          const pendingPasses = Math.max(0, totalPasses - enteredPasses);
          const enteredPercentage = totalPasses > 0 ? Math.round((enteredPasses / totalPasses) * 100) : 0;

          const completeGroups = groups.filter(g => g.status === 'COMPLETO' || (g.checked_in_count || 0) >= g.max_passes);
          const partialGroups = groups.filter(g => g.status === 'PARCIAL' || ((g.checked_in_count || 0) > 0 && (g.checked_in_count || 0) < g.max_passes));
          const pendingGroups = groups.filter(g => (g.checked_in_count || 0) === 0 && g.status !== 'COMPLETO');

          const filteredDisplayGroups = groups.filter(g => {
            const checkedIn = g.checked_in_count || 0;
            const isComp = checkedIn >= g.max_passes || g.status === 'COMPLETO';
            const isPart = checkedIn > 0 && checkedIn < g.max_passes;
            const isPend = checkedIn === 0 && !isComp;

            if (gridFilterTab === 'PARTIAL' && !isPart) return false;
            if (gridFilterTab === 'COMPLETE' && !isComp) return false;
            if (gridFilterTab === 'PENDING' && !isPend) return false;

            if (gridSearchTerm.trim()) {
              const q = gridSearchTerm.trim().toLowerCase();
              const nameMatch = g.group_name.toLowerCase().includes(q);
              const phoneMatch = g.responsible_phone && g.responsible_phone.toLowerCase().includes(q);
              return nameMatch || phoneMatch;
            }

            return true;
          });

          return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
              {/* Header Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-[#C5A059] uppercase tracking-wider block flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#C5A059]" /> Resumen de Avance de Ingresos en Puerta
                  </span>
                  <h3 className="text-base font-bold text-white font-serif mt-0.5">
                    Avance: {enteredPasses} / {totalPasses} Personas Ingresadas ({enteredPercentage}%)
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-full">
                    ✓ {enteredPasses} Ingresaron
                  </span>
                  <span className="px-2.5 py-1 bg-amber-950/80 text-amber-400 border border-amber-800/80 rounded-full">
                    ⏳ {pendingPasses} Pendientes
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 via-[#C5A059] to-amber-500 h-full transition-all duration-500"
                    style={{ width: `${enteredPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 personas</span>
                  <span>{enteredPercentage}% Ingresado</span>
                  <span>Total: {totalPasses} personas</span>
                </div>
              </div>

              {/* Filter Tabs & Live Search Bar */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1 text-[11px] font-bold">
                    <button
                      onClick={() => setGridFilterTab('ALL')}
                      className={`px-2.5 py-1 rounded-xl border transition ${
                        gridFilterTab === 'ALL'
                          ? 'bg-[#C5A059] text-slate-950 border-[#C5A059]'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Todos ({groups.length})
                    </button>
                    <button
                      onClick={() => setGridFilterTab('PARTIAL')}
                      className={`px-2.5 py-1 rounded-xl border transition ${
                        gridFilterTab === 'PARTIAL'
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-amber-950/40 text-amber-300 border-amber-900/60 hover:bg-amber-950'
                      }`}
                    >
                      🟡 Parciales ({partialGroups.length})
                    </button>
                    <button
                      onClick={() => setGridFilterTab('COMPLETE')}
                      className={`px-2.5 py-1 rounded-xl border transition ${
                        gridFilterTab === 'COMPLETE'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-red-950/40 text-red-300 border-red-900/60 hover:bg-red-950'
                      }`}
                    >
                      🔴 Agotados ({completeGroups.length})
                    </button>
                    <button
                      onClick={() => setGridFilterTab('PENDING')}
                      className={`px-2.5 py-1 rounded-xl border transition ${
                        gridFilterTab === 'PENDING'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60 hover:bg-emerald-950'
                      }`}
                    >
                      🟢 Pendientes ({pendingGroups.length})
                    </button>
                  </div>

                  {/* Search Box */}
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={gridSearchTerm}
                      onChange={(e) => setGridSearchTerm(e.target.value)}
                      placeholder="Buscar invitado por nombre..."
                      className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>
                </div>

                {/* Guest Groups Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {filteredDisplayGroups.length === 0 ? (
                    <div className="col-span-full p-6 text-center text-xs text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800">
                      No se encontraron pases con el filtro o término de búsqueda.
                    </div>
                  ) : (
                    filteredDisplayGroups.map((g) => {
                      const checkedIn = g.checked_in_count || 0;
                      const isComp = checkedIn >= g.max_passes || g.status === 'COMPLETO';
                      const isPart = checkedIn > 0 && checkedIn < g.max_passes;
                      const currentAsgns = assignments.length > 0 ? assignments : getEventTableAssignments(selectedEventId);
                      const currentTbls = tables.length > 0 ? tables : getEventTables(selectedEventId);
                      const tblAsgn = currentAsgns.find(a => a.group_id === g.id);
                      const tbl = tblAsgn ? currentTbls.find(t => t.id === tblAsgn.table_id) : null;
                      const tableNameStr = tbl ? tbl.name : 'Sin Mesa';

                      return (
                        <div 
                          key={g.id}
                          onClick={() => handleManualSelectGroup(g.id)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 hover:scale-[1.01] ${
                            isComp 
                              ? 'bg-red-950/20 border-red-900/50 hover:border-red-700' 
                              : isPart 
                              ? 'bg-amber-950/20 border-amber-900/50 hover:border-amber-700' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <strong className="text-xs font-bold text-white truncate block">{g.group_name}</strong>
                              <span className="text-[9px] text-purple-300 font-semibold bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-800/40 shrink-0">
                                {tableNameStr}
                              </span>
                            </div>
                            {g.responsible_phone && (
                              <span className="text-[10px] text-slate-400 block truncate">Tel: {g.responsible_phone}</span>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold block mb-0.5 ${
                              isComp ? 'bg-red-950 text-red-400 border border-red-800' :
                              isPart ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}>
                              {isComp ? '🔴 AGOTADO' : isPart ? `🟡 ${checkedIn}/${g.max_passes}` : '🟢 PENDIENTE'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {checkedIn} de {g.max_passes} pases
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}
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
              onClick={handleCloseResultModal}
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

      {/* CONTINGENCY AUTHORIZATION PIN MODAL (WEDDING PLANNER OVERRIDE) */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-xs w-full bg-slate-900 border-2 border-[#C5A059] rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-950/80 text-[#C5A059] rounded-2xl border border-[#C5A059]/40 flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-serif">Autorización de Contingencia</h3>
              <p className="text-xs text-slate-400 mt-1">
                El ingreso manual por lista (sin mostrar el código QR) requiere el PIN de el o la organizadora del evento para evitar accesos no autorizados en puerta.
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 bg-red-950/90 border border-red-800 text-red-300 text-[11px] rounded-xl font-medium">
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1">
                  🔑 PIN de Autorización de el o la organizadora del evento:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="• • • •"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-center text-xl tracking-[0.4em] py-2.5 rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPendingManualGroupId(null);
                    setPinError(null);
                  }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 gold-button font-extrabold text-xs rounded-xl shadow-md transition"
                >
                  Autorizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPERATOR ACCOUNT & RESTRICTIONS MODAL */}
      {showOperatorProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl relative text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowOperatorProfileModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Detalles de Mi Cuenta</h3>
                <p className="text-[11px] text-slate-400">Perfil de Operación y Restricciones del Sistema</p>
              </div>
            </div>

            {/* Profile Identity Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identidad Activa</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                  OPERADOR DE PUERTA
                </span>
              </div>
              <div className="text-sm font-bold text-white">
                {session?.user?.name || 'Operador de Control'}
              </div>
              <div className="text-xs text-slate-400">
                {session?.user?.email || 'operador@eventcontrol.internal'}
              </div>
              {session?.user?.eventId && (
                <div className="pt-1 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Evento Asignado: {activeEvent?.name || session.user.eventId}</span>
                </div>
              )}
            </div>

            {/* Permissions & Restrictions */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Alcance y Restricciones del Perfil
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                  <span><strong>Escaneo y Check-in QR:</strong> Autorizado para validar y registrar ingresos de invitados en tiempo real.</span>
                </div>
                <div className="flex items-start gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                  <span><strong>Soporte Offline PWA:</strong> Autorizado para validar ingresos sin conexión a internet y sincronizar posteriormente.</span>
                </div>
                <div className="flex items-start gap-2 text-rose-400">
                  <X className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-500" />
                  <span><strong>Administración Bloqueada:</strong> No puede crear, editar o eliminar eventos, mesas, pases o colaboradores.</span>
                </div>
                <div className="flex items-start gap-2 text-rose-400">
                  <X className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-500" />
                  <span><strong>Reportes y Exportación:</strong> No cuenta con acceso a descargas Excel, exportación de asistentes ni métricas de cuenta.</span>
                </div>
              </div>
            </div>

            {/* Plan Info */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan del Workspace</div>
                <div className="text-xs font-bold text-[#C5A059]">
                  {account?.planCode ? PLAN_LIMITS[account.planCode as keyof typeof PLAN_LIMITS]?.name || account.planCode : 'Starter'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace ID</div>
                <div className="text-xs font-mono text-slate-300">{currentWorkspaceId}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOperatorProfileModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
            >
              Entendido / Cerrar
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
