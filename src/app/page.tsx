import Link from 'next/link';
import { Calendar, Users, QrCode, Grid, Clock, FileSpreadsheet, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow">
              E
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">EventControl<span className="text-brand-600">.pe</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-slate-700 hover:text-brand-600 transition"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/register" 
              className="text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
            >
              Probar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" /> Plataforma SaaS para Wedding Planners
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Organiza el ingreso de tus invitados, controla tus mesas y conoce en <span className="text-brand-600">tiempo real</span> la asistencia.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Elimina el caos en la recepción de bodas y eventos. Importa tu lista de Excel, genera códigos QR por grupo, asigna mesas y controla el catering sin sorpresas.
          </p>

          {/* Visual Workflow Diagram */}
          <div className="mt-12 bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200/80 max-w-5xl mx-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Flujo Operativo Simple y Directo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
              <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <FileSpreadsheet className="w-7 h-7 text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">1. Excel</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Users className="w-7 h-7 text-blue-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">2. Grupos</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <QrCode className="w-7 h-7 text-indigo-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">3. QR Único</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Grid className="w-7 h-7 text-purple-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">4. Mesas</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Calendar className="w-7 h-7 text-pink-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">5. Check-in</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Clock className="w-7 h-7 text-amber-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">6. Dashboard</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <ShieldCheck className="w-7 h-7 text-emerald-700 mb-2" />
                <span className="text-xs font-bold text-emerald-800">7. Catering</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm border-t border-slate-800">
        <p>© 2026 EventControl SaaS Platform. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
