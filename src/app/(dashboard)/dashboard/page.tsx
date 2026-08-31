'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, CheckCircle2, Clock, Grid, Plus, LogOut, QrCode, 
  MapPin, ShieldAlert, ArrowUpRight, Radio, Activity, PieChart
} from 'lucide-react';
import { calculateDashboardMetrics, getTablesOccupancyStats, getRecentCheckInsFeed } from '@/lib/dashboard-stats';
import { checkInRealtimeChannel } from '@/lib/realtime';

export default function DashboardPage() {
  const eventId = 'evt-102';
  const currentWorkspaceId = 'ws-a-1111';

  const [metrics, setMetrics] = useState(calculateDashboardMetrics(eventId));
  const [tablesStats, setTablesStats] = useState(getTablesOccupancyStats(eventId));
  const [recentFeed, setRecentFeed] = useState(getRecentCheckInsFeed(eventId, 8));
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string>(new Date().toLocaleTimeString());

  const refreshAllDashboardData = () => {
    setMetrics(calculateDashboardMetrics(eventId));
    setTablesStats(getTablesOccupancyStats(eventId));
    setRecentFeed(getRecentCheckInsFeed(eventId, 8));
    setLastUpdateTimestamp(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    // Subscribe to Realtime Check-in notifications
    const unsubscribe = checkInRealtimeChannel.subscribe(() => {
      refreshAllDashboardData();
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white shadow">
              E
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">AMG Wedding Planners</h1>
              <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Panel en Vivo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/scan"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
            >
              <QrCode className="w-4 h-4" /> Escáner Seguridad (PWA)
            </Link>
            <Link
              href="/workspace"
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-300 border border-slate-700 transition"
            >
              Rol: <strong className="text-white font-semibold">OWNER</strong>
            </Link>
            <Link 
              href="/login" 
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <LogOut className="w-4 h-4" /> Salir
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Event Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                EVENTO EN VIVO
              </span>
              <span className="text-xs text-slate-400 font-mono">Última actualización: {lastUpdateTimestamp}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Cumpleaños Tavo 60 Años (Demo CUMPLE.xlsx)</h2>
            <p className="text-xs text-slate-500">Club Germania, Miraflores • 20 de Septiembre, 2026</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/events"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              Ver Todos los Eventos
            </Link>
          </div>
        </div>

        {/* Top KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Pases Autorizados</span>
            <div className="flex items-baseline justify-between">
              <strong className="text-3xl font-black text-slate-900">{metrics.totalAuthorized}</strong>
              <span className="text-xs text-slate-500 font-semibold">{metrics.totalGroupsCount} grupos</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/30">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">Ingresados (Presentes)</span>
            <div className="flex items-baseline justify-between">
              <strong className="text-3xl font-black text-emerald-600">{metrics.totalEntered}</strong>
              <span className="text-xs text-emerald-700 font-bold">{metrics.occupancyPercentage}% asistencia</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/30">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">Pendientes por Ingresar</span>
            <div className="flex items-baseline justify-between">
              <strong className="text-3xl font-black text-amber-600">{metrics.totalPending}</strong>
              <span className="text-xs text-amber-700 font-semibold">pases restantes</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm bg-purple-50/30">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block mb-1">Estado de Grupos</span>
            <div className="flex items-center justify-between text-xs mt-1 font-semibold">
              <span className="text-emerald-700">✓ {metrics.completeGroupsCount} compl.</span>
              <span className="text-amber-700">⏳ {metrics.partialGroupsCount} parc.</span>
              <span className="text-slate-500">⚪ {metrics.pendingGroupsCount} pend.</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid: Live Feed (Left) & Table Occupancy (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Recent Activity Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-600" /> Últimos Ingresos (Feed en Vivo)
              </h3>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            </div>

            {recentFeed.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Aún no hay ingresos registrados en puerta. Abre el escáner PWA para iniciar.
              </div>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {recentFeed.map((log) => {
                  const isRejected = log.result_status.includes('REJECTED');

                  return (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border transition text-xs space-y-1 ${
                        isRejected 
                          ? 'bg-red-50/60 border-red-200 text-red-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900">{log.groupName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.entry_timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 text-purple-700 font-semibold">
                          <MapPin className="w-3 h-3" /> {log.tableName}
                        </span>

                        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          isRejected 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isRejected ? 'RECHAZADO' : `+${log.passes_entered} pases (${log.passes_accumulated} acum.)`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tables Occupancy Status Grid */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Grid className="w-5 h-5 text-purple-600" /> Ocupación por Mesa en Tiempo Real
              </h3>
              <Link
                href="/events/evt-102/tables"
                className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1"
              >
                Editar Mesas <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tablesStats.map((stat) => (
                <div key={stat.tableId} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{stat.tableName}</h4>
                    <span className="text-xs font-extrabold text-slate-700">{stat.occupancyRatio}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        stat.occupancyPercentage >= 100 ? 'bg-emerald-500' :
                        stat.occupancyPercentage > 0 ? 'bg-brand-500' :
                        'bg-slate-300'
                      }`}
                      style={{ width: `${stat.occupancyPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Capacidad: {stat.capacity}</span>
                    <span>{stat.occupancyPercentage}% ocupado</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
