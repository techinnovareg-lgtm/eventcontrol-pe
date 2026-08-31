import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, Users, QrCode, Grid, Clock, FileSpreadsheet, 
  ShieldCheck, CheckCircle2, ArrowRight, Utensils, HelpCircle, Sparkles, ExternalLink, Video
} from 'lucide-react';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Header with Glassmorphism */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Trademark Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-emerald-900/30 border border-emerald-500/30 group-hover:scale-105 transition-transform">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                EventControl<span className="text-emerald-400">.pe</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
                SaaS Control de Eventos
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <a href="#beneficios" className="hover:text-emerald-400 transition">Beneficios</a>
            <a href="#flujo" className="hover:text-emerald-400 transition">Flujo Operativo</a>
            <a href="#planes" className="hover:text-emerald-400 transition">Planes</a>
            <a href="#techinnova" className="hover:text-emerald-400 transition">Tech Innova</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-xs font-bold text-slate-300 hover:text-white transition px-3 py-2"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/login" 
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/80 flex items-center gap-1.5 glow-emerald"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" /> Acceso a Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 space-y-24 pb-20">
        
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8 animate-fade-in-up">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold uppercase tracking-widest shadow-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Plataforma SaaS de Alta Precisión para Wedding Planners
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-5xl mx-auto leading-tight">
            El Estándar de Excelencia en Recepción de <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Bodas y Eventos</span>.
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            Elimina el caos en puerta. Importa tu lista de invitados desde Excel, emite códigos QR únicos por grupo, organiza tus mesas de gala y controla el catering en tiempo real sin sorpresas.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl transition shadow-2xl shadow-emerald-900/60 flex items-center justify-center gap-2 glow-emerald"
            >
              <Sparkles className="w-5 h-5 text-emerald-200" /> Acceder a Demo de Prueba <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-extrabold text-sm rounded-2xl border border-slate-800 transition"
            >
              Ver Planes (Starter S/29 • Pro S/59 • Business S/99)
            </Link>
          </div>

          {/* 3D ISOMETRIC HERO BANNER DISPLAY */}
          <div className="pt-8 max-w-6xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl shadow-emerald-950/40 hover-lift">
              <Image 
                src="/banner-hero-eventcontrol.jpg" 
                alt="EventControl SaaS 3D Hero Banner" 
                width={1280} 
                height={720} 
                className="w-full h-auto object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
            </div>
          </div>

          {/* VISUAL WORKFLOW DIAGRAM */}
          <div id="flujo" className="pt-12 max-w-6xl mx-auto">
            <div className="glass-card-dark p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-6">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest block">
                Flujo Operativo Simple y Directo (Cero Apps para el Invitado)
              </span>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover-lift">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">1. Excel</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover-lift">
                  <Users className="w-8 h-8 text-indigo-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">2. Grupos</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover-lift">
                  <QrCode className="w-8 h-8 text-purple-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">3. QR Único</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover-lift">
                  <Grid className="w-8 h-8 text-pink-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">4. Mesas</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover-lift">
                  <Calendar className="w-8 h-8 text-amber-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">5. Check-in</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover-lift">
                  <Clock className="w-8 h-8 text-teal-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">6. Dashboard</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 hover-lift glow-emerald">
                  <Utensils className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-emerald-300">7. Catering</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section id="beneficios" className="py-16 bg-slate-900/50 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">¿Por qué EventControl?</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Diseñado para la operación real de un evento social de gala</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card-dark p-8 rounded-3xl border border-slate-800 space-y-4 hover-lift">
                <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-800 flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="text-xl font-bold text-white">Ingreso Parcial y Control de Sobrecupos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Permite que una familia de 5 personas ingrese en 2 o 3 tandas distintas usando el mismo QR, garantizando que jamás ingresen más personas de las autorizadas.
                </p>
              </div>

              <div className="glass-card-dark p-8 rounded-3xl border border-slate-800 space-y-4 hover-lift">
                <div className="w-12 h-12 bg-amber-950 text-amber-400 rounded-2xl border border-amber-800 flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-white">Cortes Inmutables y Control de Catering</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Captura una fotografía congelada al momento de servir la comida (1 persona presente = 1 plato) y contabiliza automáticamente las personas que llegan tarde.
                </p>
              </div>

              <div className="glass-card-dark p-8 rounded-3xl border border-slate-800 space-y-4 hover-lift">
                <div className="w-12 h-12 bg-purple-950 text-purple-400 rounded-2xl border border-purple-800 flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-white">PWA Offline-First en Smartphones</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El personal de seguridad escanea desde su teléfono inteligente. Si la conexión a internet falla en puerta, el check-in continúa funcionando en caché local.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PREVIEW SECTION */}
        <section id="planes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Planes y Precios Oficiales</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Tarifas accesibles para todo tamaño de negocio</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {(Object.keys(PLAN_LIMITS) as PlanCode[]).map((code) => {
              const plan = PLAN_LIMITS[code];
              const isRecommended = code === 'PROFESSIONAL';

              return (
                <div 
                  key={code} 
                  className={`glass-card-dark rounded-3xl p-8 border transition flex flex-col justify-between relative hover-lift ${
                    isRecommended 
                      ? 'border-emerald-500 shadow-2xl shadow-emerald-950/60 ring-2 ring-emerald-500/30' 
                      : 'border-slate-800 shadow-xl'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-extrabold text-[11px] uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                      Recomendado
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-400 min-h-[32px] mb-3">{plan.profile}</p>

                    <div className="my-4">
                      <span className="text-4xl font-black text-white">S/{plan.monthlyPricePEN}</span>
                      <span className="text-slate-400 text-xs font-medium"> / mes</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                      {plan.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/pricing" className={`mt-8 w-full py-3 font-bold text-xs rounded-xl text-center block transition shadow-md ${
                    isRecommended 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}>
                    Ver Plan {plan.name}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* DEVELOPER BRAND BRANDING SECTION: TECH INNOVA */}
        <section id="techinnova" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card-dark rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 p-2">
                  <Image 
                    src="/techinnova/logo_TI.png" 
                    alt="Tech Innova Logo" 
                    fill 
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest block">
                    Desarrollado con Excelencia por
                  </span>
                  <h3 className="text-2xl font-black text-white">Tech Innova</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Firma Especializada en Ingeniería de Software, Inteligencia Artificial y Soluciones SaaS.
                  </p>
                </div>
              </div>

              <a
                href="https://tech-innova.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg flex items-center gap-2 shrink-0"
              >
                Visitar Sitio Web Oficial <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Social Media & Tech Innova Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <a
                href="https://tech-innova.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-indigo-500 transition flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">
                  🌐
                </div>
                <div>
                  <span className="font-bold text-white block group-hover:text-indigo-400 transition">Portal Web Oficial</span>
                  <span className="text-[11px] text-slate-400 font-mono">tech-innova.vercel.app</span>
                </div>
              </a>

              <a
                href="https://www.tiktok.com/@techinnova1"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-pink-500 transition flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-950 text-pink-400 flex items-center justify-center font-bold">
                  🎵
                </div>
                <div>
                  <span className="font-bold text-white block group-hover:text-pink-400 transition">TikTok Oficial</span>
                  <span className="text-[11px] text-slate-400 font-mono">@techinnova1</span>
                </div>
              </a>

              <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 opacity-60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-950 text-red-400 flex items-center justify-center font-bold">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Canal de YouTube</span>
                  <span className="text-[11px] text-slate-400 italic">Próximamente</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-10 text-xs border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 relative rounded-lg overflow-hidden border border-emerald-500/30">
              <Image src="/logo-eventcontrol.jpg" alt="EventControl" fill className="object-cover" />
            </div>
            <span className="font-bold text-slate-300">EventControl.pe © 2026</span>
          </div>

          <div className="text-center sm:text-right text-slate-400">
            Desarrollado con excelencia por{' '}
            <a 
              href="https://tech-innova.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-400 font-bold hover:underline"
            >
              Tech Innova
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
