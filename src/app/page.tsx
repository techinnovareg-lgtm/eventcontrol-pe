import Link from 'next/link';
import { 
  Calendar, Users, QrCode, Grid, Clock, FileSpreadsheet, 
  ShieldCheck, CheckCircle2, ArrowRight, Utensils, HelpCircle, Sparkles
} from 'lucide-react';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';

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

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#beneficios" className="hover:text-brand-600 transition">Beneficios</a>
            <a href="#flujo" className="hover:text-brand-600 transition">Flujo Operativo</a>
            <a href="#planes" className="hover:text-brand-600 transition">Planes y Precios</a>
            <a href="#faq" className="hover:text-brand-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-slate-700 hover:text-brand-600 transition"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/register" 
              className="text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition shadow-sm"
            >
              Probar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 space-y-20 pb-20">
        {/* HERO SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4 text-brand-600" /> Plataforma SaaS para Wedding Planners
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Organiza el ingreso de tus invitados, controla tus mesas y conoce en <span className="text-brand-600">tiempo real</span> la asistencia.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Elimina el caos en la recepción de bodas y eventos. Importa tu lista de Excel, genera códigos QR por grupo, asigna mesas y controla el catering sin sorpresas.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition shadow-lg flex items-center gap-2"
            >
              Comenzar Prueba Gratuita <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 transition"
            >
              Ver Planes y Tarifas
            </Link>
          </div>

          {/* VISUAL WORKFLOW DIAGRAM */}
          <div id="flujo" className="mt-16 bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/80 max-w-5xl mx-auto text-center">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6">Flujo Operativo Simple y Directo (Cero Apps para el Invitado)</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <FileSpreadsheet className="w-7 h-7 text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">1. Excel</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Users className="w-7 h-7 text-blue-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">2. Grupos</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <QrCode className="w-7 h-7 text-indigo-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">3. QR Único</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Grid className="w-7 h-7 text-purple-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">4. Mesas</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Calendar className="w-7 h-7 text-pink-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">5. Check-in</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Clock className="w-7 h-7 text-amber-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">6. Dashboard</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <Utensils className="w-7 h-7 text-emerald-700 mb-2" />
                <span className="text-xs font-bold text-emerald-900">7. Catering</span>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section id="beneficios" className="py-12 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">¿Por qué EventControl?</span>
              <h2 className="text-3xl font-bold text-slate-900">Diseñado para la operación real de un evento social</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900">Ingreso Parcial y Control de Sobrecupos</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permite que una familia de 5 personas ingrese en 2 o 3 tandas distintas usando el mismo QR, garantizando que jamás ingresen más personas de las autorizadas.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900">Cortes Inmutables y Control de Catering</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Captura una fotografía congelada al momento de servir la comida (1 persona presente = 1 plato) y contabiliza automáticamente las personas que llegan tarde.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900">PWA Offline-First en Smartphones</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  El personal de seguridad escanea desde su teléfono inteligente. Si la conexión a internet falla en puerta, el check-in continúa funcionando en caché local.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PREVIEW SECTION */}
        <section id="planes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Planes y Precios</span>
            <h2 className="text-3xl font-bold text-slate-900">Tarifas accesibles para todo tamaño de negocio</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {(Object.keys(PLAN_LIMITS) as PlanCode[]).map((code) => {
              const plan = PLAN_LIMITS[code];
              return (
                <div key={code} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <div className="my-3">
                      <span className="text-3xl font-extrabold text-slate-900">S/{plan.monthlyPricePEN}</span>
                      <span className="text-slate-500 text-xs font-medium"> / mes</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/pricing" className="mt-6 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center block">
                    Ver Plan
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Preguntas Frecuentes</span>
            <h2 className="text-2xl font-bold text-slate-900">Resuelve tus dudas sobre el servicio</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-1">¿El invitado necesita descargar alguna app?</h4>
              <p className="text-slate-600">No. El invitado únicamente presenta la imagen de su código QR descargada o recibida por WhatsApp en su teléfono.</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-1">¿Qué sucede si se corta la conexión a internet en el local?</h4>
              <p className="text-slate-600">El módulo de escaneo de seguridad en smartphone opera en modo Offline-First. Registra los accesos localmente y sincroniza de forma transparente en cuanto se restablece la señal.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-xs border-t border-slate-800">
        <p>© 2026 EventControl SaaS Platform. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
