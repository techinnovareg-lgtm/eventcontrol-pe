'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  BarChart3, MapPin, QrCode, MessageSquare, FileSpreadsheet, 
  Clock, Scissors, ShieldCheck, ArrowLeft, LogOut, LayoutGrid, Radio, AlertTriangle, Sparkles, Calendar
} from 'lucide-react';
import { calculateRemainingDays, getAccountForSession } from '@/lib/superadmin-store';

interface EventNavHeaderProps {
  currentTab: 'dashboard' | 'tables' | 'qr' | 'whatsapp' | 'import' | 'reports' | 'cuts';
  eventId?: string;
  eventName?: string;
}

export default function EventNavHeader({
  currentTab,
  eventId = 'evt-102',
  eventName = 'Cumpleaños Tavo 60 Años',
}: EventNavHeaderProps) {

  // Dynamic contract expiration check from active session account
  const contractAccount = getAccountForSession();
  const remainingDays = calculateRemainingDays(contractAccount.contractEndDate);
  const isExpiringSoon = remainingDays <= 7;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
    { id: 'tables', label: 'Plano de Mesas', icon: MapPin, href: `/events/${eventId}/tables` },
    { id: 'qr', label: 'Pases & QR', icon: QrCode, href: `/events/${eventId}/qr` },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, href: `/events/${eventId}/whatsapp` },
    { id: 'import', label: 'Importar Excel', icon: FileSpreadsheet, href: `/events/${eventId}/import` },
    { id: 'reports', label: 'Reportes', icon: Clock, href: `/events/${eventId}/reports` },
    { id: 'cuts', label: 'Cortes Catering', icon: Scissors, href: `/events/${eventId}/cuts` },
  ];

  return (
    <header className="border-b border-[#C5A059]/30 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm select-none">
      
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

      {/* Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b border-slate-100">
        
        {/* Brand Logo & Active Event Breadcrumb / Context Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-[#C5A059]/30 group-hover:scale-105 transition-transform">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="hidden xs:block">
              <span className="text-lg font-serif font-bold text-[#1A1A1A]">
                EventControl<span className="text-[#C5A059]">.pe</span>
              </span>
            </div>
          </Link>

          {/* ORGANIC ACTIVE EVENT BREADCRUMB BADGE (PRO PLATFORM STANDARD) */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200 min-w-0">
            <span className="text-slate-300 text-sm hidden sm:inline">/</span>
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#C5A059]/40 shadow-2xs min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
              <span className="text-xs font-serif font-bold text-[#1A1A1A] truncate max-w-[180px] sm:max-w-[280px] md:max-w-[380px]">
                {eventName}
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 hidden md:inline shrink-0">
                ACTIVO
              </span>
            </div>
          </div>
        </div>

        {/* Global Nav Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/events"
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-slate-300 hidden md:flex"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-600" /> Todos los Eventos
          </Link>

          <Link
            href="/workspace"
            className="text-xs bg-amber-50 hover:bg-amber-100 text-[#B8860B] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-[#C5A059]/40"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#B8860B]" /> Mi Cuenta
          </Link>

          <Link
            href="/scan"
            className="text-xs gold-button font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-100" /> Escáner PWA
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Header Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-2" aria-label="Tabs de Evento">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-white shadow-md'
                    : 'text-slate-600 hover:text-[#B8860B] hover:bg-amber-50/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
