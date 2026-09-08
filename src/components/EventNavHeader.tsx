'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  BarChart3, MapPin, QrCode, MessageSquare, FileSpreadsheet, 
  Clock, Scissors, ShieldCheck, ArrowLeft, LogOut, LayoutGrid, Radio, AlertTriangle, Sparkles, Calendar, User, Users
} from 'lucide-react';
import { calculateRemainingDays, getAccountForSession, getActiveSession } from '@/lib/superadmin-store';

interface EventNavHeaderProps {
  currentTab: 'dashboard' | 'import' | 'tables' | 'qr' | 'whatsapp' | 'cuts' | 'reports' | 'team' | 'scan';
  eventId?: string;
  eventName?: string;
}

export default function EventNavHeader({
  currentTab,
  eventId = 'evt-102',
  eventName = 'Evento Activo',
}: EventNavHeaderProps) {

  const safeEventId = (eventId && eventId.trim() !== '' && eventId !== 'undefined' && eventId !== 'null') ? eventId : 'evt-102';

  // Dynamic contract account & active session check
  const contractAccount = getAccountForSession();
  const session = getActiveSession();
  const remainingDays = calculateRemainingDays(contractAccount.contractEndDate);
  const isExpiringSoon = remainingDays <= 7;

  // Active user name and email resolution
  const userName = session?.user?.name || contractAccount.adminName || contractAccount.companyName;
  const userEmail = session?.user?.email || contractAccount.contactEmail;
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'A';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: `/dashboard?eventId=${safeEventId}` },
    { id: 'import', label: 'Importar Excel', icon: FileSpreadsheet, href: `/events/${safeEventId}/import` },
    { id: 'tables', label: 'Plano de Mesas', icon: MapPin, href: `/events/${safeEventId}/tables` },
    { id: 'qr', label: 'Pases & QR', icon: QrCode, href: `/events/${safeEventId}/qr` },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, href: `/events/${safeEventId}/whatsapp` },
    { id: 'cuts', label: 'Cortes Catering', icon: Scissors, href: `/events/${safeEventId}/cuts` },
    { id: 'reports', label: 'Reportes', icon: Clock, href: `/events/${safeEventId}/reports` },
    { id: 'team', label: 'Equipo del Evento', icon: Users, href: `/events/${safeEventId}/team` },
    { id: 'scan', label: 'Escáner PWA', icon: QrCode, href: `/scan` },
  ];

  return (
    <header className="border-b border-[#C5A059]/40 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm select-none">
      
      {/* 1-WEEK EXPIRATION WARNING ALERT BANNER */}
      {isExpiringSoon && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 max-w-7xl mx-auto">
            <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
            <span>
              <strong>¡ATENCIÓN!</strong> Tu plan contratado vence en <span className="underline font-black">{remainingDays} días</span>. Contacta a tu asesor para extender la suscripción y evitar la suspensión automática del servicio.
            </span>
          </div>
          <Link href="/workspace" className="underline hover:text-white font-extrabold shrink-0 ml-4">
            Ver Mi Cuenta
          </Link>
        </div>
      )}

      {/* Top Navbar Row (Cleaned Top Row with Profile, Catálogo and Salir) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b border-slate-100/80 gap-3">
        
        {/* Brand Logo & Active Event Breadcrumb / Context Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md border border-[#C5A059]/40 group-hover:scale-105 transition-transform bg-white p-0.5">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover rounded-lg"
              />
            </div>
            <div className="hidden xs:block">
              <span className="text-xl font-serif font-bold text-[#1A1A1A]">
                EventControl<span className="text-[#C5A059]">.pe</span>
              </span>
            </div>
          </Link>

          {/* ORGANIC ACTIVE EVENT BREADCRUMB BADGE (HOMOGENIZED h-11 HEIGHT) */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200 min-w-0">
            <span className="text-slate-300 text-sm hidden sm:inline">/</span>
            <div className="flex items-center gap-2 bg-[#FAF8F5] px-3.5 h-11 rounded-xl border border-[#C5A059]/40 shadow-2xs min-w-0">
              <Sparkles className="w-4 h-4 text-[#B8860B] shrink-0" />
              <span className="text-xs font-serif font-bold text-[#1A1A1A] truncate max-w-[150px] sm:max-w-[240px] md:max-w-[320px]">
                {eventName}
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hidden lg:inline shrink-0 uppercase">
                ACTIVO
              </span>
            </div>
          </div>
        </div>

        {/* PERFECTLY HOMOGENIZED RIGHT SIDE ACTIONS (USER PROFILE, CATÁLOGO & SALIR) */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* 1. USER PROFILE CARD */}
          <Link 
            href="/workspace"
            className="h-11 px-3.5 flex items-center gap-2.5 bg-[#FAF8F5] hover:bg-amber-50/80 rounded-xl border border-[#C5A059]/40 transition group shadow-2xs"
            title="Ver Mi Perfil / Cuenta"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#B8860B] text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-amber-200 shrink-0">
              {userInitial}
            </div>
            <div className="text-left hidden md:block leading-tight pr-1">
              <span className="text-xs font-bold text-slate-900 group-hover:text-[#B8860B] transition block max-w-[160px] truncate">
                {userName}
              </span>
              <span className="text-[9px] text-slate-500 font-mono block max-w-[160px] truncate">
                {userEmail}
              </span>
            </div>
          </Link>

          {/* 2. CATÁLOGO BUTTON */}
          <Link
            href="/events"
            className="h-11 px-3.5 bg-white hover:bg-amber-50/50 text-slate-800 font-serif font-bold text-xs rounded-xl border border-[#C5A059]/40 transition flex items-center gap-2 shadow-2xs hidden sm:flex"
            title="Catálogo de Eventos"
          >
            <LayoutGrid className="w-4 h-4 text-[#B8860B]" /> <span>Catálogo</span>
          </Link>

          {/* 3. CERRAR SESIÓN BUTTON */}
          <Link
            href="/login"
            className="h-11 px-3.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 hover:border-red-300 font-bold text-xs rounded-xl border border-slate-300/80 transition flex items-center gap-1.5 shadow-2xs"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4 text-slate-500 hover:text-red-600" />
            <span className="hidden xs:inline">Salir</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Header Tabs (Including Escáner PWA on the Event Submenu Row) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-1.5" aria-label="Tabs de Evento">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            const isScanTab = tab.id === 'scan';

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-white shadow-sm border border-amber-300/40 font-serif'
                    : isScanTab
                    ? 'bg-gradient-to-r from-[#DBBB6E] via-[#D4AF37] to-[#B8860B] text-white shadow-2xs hover:brightness-110 font-serif border border-amber-200/60 ml-2'
                    : 'text-slate-600 hover:text-[#B8860B] hover:bg-amber-50/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive || isScanTab ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
