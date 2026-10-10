'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, Calendar, MapPin, Users, FileSpreadsheet, ArrowLeft, 
  CheckCircle, Clock, MessageSquare, ArrowRight, BarChart3, 
  Scissors, Edit3, Home, LogOut, Trash2, ExternalLink
} from 'lucide-react';
import { getWorkspaceEvents, getWorkspaceEventsAsync, createEvent, createEventAsync, updateEvent, updateEventAsync, deleteEvent, autoSyncEventsToServer, getLastActiveEventId, setLastActiveEventId } from '@/lib/events';
import { Event, EventStatus } from '@/lib/supabase/types';
import { getAccountForSession, getActiveSession, getAdminAccountByEmailAsync, setActiveSession } from '@/lib/superadmin-store';

export default function EventsCrudPage() {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws-a-1111');
  const [events, setEvents] = useState<Event[]>([]);
  const [userName, setUserName] = useState<string>('Cliente VIP');
  const [userEmail, setUserEmail] = useState<string>('cliente@empresa.pe');
  const [userInitial, setUserInitial] = useState<string>('C');
  const [lastActiveId, setLastActiveId] = useState<string>('');

  useEffect(() => {
    const session = getActiveSession();
    if (session?.user?.role === 'OPERATOR') {
      const scanRoute = session.user.eventId ? `/scan?event=${session.user.eventId}` : '/scan';
      window.location.href = scanRoute;
      return;
    }
    if (session?.user?.role === 'COORDINADOR' && session.user.eventId) {
      window.location.href = `/dashboard?eventId=${session.user.eventId}`;
      return;
    }
    const contractAccount = getAccountForSession();
    let wsId = session?.user?.workspaceId || contractAccount?.workspaceId || 'ws-a-1111';
    const name = session?.user?.name || contractAccount?.adminName || contractAccount?.companyName || 'Cliente VIP';
    const email = session?.user?.email || contractAccount?.contactEmail || 'cliente@empresa.pe';

    if (email.toLowerCase() === 'appqsop@gmail.com' && wsId !== 'ws-weddingsco-appqsop') {
      wsId = 'ws-weddingsco-appqsop';
      if (session && session.user) {
        session.user.workspaceId = wsId;
        setActiveSession(session);
      }
    }

    setCurrentWorkspaceId(wsId);
    setUserName(name);
    setUserEmail(email);
    setUserInitial(name ? name.charAt(0).toUpperCase() : 'C');
    setLastActiveId(getLastActiveEventId(wsId) || '');

    // Auto-sync any existing local events immediately on mount
    autoSyncEventsToServer(wsId);

    const initialLocal = getWorkspaceEvents(wsId);
    if (initialLocal.length > 0) {
      setEvents(initialLocal);
    }

    if (email && email !== 'cliente@empresa.pe') {
      getAdminAccountByEmailAsync(email).then(acc => {
        if (acc && acc.workspaceId && acc.workspaceId !== wsId) {
          wsId = acc.workspaceId;
          setCurrentWorkspaceId(acc.workspaceId);
          if (session && session.user) {
            session.user.workspaceId = acc.workspaceId;
            setActiveSession(session);
          }
          autoSyncEventsToServer(acc.workspaceId);
          getWorkspaceEventsAsync(acc.workspaceId, email).then(onlineEvts => {
            if (Array.isArray(onlineEvts)) setEvents(onlineEvts);
          });
        }
      });
    }

    const fetchEvents = () => {
      const activeWs = session?.user?.workspaceId || wsId;
      getWorkspaceEventsAsync(activeWs, email).then(onlineEvts => {
        if (Array.isArray(onlineEvts) && onlineEvts.length > 0) {
          setEvents(onlineEvts);
        } else if (Array.isArray(onlineEvts) && onlineEvts.length === 0) {
          const fallbackLocal = getWorkspaceEvents(activeWs);
          setEvents(fallbackLocal.length > 0 ? fallbackLocal : onlineEvts);
        }
      });
    };

    fetchEvents();
    const timer = setInterval(fetchEvents, 1500);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('create') === 'true' || urlParams.get('new') === 'true') {
        setIsCreateModalOpen(true);
      }
    }

    return () => clearInterval(timer);
  }, []);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Edit Modal State
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGoogleMapsUrl, setEditGoogleMapsUrl] = useState('');
  const [editStatus, setEditStatus] = useState<EventStatus>('ACTIVO');

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;

    const newEvt = await createEventAsync({
      workspace_id: currentWorkspaceId,
      name,
      event_type: 'Boda / Gala',
      event_date: date,
      venue_name: location,
      venue_address: address,
      google_maps_url: googleMapsUrl,
      status: 'BORRADOR',
    });

    if (newEvt && newEvt.id) {
      setLastActiveEventId(newEvt.id, currentWorkspaceId);
      setLastActiveId(newEvt.id);
    }

    const updatedEvents = await getWorkspaceEventsAsync(currentWorkspaceId);
    setEvents(updatedEvents);
    setName('');
    setDate('');
    setLocation('');
    setAddress('');
    setGoogleMapsUrl('');
    setIsCreateModalOpen(false);
  };

  const handleOpenEditModal = (evt: Event) => {
    setEditingEvent(evt);
    setEditName(evt.name);
    setEditDate(evt.event_date);
    setEditLocation(evt.venue_name || '');
    setEditAddress(evt.venue_address || (evt as any).address || '');
    setEditGoogleMapsUrl(evt.google_maps_url || (evt as any).maps_url || '');
    setEditStatus(evt.status);
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editName || !editDate) return;

    await updateEventAsync(editingEvent.id, {
      name: editName,
      event_date: editDate,
      venue_name: editLocation,
      venue_address: editAddress,
      google_maps_url: editGoogleMapsUrl,
      status: editStatus,
    }, currentWorkspaceId);

    const updated = await getWorkspaceEventsAsync(currentWorkspaceId);
    setEvents(updated);
    setEditingEvent(null);
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (confirm(`¿Estás seguro de eliminar el evento "${eventName}"? Esta acción no se puede deshacer.`)) {
      deleteEvent(eventId);
      const updated = await getWorkspaceEventsAsync(currentWorkspaceId);
      setEvents(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white">
      {/* Top Luxury Header */}
      <header className="border-b border-[#C5A059]/40 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Workspace */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md border border-[#C5A059]/40 group-hover:scale-105 transition-transform bg-white p-0.5">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover rounded-lg"
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

          {/* User Profile Badge & Navigation Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* USER PROFILE CARD */}
            <Link 
              href="/workspace"
              className="flex items-center gap-2 bg-[#FAF8F5] hover:bg-amber-50/80 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 transition group"
              title="Ver Mi Perfil / Cuenta"
            >
              <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#B8860B] text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-amber-200 shrink-0">
                {userInitial}
              </div>
              <div className="text-left hidden md:block leading-tight pr-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-[#B8860B] transition block max-w-[170px] truncate">
                  {userName}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block max-w-[170px] truncate">
                  {userEmail}
                </span>
              </div>
            </Link>

            <Link 
              href="/" 
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-300 hidden sm:flex"
              title="Volver a la Página Principal Web"
            >
              <Home className="w-3.5 h-3.5 text-slate-600" /> Página Principal
            </Link>

            <Link 
              href={(() => {
                const target = (lastActiveId && events.find(e => e.id === lastActiveId)) || events[0];
                return target ? `/dashboard?eventId=${encodeURIComponent(target.id)}` : '/dashboard';
              })()} 
              className="text-xs gold-button font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              title="Ir al Dashboard Activo"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-100" /> Dashboard Activo
            </Link>

            <Link 
              href="/login" 
              className="p-2 text-slate-400 hover:text-red-600 transition" 
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Title Bar */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">Catálogo de Bodas y Eventos</span>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">Gestión de Eventos del Workspace</h1>
            <p className="text-xs text-slate-500">Administra, edita e ingresa a cualquier evento para controlar sus asistencias y mesas.</p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="gold-button font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Crear Nuevo Evento
          </button>
        </div>

        {/* Events Grid or Empty State */}
        {events.length === 0 ? (
          <div className="card-luxury p-10 text-center space-y-5 border border-[#C5A059]/40 shadow-lg max-w-xl mx-auto my-12 bg-white">
            <div className="w-16 h-16 bg-amber-50 text-[#B8860B] rounded-2xl flex items-center justify-center mx-auto border border-[#C5A059]/40 shadow-sm">
              <Calendar className="w-8 h-8 text-[#B8860B]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">¡Bienvenido a tu Catálogo de Eventos!</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                Actualmente no tienes ningún evento registrado en tu cuenta. Presiona el botón a continuación para crear tu primer evento y comenzar a gestionar asistencias, invitaciones QR y mapas de mesas.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="gold-button font-bold text-xs px-6 py-3 rounded-xl transition shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Crear Mi Primer Evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const isEventActive = evt.id === lastActiveId;
              const handleSelectEvent = () => {
                setLastActiveEventId(evt.id, currentWorkspaceId);
                setLastActiveId(evt.id);
              };

              return (
                <div 
                  key={evt.id} 
                  className={`card-luxury p-6 border shadow-md flex flex-col justify-between space-y-4 hover-lift transition-all relative ${
                    isEventActive 
                      ? 'border-[#B8860B] ring-2 ring-[#C5A059]/40 bg-gradient-to-b from-amber-50/20 to-white' 
                      : 'border-[#C5A059]/30 hover:border-[#C5A059]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Row: Status Badge & Edit Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          evt.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          evt.status === 'FINALIZADO' ? 'bg-slate-200 text-slate-700' :
                          'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {evt.status}
                        </span>
                        {isEventActive && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#B8860B] text-white shadow-xs">
                            Activo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(evt)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-[#B8860B] rounded-lg border border-[#C5A059]/30 transition"
                          title="Editar Propiedades del Evento"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id, evt.name)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition"
                          title="Eliminar Evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* CLICKABLE EVENT TITLE & HEADER */}
                    <Link 
                      href={`/dashboard?eventId=${evt.id}`} 
                      onClick={handleSelectEvent}
                      className="block group"
                    >
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
                            <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="truncate font-semibold">{evt.venue_name}</span>
                          </div>
                        )}
                        {evt.venue_address && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="w-3.5 text-center text-xs shrink-0">📍</span>
                            <span className="truncate">{evt.venue_address}</span>
                          </div>
                        )}
                        {evt.google_maps_url && (
                          <div className="pt-1">
                            <a
                              href={evt.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 transition"
                            >
                              <MapPin className="w-3 h-3 text-rose-600" />
                              Ver ubicación en Google Maps
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* PRIMARY ENTER EVENT BUTTON */}
                    <Link
                      href={`/dashboard?eventId=${evt.id}`}
                      onClick={handleSelectEvent}
                      className="w-full py-2.5 gold-button font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                    >
                      <BarChart3 className="w-4 h-4" /> Ingresar al Evento (Dashboard) <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Quick Sub-feature Actions Footer */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-3 border-t border-slate-100 text-center text-[11px]">
                    <Link
                      href={`/events/${evt.id}/tables`}
                      onClick={handleSelectEvent}
                      className="py-1.5 px-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-lg transition flex flex-col items-center justify-center border border-purple-200"
                      title="Plano de Mesas"
                    >
                      <MapPin className="w-3.5 h-3.5 mb-0.5" /> Mesas
                    </Link>
                    <Link
                      href={`/events/${evt.id}/qr`}
                      onClick={handleSelectEvent}
                      className="py-1.5 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-lg transition flex flex-col items-center justify-center border border-indigo-200"
                      title="Pases & QR"
                    >
                      <Users className="w-3.5 h-3.5 mb-0.5" /> QR
                    </Link>
                    <Link
                      href={`/events/${evt.id}/whatsapp`}
                      onClick={handleSelectEvent}
                      className="py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition flex flex-col items-center justify-center border border-emerald-200"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mb-0.5" /> WhatsApp
                    </Link>
                    <Link
                      href={`/events/${evt.id}/import`}
                      onClick={handleSelectEvent}
                      className="py-1.5 px-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg transition flex flex-col items-center justify-center border border-[#C5A059]/30"
                      title="Importar Excel"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 mb-0.5" /> Excel
                    </Link>
                    <Link
                      href={`/events/${evt.id}/reports`}
                      onClick={handleSelectEvent}
                      className="py-1.5 px-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition flex flex-col items-center justify-center shadow-sm"
                      title="Reportes"
                    >
                      <Clock className="w-3.5 h-3.5 mb-0.5" /> Reportes
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE EVENT MODAL */}
      {isCreateModalOpen && (
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

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección del Local / Salón
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Av. Panamericana Sur Km 30, Lurín"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Ubicación en Google Maps / Waze (Enlace URL)
                  </label>
                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">Recomendado</span>
                </div>
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="Ej. https://maps.app.goo.gl/..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Este enlace se integrará en el botón <strong>&quot;¿Cómo llegar al salón? Ver en Google Maps&quot;</strong> del pase digital QR enviado por WhatsApp a los invitados.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border border-[#C5A059]/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Editar Evento</h3>
              <span className="text-[10px] text-slate-400 font-mono">ID: {editingEvent.id}</span>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de la Boda / Evento
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lugar / Local de Recepción
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Ej. Hacienda Fundo El Carmen"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección del Local / Salón
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Ej. Av. Panamericana Sur Km 30, Lurín"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Ubicación en Google Maps / Waze (Enlace URL)
                  </label>
                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">Recomendado</span>
                </div>
                <input
                  type="url"
                  value={editGoogleMapsUrl}
                  onChange={(e) => setEditGoogleMapsUrl(e.target.value)}
                  placeholder="Ej. https://maps.app.goo.gl/..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Este enlace se integrará en el botón <strong>&quot;¿Cómo llegar al salón? Ver en Google Maps&quot;</strong> del pase digital QR enviado por WhatsApp a los invitados.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Estado Operativo del Evento
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as EventStatus)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                >
                  <option value="ACTIVO">ACTIVO (En progreso)</option>
                  <option value="BORRADOR">BORRADOR (En planificación)</option>
                  <option value="FINALIZADO">FINALIZADO (Concluido)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 gold-button font-bold rounded-xl shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
