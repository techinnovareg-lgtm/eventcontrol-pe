import Link from 'next/link';
import { Calendar, Users, QrCode, Plus, Layers, LogOut } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white">
              E
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">AMG Wedding Planners</h1>
              <span className="text-xs text-brand-400 font-medium">Plan STARTER (3/3 Eventos)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/workspace"
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-300 border border-slate-700 transition"
            >
              Rol: <strong className="text-white font-semibold">OWNER</strong> (Ver Workspace)
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestión de Eventos</h2>
            <p className="text-sm text-slate-600">Bienvenido al Panel de Control de EventControl SaaS</p>
          </div>

          <button 
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Crear Nuevo Evento
          </button>
        </div>

        {/* Demo Event Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                ACTIVO
              </span>
              <span className="text-xs text-slate-500">15 de Octubre, 2026</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Boda Ronny & Diana</h3>
            <p className="text-xs text-slate-600 mb-4">Hacienda Fundo El Carmen, Lurín</p>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center mb-4 border border-slate-100">
              <div>
                <span className="text-xs text-slate-500 block">Pases</span>
                <strong className="text-sm font-bold text-slate-900">250</strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Ingresados</span>
                <strong className="text-sm font-bold text-brand-600">183</strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Pendientes</span>
                <strong className="text-sm font-bold text-amber-600">67</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition text-center">
                Ver Panel en Vivo
              </button>
              <button className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
                Mesas
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
