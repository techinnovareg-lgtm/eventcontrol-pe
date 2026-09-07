'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Camera, QrCode, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, 
  Users, MapPin, RefreshCw, ArrowLeft, Zap, Lock, Wifi, WifiOff, Download, CloudUpload, Home, LogOut
} from 'lucide-react';
import { resolveQRToken, getOrCreateGroupQRToken } from '@/lib/qr-engine';
import { executeAtomicCheckIn, simulateConcurrentScans, CheckInExecutionResult } from '@/lib/checkin';
import { 
  downloadEventOfflineManifest, executeOfflineCheckIn, 
  syncOfflineQueueToServer, getPendingOfflineQueueCount 
} from '@/lib/offline-db';
import { getEventGuestGroups } from '@/lib/events';
import { getEventTableAssignments, getEventTables } from '@/lib/tables';
import { getActiveSession } from '@/lib/superadmin-store';

export default function MobileScanCheckInPage() {
  const session = getActiveSession();
  const isOperator = session?.user?.role === 'OPERATOR';
  const eventId = 'evt-102';
  const currentWorkspaceId = 'ws-a-1111';

  const groups = getEventGuestGroups(eventId);
  const assignments = getEventTableAssignments(eventId);
  const tables = getEventTables(eventId);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [manifestDownloaded, setManifestDownloaded] = useState<boolean>(false);

  const [selectedTokenHash, setSelectedTokenHash] = useState<string>('');
  const [passesRequested, setPassesRequested] = useState<number>(1);
  const [resultModal, setResultModal] = useState<CheckInExecutionResult | null>(null);
  const [concurrencyResult, setConcurrencyResult] = useState<{ operatorA: CheckInExecutionResult; operatorB: CheckInExecutionResult } | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const activeToken = selectedTokenHash ? resolveQRToken(selectedTokenHash).token : null;
  const activeGroup = activeToken ? groups.find(g => g.id === activeToken.group_id) : null;

  let activeTableName = 'Sin Mesa Asignada';
  if (activeGroup) {
    const asgn = assignments.find(a => a.group_id === activeGroup.id);
    if (asgn) {
      const tbl = tables.find(t => t.id === asgn.table_id);
      if (tbl) activeTableName = tbl.name;
    }
  }

  const checkPendingQueue = async () => {
    try {
      const count = await getPendingOfflineQueueCount(eventId);
      setPendingSyncCount(count);
    } catch (e) {}
  };

  useEffect(() => {
    checkPendingQueue();
  }, []);

  const handleDownloadManifest = async () => {
    await downloadEventOfflineManifest(eventId, currentWorkspaceId);
    setManifestDownloaded(true);
    alert('¡Manifiesto guardado en IndexedDB! El escáner funcionará en puerta incluso si se corta internet.');
  };

  const handleSyncQueue = async () => {
    setSyncStatusMsg('Sincronizando registros offline con el servidor...');
    const res = await syncOfflineQueueToServer(eventId);
    await checkPendingQueue();

    if (res.conflictCount > 0) {
      setSyncStatusMsg(`Sincronización completada: ${res.syncedCount} exitosos, ${res.conflictCount} conflictos de sobrecupo aislados.`);
    } else {
      setSyncStatusMsg(`¡Éxito! ${res.syncedCount} registros sincronizados atómicamente.`);
    }
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  const handleSelectGroup = (groupId: string) => {
    const token = getOrCreateGroupQRToken(groupId, eventId, currentWorkspaceId);
    setSelectedTokenHash(token.token_hash);
    setPassesRequested(1);
    setResultModal(null);
    setConcurrencyResult(null);
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedTokenHash) {
      alert('Por favor selecciona o escanea un código QR.');
      return;
    }

    if (isOnline) {
      const res = executeAtomicCheckIn(selectedTokenHash, passesRequested, 'operador-seguridad-01', eventId);
      setResultModal(res);
    } else {
      const res = await executeOfflineCheckIn(selectedTokenHash, passesRequested, 'operador-seguridad-01', eventId);
      await checkPendingQueue();
      setResultModal(res);
    }
  };

  const handleSimulateConcurrency = () => {
    if (!selectedTokenHash) return;
    const res = simulateConcurrentScans(selectedTokenHash, 3, 3);
    setConcurrencyResult(res);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4 max-w-md mx-auto flex flex-col justify-between selection:bg-[#C5A059] selection:text-white">
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
                <span className="text-[9px] text-emerald-400 font-bold block">OPERADOR PUERTA</span>
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
            <Download className="w-3.5 h-3.5 text-[#C5A059]" /> {manifestDownloaded ? 'Caché Actualizado' : 'Descargar Manifiesto'}
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

        {/* Camera Feed Simulation Box */}
        <div className="bg-slate-900 border-2 border-dashed border-[#C5A059]/60 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden">
          <div className="w-16 h-16 bg-[#C5A059]/20 rounded-full flex items-center justify-center mx-auto text-[#C5A059] border border-[#C5A059]/40 animate-pulse">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-200 font-serif">
              Visor de Escáner Puerta ({isOnline ? 'Servidor Conectado' : 'IndexedDB Local'})
            </h2>
            <p className="text-xs text-slate-400">Apunta el escáner al código QR del invitado</p>
          </div>

          {/* Quick Selector of QR Tokens for Demo/Testing */}
          <div className="pt-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              O selecciona un QR para probar:
            </label>
            <select
              value={activeGroup ? activeGroup.id : ''}
              onChange={(e) => handleSelectGroup(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs py-2 px-3 rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:outline-none font-semibold"
            >
              <option value="" disabled>-- Seleccionar Grupo Invitado --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.group_name} ({g.checked_in_count || 0}/{g.max_passes} pases - {g.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scanned QR Info Section */}
        {activeGroup ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest block">Grupo Validado</span>
                <h3 className="text-lg font-bold text-white font-serif">{activeGroup.group_name}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                activeGroup.status === 'COMPLETO' ? 'bg-red-950 text-red-400 border border-red-800' :
                activeGroup.status === 'PARCIAL' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {activeGroup.status}
              </span>
            </div>

            {/* Table & Pass Balance Details */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Mesa Asignada</span>
                <strong className="text-sm font-bold text-purple-400 flex items-center justify-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {activeTableName}
                </strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Pases Ingresados</span>
                <strong className="text-sm font-bold text-emerald-400 mt-0.5 block">
                  {activeGroup.checked_in_count || 0} / {activeGroup.max_passes}
                </strong>
              </div>
            </div>

            {/* Quantity Touch Selectors */}
            {activeGroup.status !== 'COMPLETO' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 text-center uppercase tracking-wider">
                  ¿Cuántas personas ingresan ahora?
                </label>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPassesRequested(num)}
                      className={`py-3 text-base font-extrabold rounded-xl transition border ${
                        passesRequested === num
                          ? 'bg-[#C5A059] border-[#C5A059] text-slate-950 shadow-lg scale-105'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleConfirmCheckIn}
                  className="w-full py-4 gold-button font-extrabold text-base rounded-2xl transition shadow-xl flex items-center justify-center gap-2 mt-4"
                >
                  <CheckCircle2 className="w-6 h-6" /> CONFIRMAR INGRESO ({passesRequested})
                </button>
              </div>
            ) : (
              <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-center space-y-1">
                <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="text-sm font-bold text-red-300 font-serif">GRUPO COMPLETO</h4>
                <p className="text-xs text-red-400">Todos los pases autorizados han ingresado previamente.</p>
              </div>
            )}

            {/* Test Concurrency Button (Caso 5) */}
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
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            Escanea un código QR o selecciona un grupo en el menú desplegable superior para iniciar la validación.
          </div>
        )}
      </div>

      {/* RESULT MODAL POPUP */}
      {resultModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
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
