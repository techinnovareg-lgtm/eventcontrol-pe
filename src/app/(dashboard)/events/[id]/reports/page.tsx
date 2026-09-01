'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  FileSpreadsheet, FileText, Printer, ArrowLeft, Download, 
  CheckCircle2, Utensils, Users, Grid, ShieldCheck, Clock
} from 'lucide-react';
import EventNavHeader from '@/components/EventNavHeader';
import { getEventById, getEventGuestGroups } from '@/lib/events';
import { calculateDashboardMetrics, getTablesOccupancyStats } from '@/lib/dashboard-stats';
import { calculateCateringDiff } from '@/lib/cuts';
import { exportEventToExcel } from '@/lib/export-engine';

export default function EventReportsPage() {
  const params = useParams();
  const eventId = String(params.id || 'evt-102');
  const currentWorkspaceId = 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);
  const metrics = calculateDashboardMetrics(eventId);
  const groups = getEventGuestGroups(eventId);
  const tablesStats = getTablesOccupancyStats(eventId);
  const cateringDiff = calculateCateringDiff(eventId);

  const handleExportExcel = () => {
    exportEventToExcel(eventId, currentWorkspaceId);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div className="no-print">
        <EventNavHeader currentTab="reports" eventId={eventId} eventName={event?.name} />
      </div>
      
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Navigation & Action Bar (Hidden on Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href="/events" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Volver a Eventos
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Descargar Excel Completo (.xlsx)
            </button>
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <Printer className="w-4 h-4" /> Exportar PDF Ejecutivo / Imprimir
            </button>
          </div>
        </div>

        {/* EXECUTIVE REPORT PRINT CONTAINER */}
        <div className="print-area bg-white rounded-2xl p-8 border border-slate-200 shadow-lg space-y-8">
          {/* Document Cover Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                  E
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">EventControl<span className="text-brand-600">.pe</span></span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{event?.name || 'Boda / Evento Social'}</h1>
              <p className="text-sm text-slate-600 mt-1">
                {event?.event_type} • {event?.event_date} {event?.event_time && `(${event.event_time} hs)`} • {event?.venue_name}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">REPORTE EJECUTIVO DE EVENTO</span>
              <strong className="text-sm font-bold text-slate-800">AMG Wedding Planners</strong>
              <span className="text-xs text-slate-500 block">Emitido: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Section 1: Executive KPI Metrics */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" /> 1. Resumen Ejecutivo de Asistencia
            </h2>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Pases Autorizados</span>
                <strong className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalAuthorized}</strong>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <span className="text-xs text-emerald-700 uppercase font-semibold block">Ingresados (Presentes)</span>
                <strong className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.totalEntered}</strong>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <span className="text-xs text-amber-700 uppercase font-semibold block">Pases Pendientes</span>
                <strong className="text-2xl font-black text-amber-600 mt-1 block">{metrics.totalPending}</strong>
              </div>
              <div className="p-4 bg-slate-900 text-white rounded-xl">
                <span className="text-xs text-slate-400 uppercase font-semibold block">% Asistencia</span>
                <strong className="text-2xl font-black text-emerald-400 mt-1 block">{metrics.occupancyPercentage}%</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Catering & Food Cut Analysis */}
          {cateringDiff && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" /> 2. Control de Catering y Platos Requeridos
              </h2>

              <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-amber-900">{cateringDiff.foodCutName}</h3>
                  <p className="text-xs text-amber-800">
                    Corte inmutable realizado el {new Date(cateringDiff.foodCutTimestamp).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-6 text-center">
                  <div>
                    <span className="text-xs text-amber-800 font-semibold block uppercase">Platos Requeridos al Corte</span>
                    <strong className="text-2xl font-black text-amber-600">{cateringDiff.platesRequiredAtCut}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-amber-800 font-semibold block uppercase">Llegadas Posteriores</span>
                    <strong className="text-2xl font-black text-amber-700">+{cateringDiff.lateArrivalsCount}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Tables Occupancy Distribution */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Grid className="w-4 h-4 text-purple-600" /> 3. Distribución y Asistencia por Mesas
            </h2>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 uppercase">
                  <th className="py-2.5 px-4">Mesa</th>
                  <th className="py-2.5 px-4">Capacidad</th>
                  <th className="py-2.5 px-4">Pases Asignados</th>
                  <th className="py-2.5 px-4">Presentes en Mesa</th>
                  <th className="py-2.5 px-4">% Ocupación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tablesStats.map((t) => (
                  <tr key={t.tableId}>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{t.tableName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{t.capacity}</td>
                    <td className="py-2.5 px-4 font-semibold text-purple-700">{t.assignedPasses}</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">{t.presentPasses}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{t.occupancyPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Guest Groups List */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" /> 4. Detalle de Grupos de Invitados ({groups.length})
            </h2>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 uppercase">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Grupo / Responsable</th>
                  <th className="py-2.5 px-4">Pases Autorizados</th>
                  <th className="py-2.5 px-4">Ingresados</th>
                  <th className="py-2.5 px-4">Pendientes</th>
                  <th className="py-2.5 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {groups.map((g, idx) => (
                  <tr key={g.id}>
                    <td className="py-2 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-4 font-semibold text-slate-900">{g.group_name}</td>
                    <td className="py-2 px-4 font-bold text-slate-700">{g.max_passes}</td>
                    <td className="py-2 px-4 font-bold text-emerald-600">{g.checked_in_count || 0}</td>
                    <td className="py-2 px-4 text-amber-700 font-semibold">{Math.max(0, g.max_passes - (g.checked_in_count || 0))}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        g.status === 'COMPLETO' ? 'bg-emerald-100 text-emerald-800' :
                        g.status === 'PARCIAL' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Document Sign-off Footer */}
          <div className="pt-8 border-t-2 border-slate-900 flex justify-between text-xs text-slate-500">
            <div>
              <span>Organizador: <strong>AMG Wedding Planners</strong></span>
            </div>
            <div>
              <span>Plataforma SaaS EventControl • Documento Oficial</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
