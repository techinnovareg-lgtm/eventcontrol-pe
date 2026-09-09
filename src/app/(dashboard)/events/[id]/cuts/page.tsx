'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { 
  Clock, ArrowLeft, Plus, Utensils, AlertCircle, CheckCircle2, 
  Lock, Users, Grid, History, ArrowRight
} from 'lucide-react';
import EventNavHeader from '@/components/EventNavHeader';
import { getEventById, getEventGuestGroupsAsync, getEventByIdAsync } from '@/lib/events';
import { getEventCuts, getEventCutsAsync, createEventCut, calculateCateringDiff } from '@/lib/cuts';
import { checkInRealtimeChannel } from '@/lib/realtime';
import { Cut } from '@/lib/supabase/types';

export default function EventCutsPage() {
  const params = useParams();
  const eventId = String(params.id || '');
  const currentWorkspaceId = 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);

  const [cuts, setCuts] = useState<Cut[]>(() => getEventCuts(eventId));
  const [cateringDiff, setCateringDiff] = useState(() => calculateCateringDiff(eventId));
  const [cutName, setCutName] = useState('Servicio de Comida (Catering)');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const refreshCuts = async () => {
    await getEventByIdAsync(eventId, currentWorkspaceId);
    await getEventGuestGroupsAsync(eventId);
    const freshCuts = await getEventCutsAsync(eventId);
    setCuts([...freshCuts]);
    setCateringDiff(calculateCateringDiff(eventId));
  };

  useEffect(() => {
    refreshCuts();

    const unsubscribe = checkInRealtimeChannel.subscribe(() => {
      refreshCuts();
    });

    const timer = setInterval(() => {
      refreshCuts();
    }, 3000);

    return () => {
      clearInterval(timer);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [eventId]);

  const handleCreateCut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutName) return;

    createEventCut(eventId, currentWorkspaceId, cutName);
    setCutName('');
    setShowCreateModal(false);
    await refreshCuts();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white">
      <EventNavHeader currentTab="cuts" eventId={eventId} eventName={event?.name} />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">

        {/* Page Title */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">Fotografías Inmutables y Catering</span>
              <span className="text-[11px] font-serif font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-[#C5A059]/40 shadow-2xs">
                🍷 Evento: {event?.name}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">Cortes de Asistencia y Control de Comida</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Captura snapshots inmutables del estado del evento para coordinar con el servicio de catering y detectar llegadas posteriores.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="gold-button font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Registrar Nuevo Corte
          </button>
        </div>

        {/* CATERING CONTROL EXECUTIVE PANEL (Classic Luxury Theme) */}
        {cateringDiff && (
          <div className="card-luxury p-6 border border-[#C5A059]/40 shadow-xl bg-white space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-100/80 text-[#B8860B] rounded-xl flex items-center justify-center border border-[#C5A059]/40 shadow-inner">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#B8860B] uppercase tracking-widest block">Panel Principal de Catering</span>
                  <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">{cateringDiff.foodCutName}</h2>
                </div>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                Corte realizado: {new Date(cateringDiff.foodCutTimestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Catering Key KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80">
                <span className="text-xs text-amber-900 font-bold uppercase block">Platos Requeridos al Corte</span>
                <strong className="text-3xl font-serif font-bold text-[#B8860B] mt-1 block">{cateringDiff.platesRequiredAtCut}</strong>
                <span className="text-[11px] text-slate-500 font-medium">(1 persona presente = 1 plato)</span>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                <span className="text-xs text-emerald-900 font-bold uppercase block">Asistencia Actual en Vivo</span>
                <strong className="text-3xl font-serif font-bold text-emerald-700 mt-1 block">{cateringDiff.currentTotalPresent}</strong>
                <span className="text-[11px] text-slate-500 font-medium">personas dentro del evento</span>
              </div>

              <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200/80">
                <span className="text-xs text-purple-900 font-bold uppercase block">Llegadas Posteriores al Corte</span>
                <strong className="text-3xl font-serif font-bold text-purple-800 mt-1 block">+{cateringDiff.lateArrivalsCount}</strong>
                <span className="text-[11px] text-purple-700 font-medium">posibles platos adicionales</span>
              </div>
            </div>

            {/* Table Breakdown of Late Arrivals */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Distribución de Llegadas Posteriores por Mesa:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cateringDiff.tableBreakdown.map((tb, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#1A1A1A] block">{tb.tableName}</span>
                      <span className="text-[11px] text-slate-500">Al corte: {tb.presentAtCut} • Actual: {tb.currentPresent}</span>
                    </div>
                    {tb.lateArrivals > 0 ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-900 font-bold border border-amber-300 rounded-lg text-[11px]">
                        +{tb.lateArrivals} nuevos
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">Sin llegadas</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HISTORICAL IMMUTABLE CUTS LIST */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <History className="w-5 h-5 text-[#B8860B]" /> Histórico de Cortes Inmutables ({cuts.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Fotografías estáticas congeladas</span>
          </div>

          {cuts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
              <History className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">Aún no se han registrado cortes de catering en este evento.</p>
              <p className="text-slate-500">Haz clic en &quot;Realizar Corte Ahora&quot; para congelar la fotografía de invitados presentes a la hora del servicio.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cuts.map((cut) => {
              const snapTables = (cut.table_snapshots as any[]) || [];

              return (
                <div key={cut.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#B8860B]" />
                      <h4 className="text-base font-serif font-bold text-slate-900">{cut.cut_name}</h4>
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
                          <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
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
          )}
        </div>
      </main>

      {/* CREATE CUT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Registrar Nuevo Corte</h3>
            <p className="text-xs text-slate-500 mb-2">
              Se capturará una fotografía inmutable del número de personas presentes en este preciso instante.
            </p>

            <form onSubmit={handleCreateCut} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Operativo del Corte
                </label>
                <input
                  type="text"
                  required
                  value={cutName}
                  onChange={(e) => setCutName(e.target.value)}
                  placeholder="Ej. Servicio de Comida, Brindis, Cierre"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                ⚠️ Una vez registrado, este corte se congelará y no sufrirá cambios incluso si ingresan más personas más tarde.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 gold-button font-bold rounded-xl shadow-md"
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
