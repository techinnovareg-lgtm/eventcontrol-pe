'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import EventNavHeader from '@/components/EventNavHeader';
import { 
  Users, CheckCircle2, Clock, Grid, Plus, LogOut, QrCode, 
  MapPin, ShieldAlert, ArrowUpRight, Radio, Activity, PieChart, ShieldCheck, BarChart3, ExternalLink
} from 'lucide-react';
import { calculateDashboardMetrics, getTablesOccupancyStats, getRecentCheckInsFeed } from '@/lib/dashboard-stats';
import { checkInRealtimeChannel } from '@/lib/realtime';

export default function RealtimeDashboardPage() {
  const eventId = 'evt-102';
  const currentWorkspaceId = 'ws-a-1111';

  const [metrics, setMetrics] = useState(() => calculateDashboardMetrics(eventId, currentWorkspaceId));
  const [tablesStats, setTablesStats] = useState(() => getTablesOccupancyStats(eventId));
  const [recentCheckIns, setRecentCheckIns] = useState(() => getRecentCheckInsFeed(eventId));
  const [realtimePulse, setRealtimePulse] = useState(false);

  useEffect(() => {
    const unsubscribeFn = checkInRealtimeChannel.subscribe((payload) => {
      setMetrics(calculateDashboardMetrics(eventId, currentWorkspaceId));
      setTablesStats(getTablesOccupancyStats(eventId));
      setRecentCheckIns(getRecentCheckInsFeed(eventId));
      
      setRealtimePulse(true);
      setTimeout(() => setRealtimePulse(false), 2000);
    });

    return () => {
      if (typeof unsubscribeFn === 'function') {
        unsubscribeFn();
      }
    };
  }, [eventId, currentWorkspaceId]);

  // Calculated donut chart stroke
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (metrics.occupancyPercentage / 100) * circumference;

  // Mock hourly entry breakdown data for visual bar chart
  const hourlyData = [
    { hour: '17:00', count: 12, label: 'Inicio' },
    { hour: '18:00', count: 45, label: 'Coctel' },
    { hour: '19:00', count: 85, label: 'Pico Entrada' },
    { hour: '20:00', count: 68, label: 'Cena' },
    { hour: '21:00', count: 21, label: 'Tardíos' },
  ];
  const maxHourly = Math.max(...hourlyData.map(h => h.count));

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] selection:bg-[#C5A059] selection:text-white flex flex-col">
      <EventNavHeader currentTab="dashboard" eventId={eventId} eventName={metrics.eventName} />

      {/* Main Dashboard Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 w-full">
        
        {/* Title Bar & Realtime Channel Badge */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest">
                Monitoreo en Tiempo Real
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition ${
                realtimePulse 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400 scale-105' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}>
                <Radio className={`w-3 h-3 ${realtimePulse ? 'animate-ping text-emerald-600' : 'text-emerald-600'}`} />
                Canal WebSocket Activo
              </span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] mt-1">{metrics.eventName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Control de ingresos, distribución de mesas y conciliación de catering</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/events/evt-102/qr" className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition">
              Tokens QR
            </Link>
            <Link href="/events/evt-102/tables" className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition">
              Plano Mesas
            </Link>
            <Link href="/events/evt-102/whatsapp" className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition">
              WhatsApp
            </Link>
            <Link href="/events/evt-102/cuts" className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition">
              Catering
            </Link>
            <Link href="/events/evt-102/reports" className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition">
              Reportes PDF
            </Link>
          </div>
        </div>

        {/* METRICS CARDS WITH RICH VISUAL GRAPHICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* VISUAL DONUT GAUGE CHART CARD */}
          <div className="card-luxury p-6 border border-[#C5A059]/30 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-[#B8860B]" /> Asistencia Global
              </h3>
              <span className="text-xs font-extrabold text-[#B8860B] bg-amber-50 px-2.5 py-0.5 rounded-full border border-[#C5A059]/30">
                {metrics.occupancyPercentage}% Ingresado
              </span>
            </div>

            <div className="flex items-center justify-center gap-6 py-2">
              {/* Radial Donut SVG */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F5F2EB"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#C5A059"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-[#1A1A1A] font-serif">{metrics.totalEntered}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">de {metrics.totalAuthorized}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#C5A059]"></span>
                  <span className="text-slate-600">Ingresados:</span>
                  <strong className="font-bold text-[#1A1A1A]">{metrics.totalEntered}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-200"></span>
                  <span className="text-slate-600">Pendientes:</span>
                  <strong className="font-bold text-slate-500">{metrics.totalPending}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL HOURLY ENTRY BAR CHART TIMELINE WIDGET */}
          <div className="card-luxury p-6 border border-[#C5A059]/30 flex flex-col justify-between space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" /> Distribución de Ingresos por Hora (Recepción)
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Pico detectado a las 19:00</span>
            </div>

            {/* Visual Flex Bar Graph */}
            <div className="grid grid-cols-5 gap-4 items-end h-32 pt-4 px-2">
              {hourlyData.map((h, i) => {
                const heightPercent = Math.round((h.count / maxHourly) * 100);
                return (
                  <div key={i} className="flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-bold text-[#B8860B] group-hover:scale-110 transition">{h.count} pers.</span>
                    <div className="w-full bg-slate-100 rounded-t-lg h-24 relative overflow-hidden flex items-end">
                      <div 
                        className="w-full bg-gradient-to-t from-[#B8860B] to-[#C5A059] rounded-t-lg transition-all duration-700"
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 font-mono">{h.hour}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">{h.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* GROUPS STATUS BREAKDOWN & TABLE OCCUPANCY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GROUPS STATUS CARDS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Estado de Grupos de Invitados</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="card-luxury p-4 border-l-4 border-emerald-500 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Completos</span>
                <strong className="text-2xl font-black text-emerald-700">{metrics.completedGroupsCount}</strong>
              </div>

              <div className="card-luxury p-4 border-l-4 border-amber-500 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Parciales</span>
                <strong className="text-2xl font-black text-amber-700">{metrics.partialGroupsCount}</strong>
              </div>

              <div className="card-luxury p-4 border-l-4 border-slate-400 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Pendientes</span>
                <strong className="text-2xl font-black text-slate-600">{metrics.pendingGroupsCount}</strong>
              </div>
            </div>

            {/* REALTIME RECENT CHECK-INS FEED */}
            <div className="card-luxury p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                <span>Actividad en Puerta (Últimos Escaneos)</span>
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recentCheckIns.map((item) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <strong className="font-bold text-slate-900 block">{item.groupName || 'Grupo Invitado'}</strong>
                      <span className="text-[10px] text-slate-500">
                        {item.entry_timestamp ? new Date(item.entry_timestamp).toLocaleTimeString() : 'Reciente'} • Operador {item.operator_user_id || 'Seguridad'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[11px]">
                      +{item.passes_entered} pases
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLES OCCUPANCY VISUAL BREAKDOWN */}
          <div className="card-luxury p-6 border border-[#C5A059]/30 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-4 h-4 text-purple-600" /> Ocupación de Mesas de Gala ({tablesStats.length})
              </h3>
              <Link href="/events/evt-102/tables" className="text-xs text-[#B8860B] hover:underline font-bold">
                Ver Mapa de Mesas →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tablesStats.map((table) => {
                return (
                  <div key={table.tableId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="font-bold text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" /> {table.tableName}
                      </strong>
                      <span className="font-bold text-slate-700">
                        {table.presentPasses} / {table.capacity} pers.
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          table.occupancyPercentage >= 100 ? 'bg-emerald-600' :
                          table.occupancyPercentage > 0 ? 'bg-purple-600' : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.min(100, table.occupancyPercentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* DEVELOPER CREDIT BADGE */}
        <div className="card-luxury p-4 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#C5A059]/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-[#C5A059]/40 bg-white p-1">
              <Image src="/techinnova/logo_TI.png" alt="Tech Innova" fill className="object-contain p-0.5" />
            </div>
            <span>
              Plataforma desarrollada por <strong className="text-[#1A1A1A]">Tech Innova</strong> • Sistema SaaS de Control de Eventos de Gala
            </span>
          </div>

          <a
            href="https://tech-innova.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#B8860B] font-bold hover:underline flex items-center gap-1"
          >
            tech-innova.vercel.app <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>
    </div>
  );
}
