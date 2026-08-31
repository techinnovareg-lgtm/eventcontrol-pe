'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Camera, QrCode, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, 
  Users, MapPin, RefreshCw, ArrowLeft, Zap, Lock
} from 'lucide-react';
import { resolveQRToken, getOrCreateGroupQRToken } from '@/lib/qr-engine';
import { executeAtomicCheckIn, simulateConcurrentScans, CheckInExecutionResult } from '@/lib/checkin';
import { getEventGuestGroups } from '@/lib/events';
import { getEventTableAssignments, getEventTables } from '@/lib/tables';

export default function MobileScanCheckInPage() {
  const eventId = 'evt-102';
  const currentWorkspaceId = 'ws-a-1111';

  const groups = getEventGuestGroups(eventId);
  const assignments = getEventTableAssignments(eventId);
  const tables = getEventTables(eventId);

  const [selectedTokenHash, setSelectedTokenHash] = useState<string>('');
  const [passesRequested, setPassesRequested] = useState<number>(1);
  const [resultModal, setResultModal] = useState<CheckInExecutionResult | null>(null);
  const [concurrencyResult, setConcurrencyResult] = useState<{ operatorA: CheckInExecutionResult; operatorB: CheckInExecutionResult } | null>(null);

  // Auto select first group's token for fast testing
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

  const handleSelectGroup = (groupId: string) => {
    const token = getOrCreateGroupQRToken(groupId, eventId, currentWorkspaceId);
    setSelectedTokenHash(token.token_hash);
    setPassesRequested(1);
    setResultModal(null);
    setConcurrencyResult(null);
  };

  const handleConfirmCheckIn = () => {
    if (!selectedTokenHash) {
      alert('Por favor selecciona o escanea un código QR.');
      return;
    }

    const res = executeAtomicCheckIn(selectedTokenHash, passesRequested, 'operador-seguridad-01', eventId);
    setResultModal(res);
  };

  const handleSimulateConcurrency = () => {
    if (!selectedTokenHash) return;
    // Simulate Op A trying to enter 3, Op B trying to enter 3 simultaneously
    const res = simulateConcurrentScans(selectedTokenHash, 3, 3);
    setConcurrencyResult(res);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-between">
      {/* Top Header Mobile */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Salir
          </Link>
          <div className="flex items-center gap-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> MODO SEGURIDAD PWA
          </div>
        </div>

        {/* Camera Feed Simulation Box */}
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/50 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden">
          <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/40 animate-pulse">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-200">Visor de Cámara Activado</h2>
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
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs py-2 px-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Grupo Validado</span>
                <h3 className="text-lg font-extrabold text-white">{activeGroup.group_name}</h3>
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
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/50 scale-105'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleConfirmCheckIn}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-base rounded-2xl transition shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2 mt-4"
                >
                  <CheckCircle2 className="w-6 h-6" /> CONFIRMAR INGRESO ({passesRequested})
                </button>
              </div>
            ) : (
              <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-center space-y-1">
                <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="text-sm font-bold text-red-300">GRUPO COMPLETO</h4>
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
              <h3 className={`text-xl font-extrabold ${resultModal.success ? 'text-emerald-400' : 'text-red-400'}`}>
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

      <footer className="text-center text-[10px] text-slate-600 pt-4">
        EventControl Security PWA Module • SSL TLS 1.3
      </footer>
    </div>
  );
}
