'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Clock, ArrowLeft, Plus, Utensils, AlertCircle, CheckCircle2, 
  Lock, Users, Grid, History, ArrowRight
} from 'lucide-react';
import EventNavHeader from '@/components/EventNavHeader';
import { getEventById } from '@/lib/events';
import { getEventCuts, createEventCut, calculateCateringDiff } from '@/lib/cuts';
import { Cut } from '@/lib/supabase/types';

export default function EventCutsPage() {
  const params = useParams();
  const eventId = String(params.id || 'evt-102');
  const currentWorkspaceId = 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);

  const [cuts, setCuts] = useState<Cut[]>(getEventCuts(eventId));
  const [cateringDiff, setCateringDiff] = useState(calculateCateringDiff(eventId));
  const [cutName, setCutName] = useState('Servicio de Comida (Catering)');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const refreshCuts = () => {
    setCuts([...getEventCuts(eventId)]);
    setCateringDiff(calculateCateringDiff(eventId));
  };

  const handleCreateCut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutName) return;

    createEventCut(eventId, currentWorkspaceId, cutName);
    setCutName('');
    setShowCreateModal(false);
    refreshCuts();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <EventNavHeader currentTab="cuts" eventId={eventId} eventName={event?.name} />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">

        {/* Page Title */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Fotografías Inmutables y Catering</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Cortes de Asistencia y Control de Comida</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Captura snapshots inmutables del estado del evento para coordinar con el servicio de catering y detectar llegadas posteriores.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Registrar Nuevo Corte
          </button>
        </div>

        {/* CATERING CONTROL EXECUTIVE PANEL */}
        {cateringDiff && (
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/40">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Panel Principal de Catering</span>
                  <h2 className="text-lg font-extrabold">{cateringDiff.foodCutName}</h2>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Corte realizado: {new Date(cateringDiff.foodCutTimestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Catering Key KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold uppercase block">Platos Requeridos al Corte</span>
                <strong className="text-3xl font-black text-amber-400 mt-1 block">{cateringDiff.platesRequiredAtCut}</strong>
                <span className="text-[11px] text-slate-400">(1 persona presente = 1 plato)</span>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold uppercase block">Asistencia Actual en Vivo</span>
                <strong className="text-3xl font-black text-emerald-400 mt-1 block">{cateringDiff.currentTotalPresent}</strong>
                <span className="text-[11px] text-slate-400">personas dentro del evento</span>
              </div>

              <div className="p-4 bg-amber-950/60 rounded-xl border border-amber-700/80">
                <span className="text-xs text-amber-300 font-bold uppercase block">Llegadas Posteriores al Corte</span>
                <strong className="text-3xl font-black text-amber-400 mt-1 block">+{cateringDiff.lateArrivalsCount}</strong>
                <span className="text-[11px] text-amber-300 font-semibold">posibles platos adicionales</span>
              </div>
            </div>

            {/* Table Breakdown of Late Arrivals */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Distribución de Llegadas Posteriores por Mesa:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cateringDiff.tableBreakdown.map((tb, idx) => (
                  <div key={idx} className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{tb.tableName}</span>
                      <span className="text-[11px] text-slate-400">Al corte: {tb.presentAtCut} • Actual: {tb.currentPresent}</span>
                    </div>
                    {tb.lateArrivals > 0 ? (
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40 rounded-lg">
                        +{tb.lateArrivals} nuevos
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold">Sin llegadas</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HISTORICAL IMMUTABLE CUTS LIST (Caso 8) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" /> Histórico de Cortes Inmutables ({cuts.length})
            </h3>
            <span className="text-xs text-slate-500">Fotografías estáticas protegidas</span>
          </div>

          <div className="space-y-4">
            {cuts.map((cut) => {
              const snapTables = (cut.table_snapshots as any[]) || [];

              return (
                <div key={cut.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <h4 className="text-base font-bold text-slate-900">{cut.cut_name}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" /> {new Date(cut.cut_timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Cut Summary Grid */}
                  <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase">Autorizados</span>
                      <strong className="text-slate-900 text-sm font-bold">{cut.total_authorized}</strong>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
                      <span className="block text-[10px] uppercase">Presentes al Corte</span>
                      <strong className="text-sm font-bold">{cut.total_present}</strong>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                      <span className="block text-[10px] uppercase">Pendientes al Corte</span>
                      <strong className="text-sm font-bold">{cut.total_pending}</strong>
                    </div>
                  </div>

                  {/* Table Distribution Snapshot */}
                  {snapTables.length > 0 && (
                    <div className="pt-2 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Snapshot de Mesas a esa hora:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {snapTables.map((s: any, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                            <strong>{s.tableName}:</strong> {s.present}/{s.capacity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* CREATE CUT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Registrar Nuevo Corte</h2>
            <p className="text-xs text-slate-500 mb-4">
              Se capturará una fotografía inmutable del número de personas presentes en este preciso instante.
            </p>

            <form onSubmit={handleCreateCut} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Operativo del Corte
                </label>
                <input
                  type="text"
                  required
                  value={cutName}
                  onChange={(e) => setCutName(e.target.value)}
                  placeholder="Ej. Servicio de Comida, Brindis, Cierre"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                ⚠️ Una vez registrado, este corte se congelará y no sufrirá cambios incluso si ingresan más personas más tarde.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                >
                  Congelar y Guardar Corte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
