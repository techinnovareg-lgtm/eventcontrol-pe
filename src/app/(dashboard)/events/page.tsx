'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, MapPin, Users, FileSpreadsheet, ArrowLeft, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { getWorkspaceEvents, createEvent } from '@/lib/events';
import { Event, EventStatus } from '@/lib/supabase/types';

export default function EventsPage() {
  const currentWorkspaceId = 'ws-a-1111';
  const [events, setEvents] = useState<Event[]>(getWorkspaceEvents(currentWorkspaceId));
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [eventType, setEventType] = useState('Boda');
  const [eventDate, setEventDate] = useState('2026-11-15');
  const [eventTime, setEventTime] = useState('17:00');
  const [venueName, setVenueName] = useState('Hacienda Mamacona, Lurín');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvt = createEvent({
      workspace_id: currentWorkspaceId,
      name,
      event_type: eventType,
      event_date: eventDate,
      event_time: eventTime,
      venue_name: venueName,
      status: 'PREPARACION',
    });

    setEvents([newEvt, ...events]);
    setShowModal(false);
    setName('');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Crear Evento
          </button>
        </div>

        {/* Page Title */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Eventos Administrados</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestiona la lista de bodas y eventos sociales, importa invitados desde Excel y prepara los controles de ingreso.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    evt.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' :
                    evt.status === 'PREPARACION' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {evt.status}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{evt.event_type}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{evt.name}</h3>

                <div className="space-y-1.5 text-xs text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-600" />
                    <span>{evt.event_date} {evt.event_time && `• ${evt.event_time} hs`}</span>
                  </div>
                  {evt.venue_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>{evt.venue_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4 border-t border-slate-100 text-center">
                <Link
                  href={`/events/${evt.id}/import`}
                  className="py-2 px-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 border border-brand-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </Link>
                <Link
                  href={`/events/${evt.id}/qr`}
                  className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 border border-indigo-200"
                >
                  <Users className="w-3.5 h-3.5" /> QR Tokens
                </Link>
                <Link
                  href={`/events/${evt.id}/tables`}
                  className="py-2 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 border border-purple-200"
                >
                  <MapPin className="w-3.5 h-3.5" /> Mesas
                </Link>
                <Link
                  href={`/events/${evt.id}/whatsapp`}
                  className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 border border-emerald-200"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </Link>
                <Link
                  href={`/events/${evt.id}/reports`}
                  className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5" /> Reportes
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Crear Nuevo Evento</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del Evento
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Boda Sofia & Mateo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                  >
                    <option value="Boda">Boda</option>
                    <option value="Cumpleaños">Cumpleaños / Aniversario</option>
                    <option value="Corporativo">Corporativo</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Lugar / Recepción
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Ej. Casa Hacienda San José"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                >
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
