'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Calendar, MapPin, Users, FileSpreadsheet, ArrowLeft, CheckCircle, Clock, MessageSquare, ArrowRight, BarChart3, Scissors } from 'lucide-react';
import { getWorkspaceEvents, createEvent } from '@/lib/events';
import { Event, EventStatus } from '@/lib/supabase/types';

export default function EventsCrudPage() {
  const currentWorkspaceId = 'ws-a-1111';
  const [events, setEvents] = useState<Event[]>(() => getWorkspaceEvents(currentWorkspaceId));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;

    const newEvt = createEvent({
      workspace_id: currentWorkspaceId,
      name,
      event_type: 'Boda / Gala',
      event_date: date,
      venue_name: location,
      status: 'BORRADOR',
    });

    setEvents([...events, newEvt]);
    setName('');
    setDate('');
    setLocation('');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white">
      {/* Top Luxury Header */}
      <header className="border-b border-[#C5A059]/20 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md border border-[#C5A059]/30 group-hover:scale-105 transition-transform">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#1A1A1A] font-serif">
                EventControl<span className="text-[#C5A059]">.pe</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                Catálogo de Eventos
              </span>
            </div>
          </Link>

          <Link href="/dashboard" className="text-xs text-slate-600 hover:text-[#C5A059] font-bold flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Ir al Dashboard Activo
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Title Bar */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">Catálogo de Bodas y Eventos</span>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">Eventos del Workspace</h1>
            <p className="text-xs text-slate-500">Haz clic en cualquier evento para ingresar a su Dashboard y controlar sus funciones.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="gold-button font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Crear Nuevo Evento
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div key={evt.id} className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col justify-between space-y-4 hover-lift">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    evt.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    evt.status === 'FINALIZADO' ? 'bg-slate-200 text-slate-700' :
                    'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {evt.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {evt.id}</span>
                </div>

                {/* CLICKABLE EVENT TITLE & HEADER */}
                <Link href="/dashboard" className="block group">
                  <h3 className="text-lg font-serif font-bold text-[#1A1A1A] group-hover:text-[#B8860B] transition">
                    {evt.name}
                  </h3>
                  <div className="space-y-1 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span>{evt.event_date}</span>
                    </div>
                    {evt.venue_name && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        <span>{evt.venue_name}</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* PRIMARY ENTER EVENT BUTTON */}
                <Link
                  href="/dashboard"
                  className="w-full py-2.5 gold-button font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <BarChart3 className="w-4 h-4" /> Ingresar al Evento (Dashboard) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Quick Sub-feature Actions Footer */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-3 border-t border-slate-100 text-center text-[11px]">
                <Link
                  href={`/events/${evt.id}/tables`}
                  className="py-1.5 px-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-lg transition flex flex-col items-center justify-center border border-purple-200"
                  title="Plano de Mesas"
                >
                  <MapPin className="w-3.5 h-3.5 mb-0.5" /> Mesas
                </Link>
                <Link
                  href={`/events/${evt.id}/qr`}
                  className="py-1.5 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-lg transition flex flex-col items-center justify-center border border-indigo-200"
                  title="Pases & QR"
                >
                  <Users className="w-3.5 h-3.5 mb-0.5" /> QR
                </Link>
                <Link
                  href={`/events/${evt.id}/whatsapp`}
                  className="py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition flex flex-col items-center justify-center border border-emerald-200"
                  title="WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5 mb-0.5" /> WhatsApp
                </Link>
                <Link
                  href={`/events/${evt.id}/import`}
                  className="py-1.5 px-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg transition flex flex-col items-center justify-center border border-[#C5A059]/30"
                  title="Importar Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mb-0.5" /> Excel
                </Link>
                <Link
                  href={`/events/${evt.id}/reports`}
                  className="py-1.5 px-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition flex flex-col items-center justify-center shadow-sm"
                  title="Reportes"
                >
                  <Clock className="w-3.5 h-3.5 mb-0.5" /> Reportes
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Crear Nuevo Evento</h3>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de la Boda / Evento
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Boda Sofia & Mateo"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha del Evento
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lugar / Local de Recepción
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej. Hacienda Fundo El Carmen, Lurín"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 gold-button font-bold rounded-xl shadow-md"
                >
                  Crear Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
