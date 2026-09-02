import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, Users, QrCode, Grid, Clock, FileSpreadsheet, 
  ShieldCheck, CheckCircle2, ArrowRight, Utensils, HelpCircle, Sparkles, ExternalLink, Video
} from 'lucide-react';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';
import HeroBannerSlider from '@/components/HeroBannerSlider';

/* Gracefully Curved Baroque Filigree Corner SVG Ornament tailored for rounded card containers */
function BaroqueCornerSVG({ className = "w-10 h-10 text-[#C5A059]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Curved corner accent matching soft container radius */}
      <path d="M 6 36 C 6 18, 18 6, 36 6" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" />
      <path d="M 12 40 C 12 24, 24 12, 40 12" stroke="#B8860B" strokeWidth="1" strokeLinecap="round" opacity="0.6" strokeDasharray="3 2" />
      
      {/* Filigree Leaf & Flourish Petals */}
      <path d="M 6 22 C 14 22, 22 14, 22 6 C 14 12, 10 16, 6 22 Z" fill="#C5A059" opacity="0.75" />
      <circle cx="20" cy="20" r="3.5" fill="#D4AF37" />
      
      {/* Decorative Accent Dots */}
      <circle cx="36" cy="14" r="2" fill="#B8860B" />
      <circle cx="14" cy="36" r="2" fill="#B8860B" />
    </svg>
  );
}

/* Centered Baroque Floral Crest Divider between Sections */
function BaroqueFloralCrestDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-6 max-w-xl mx-auto opacity-80">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C5A059] to-[#C5A059]"></div>
      
      <svg className="w-14 h-7 text-[#B8860B]" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left Leaf Scroll */}
        <path d="M 10 20 C 30 5, 50 35, 70 20 C 50 15, 30 25, 10 20 Z" fill="#C5A059" opacity="0.8" />
        {/* Center Diamond & Petals */}
        <polygon points="80,8 88,20 80,32 72,20" fill="#D4AF37" />
        <circle cx="80" cy="20" r="3" fill="#FAF8F5" />
        {/* Right Leaf Scroll */}
        <path d="M 150 20 C 130 5, 110 35, 90 20 C 110 15, 130 25, 150 20 Z" fill="#C5A059" opacity="0.8" />
      </svg>

      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C5A059] to-[#C5A059]"></div>
    </div>
  );
}

/* Floating Golden Granular Sparkles Background Overlay - 20% Soft Transparency */
function FloatingGoldSparklesOverlay() {
  const sparkles = [
    { top: '8%', left: '8%', size: 'w-4 h-4', delay: '0s' },
    { top: '14%', right: '12%', size: 'w-5 h-5', delay: '1.2s' },
    { top: '28%', left: '4%', size: 'w-3.5 h-3.5', delay: '2.4s' },
    { top: '35%', right: '6%', size: 'w-4 h-4', delay: '0.8s' },
    { top: '48%', left: '10%', size: 'w-5 h-5', delay: '3.1s' },
    { top: '56%', right: '14%', size: 'w-3.5 h-3.5', delay: '1.7s' },
    { top: '68%', left: '6%', size: 'w-4 h-4', delay: '2.9s' },
    { top: '78%', right: '8%', size: 'w-5 h-5', delay: '0.5s' },
    { top: '88%', left: '12%', size: 'w-3.5 h-3.5', delay: '2.1s' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {sparkles.map((sp, idx) => (
        <div
          key={idx}
          className={`gold-floating-sparkle ${sp.size}`}
          style={{ top: sp.top, left: sp.left, right: sp.right, animationDelay: sp.delay }}
        >
          <svg viewBox="0 0 24 24" fill="#D4AF37" className="w-full h-full opacity-65">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1A1A1A] selection:bg-[#C5A059] selection:text-white relative">
      
      {/* Animated Soft Floating Gold Sparkles Overlay */}
      <FloatingGoldSparklesOverlay />

      {/* Luxury Editorial Header */}
      <header className="border-b border-[#C5A059]/30 bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Official Trademark Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border border-[#C5A059]/40 group-hover:scale-105 transition-transform">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Isologo" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#1A1A1A] flex items-center gap-1 font-serif">
                EventControl<span className="text-[#C5A059]">.pe</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                SaaS Control de Eventos de Gala
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="#propuesta" className="hover:text-[#C5A059] transition">Qué Ofrecemos</a>
            <a href="#flujo" className="hover:text-[#C5A059] transition">Flujo Operativo</a>
            <a href="#planes" className="hover:text-[#C5A059] transition">Planes</a>
            <a href="#techinnova" className="hover:text-[#C5A059] transition">Tech Innova</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-xs font-bold text-slate-700 hover:text-[#C5A059] transition px-3 py-2"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/login" 
              className="text-xs font-bold gold-button px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-100" /> Acceso a Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-16 pb-20">
        
        {/* HERO SECTION - ELEGANT EDITORIAL STYLE */}
        <section className="relative pt-12 pb-6 text-center space-y-8 animate-fade-in-up">
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-[#DBBB6E]/60 text-[#B8860B] text-xs font-extrabold uppercase tracking-widest shadow-md">
              <ShieldCheck className="w-4 h-4 text-[#DBBB6E]" /> Plataforma SaaS para Wedding Planners y Eventos de Gala
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif text-[#1A1A1A] tracking-tight max-w-5xl mx-auto leading-tight">
              Gestión de Invitados, Plano de Mesas y Check-in QR en <span className="gold-gradient-text italic">Bodas y Eventos</span>.
            </h1>

            <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
              El software especializado que elimina el caos en puerta. Importa la lista de invitados desde Excel, emite pases QR por familias, organiza la distribución de mesas y congela los platos de catering al instante.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                style={{ backgroundColor: '#DBBB6E' }}
                className="w-full sm:w-auto px-8 py-4 text-white font-extrabold text-sm rounded-2xl transition shadow-xl flex items-center justify-center gap-2 hover:brightness-110"
              >
                <Sparkles className="w-5 h-5 text-white" /> Acceder a Demo de Prueba <ArrowRight className="w-5 h-5 text-white" />
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm rounded-2xl border border-[#DBBB6E]/60 transition shadow-sm"
              >
                Ver Planes (Starter S/29 • Pro S/59 • Business S/99)
              </Link>
            </div>
          </div>

          {/* FULL SCREEN WIDTH HERO BANNER SLIDER (100vw Full Bleed) */}
          <div className="pt-6 w-full">
            <HeroBannerSlider />
          </div>
        </section>

        {/* BAROQUE FLORAL CREST DIVIDER */}
        <BaroqueFloralCrestDivider />

        {/* PROPOSAL VALUE PILLARS SECTION */}
        <section id="propuesta" className="py-12 bg-white border-y border-[#C5A059]/30 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span 
                style={{ backgroundColor: '#DBBB6E' }}
                className="inline-block px-4 py-1.5 text-xs font-extrabold text-white uppercase tracking-widest rounded-full shadow-sm"
              >
                Lo que ofrecemos a tu negocio
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A]">La solución completa para la operación en puerta</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
                Tecnología especializada pensada exclusivamente para Wedding Planners, salones de fiesta y organizadores de eventos de gala.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Pillar Card 1 */}
              <div className="card-luxury p-6 sm:p-8 space-y-4 hover-lift relative flex flex-col justify-between">
                <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
                <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div 
                      style={{ backgroundColor: '#DBBB6E' }}
                      className="w-12 h-12 text-white rounded-xl border border-[#C5A059]/50 flex items-center justify-center font-bold text-xl font-serif shadow-md"
                    >
                      1
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B8860B] bg-amber-50 px-2.5 py-1 rounded-full border border-[#DBBB6E]/40">
                      Gestión Excel & WA
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">1. Importación e Invitación</h3>
                  
                  {/* Card 1 Image: Lista_invitados.png with LoveStory Inner White Border Frame */}
                  <div className="relative h-56 w-full rounded-lg overflow-hidden border border-[#DBBB6E]/40 shadow-md my-3 group bg-slate-100">
                    <Image 
                      src="/Lista_invitados.png" 
                      alt="Lista de Invitados e Importación Excel" 
                      fill 
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Inner White Margin Frame (Estilo Invitaciones de Boda) */}
                    <div className="absolute inset-3 border-2 border-white pointer-events-none z-10 shadow-sm"></div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Carga fácilmente tu lista de invitados desde Excel (`.xlsx` / `.csv`) y envía pases QR grupales por WhatsApp asistido (`wa.me`) sin costos ocultos por mensaje.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    style={{ backgroundColor: '#DBBB6E' }}
                    className="w-full py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:brightness-110 transition"
                  >
                    Probar Importación <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                </div>
              </div>

              {/* Pillar Card 2 */}
              <div className="card-luxury p-6 sm:p-8 space-y-4 hover-lift relative flex flex-col justify-between">
                <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
                <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div 
                      style={{ backgroundColor: '#DBBB6E' }}
                      className="w-12 h-12 text-white rounded-xl border border-[#C5A059]/50 flex items-center justify-center font-bold text-xl font-serif shadow-md"
                    >
                      2
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B8860B] bg-amber-50 px-2.5 py-1 rounded-full border border-[#DBBB6E]/40">
                      Recepción PWA
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">2. Recepción & Check-in QR</h3>
                  
                  {/* Card 2 Image: Imagen_QR.jfif with LoveStory Inner White Border Frame */}
                  <div className="relative h-56 w-full rounded-lg overflow-hidden border border-[#DBBB6E]/40 shadow-md my-3 group bg-slate-100">
                    <Image 
                      src="/Imagen_QR.jfif" 
                      alt="Recepción y Escáner QR de Invitados" 
                      fill 
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Inner White Margin Frame (Estilo Invitaciones de Boda) */}
                    <div className="absolute inset-3 border-2 border-white pointer-events-none z-10 shadow-sm"></div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Escaneo instantáneo en puerta con validación de pases autorizados por familias. Funciona de forma resiliente en cualquier teléfono o tablet incluso sin conexión.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    style={{ backgroundColor: '#DBBB6E' }}
                    className="w-full py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:brightness-110 transition"
                  >
                    Ver Escáner Demo <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                </div>
              </div>

              {/* Pillar Card 3 */}
              <div className="card-luxury p-6 sm:p-8 space-y-4 hover-lift relative flex flex-col justify-between">
                <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
                <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div 
                      style={{ backgroundColor: '#DBBB6E' }}
                      className="w-12 h-12 text-white rounded-xl border border-[#C5A059]/50 flex items-center justify-center font-bold text-xl font-serif shadow-md"
                    >
                      3
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B8860B] bg-amber-50 px-2.5 py-1 rounded-full border border-[#DBBB6E]/40">
                      Plano 2D & Catering
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">3. Control en Vivo & Catering</h3>
                  
                  {/* Card 3 Image: Control_catering.png with LoveStory Inner White Border Frame */}
                  <div className="relative h-56 w-full rounded-lg overflow-hidden border border-[#DBBB6E]/40 shadow-md my-3 group bg-slate-100">
                    <Image 
                      src="/Control_catering.png" 
                      alt="Control de Asistencia de Mesas 2D y Catering" 
                      fill 
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Inner White Margin Frame (Estilo Invitaciones de Boda) */}
                    <div className="absolute inset-3 border-2 border-white pointer-events-none z-10 shadow-sm"></div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Monitoreo en tiempo real con velocímetros visuales, plano virtual 2D espacial interactivo y congelamiento de platos de comida para conciliación estricta de catering.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    style={{ backgroundColor: '#DBBB6E' }}
                    className="w-full py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:brightness-110 transition"
                  >
                    Explorar Plano 2D <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* BAROQUE FLORAL CREST DIVIDER */}
        <BaroqueFloralCrestDivider />

        {/* VISUAL WORKFLOW ILLUSTRATION FOR NON-TECH USERS */}
        <section id="flujo" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-luxury-gold p-8 sm:p-12 text-center space-y-8 relative">
            <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-bl"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-br"><BaroqueCornerSVG /></div>

            <div>
              <span 
                style={{ backgroundColor: '#DBBB6E' }}
                className="inline-block px-4 py-1.5 text-xs font-extrabold text-white uppercase tracking-widest rounded-full shadow-sm"
              >
                Flujo Operativo Sencillo e Intuitivo
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#1A1A1A] mt-2 font-bold">
                ¿Cómo funciona EventControl.pe?
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl mx-auto">
                Diseñado para que cualquier coordinador o personal de puerta pueda operar el sistema en segundos sin curva de aprendizaje.
              </p>
            </div>

            {/* 3D INFOGRAPHIC WORKFLOW ILLUSTRATION EMBED */}
            <div className="relative rounded-xl overflow-hidden border border-[#DBBB6E]/40 shadow-xl hover-lift bg-white">
              <Image 
                src="/illustration-flow.jpg" 
                alt="Diagrama Infográfico del Flujo Operativo en 4 Pasos" 
                width={1280} 
                height={720} 
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 pt-4">
              <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm">
                <FileSpreadsheet className="w-8 h-8 text-[#B8860B] mb-2" />
                <span className="text-xs font-bold text-slate-800">1. Excel</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm">
                <Users className="w-8 h-8 text-[#B8860B] mb-2" />
                <span className="text-xs font-bold text-slate-800">2. Grupos</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm">
                <QrCode className="w-8 h-8 text-[#B8860B] mb-2" />
                <span className="text-xs font-bold text-slate-800">3. QR Único</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm">
                <Grid className="w-8 h-8 text-[#B8860B] mb-2" />
                <span className="text-xs font-bold text-slate-800">4. Mesas</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm">
                <Calendar className="w-8 h-8 text-[#B8860B] mb-2" />
                <span className="text-xs font-bold text-slate-800">5. Check-in</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm">
                <Clock className="w-8 h-8 text-[#B8860B] mb-2" />
                <span className="text-xs font-bold text-slate-800">6. Dashboard</span>
              </div>
              <div 
                style={{ backgroundColor: '#DBBB6E' }}
                className="flex flex-col items-center p-4 rounded-xl border border-[#DBBB6E] hover-lift shadow-md text-white"
              >
                <Utensils className="w-8 h-8 text-white mb-2" />
                <span className="text-xs font-bold text-white">7. Catering</span>
              </div>
            </div>
          </div>
        </section>

        {/* BAROQUE FLORAL CREST DIVIDER */}
        <BaroqueFloralCrestDivider />

        {/* PRICING SECTION */}
        <section id="planes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest">Planes y Precios Oficiales</span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A]">Tarifas accesibles para todo tamaño de negocio</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {(Object.keys(PLAN_LIMITS) as PlanCode[]).map((code) => {
              const plan = PLAN_LIMITS[code];
              const isRecommended = code === 'PROFESSIONAL';

              return (
                <div 
                  key={code} 
                  className={`card-luxury pt-12 p-8 flex flex-col justify-between relative hover-lift ${
                    isRecommended 
                      ? 'border-2 border-[#C5A059] shadow-2xl ring-2 ring-[#C5A059]/30' 
                      : 'border border-[#C5A059]/40'
                  }`}
                >
                  <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
                  <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>

                  {isRecommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#B8860B] text-white font-extrabold text-[11px] uppercase tracking-widest px-4 py-1 rounded-full shadow-lg border border-amber-200 z-30 flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-amber-200">★</span> RECOMENDADO
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-serif text-[#1A1A1A] mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-500 min-h-[32px] mb-3">{plan.profile}</p>

                    <div className="my-4">
                      <span className="text-4xl font-extrabold text-[#1A1A1A]">S/{plan.monthlyPricePEN}</span>
                      <span className="text-slate-500 text-xs font-medium"> / mes</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-4">
                      {plan.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#B8860B] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/pricing" className={`mt-8 w-full py-3 font-bold text-xs rounded-xl text-center block transition shadow-sm ${
                    isRecommended 
                      ? 'gold-button' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}>
                    Ver Plan {plan.name}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* BAROQUE FLORAL CREST DIVIDER */}
        <BaroqueFloralCrestDivider />

        {/* DEVELOPER BRAND BRANDING SECTION: TECH INNOVA */}
        <section id="techinnova" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-luxury-gold p-8 sm:p-12 border-2 border-[#C5A059]/50 shadow-xl space-y-6 relative">
            <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-bl"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-br"><BaroqueCornerSVG /></div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[#C5A059]/30 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative rounded-2xl overflow-hidden bg-white border border-[#C5A059]/40 shrink-0 p-2 shadow-sm">
                  <Image 
                    src="/techinnova/logo_TI.png" 
                    alt="Tech Innova Logo" 
                    fill 
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[#B8860B] uppercase tracking-widest block">
                    Desarrollado con Excelencia por
                  </span>
                  <h3 className="text-2xl font-serif text-[#1A1A1A]">Tech Innova</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Firma Especializada en Ingeniería de Software, Inteligencia Artificial y Soluciones SaaS.
                  </p>
                </div>
              </div>

              <a
                href="https://tech-innova.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2 shrink-0"
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
                className="p-4 bg-white rounded-xl border border-[#C5A059]/40 hover:border-[#C5A059] transition flex items-center gap-3 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#B8860B] flex items-center justify-center font-bold">
                  🌐
                </div>
                <div>
                  <span className="font-bold text-slate-900 block group-hover:text-[#B8860B] transition">Portal Web Oficial</span>
                  <span className="text-[11px] text-slate-500 font-mono">tech-innova.vercel.app</span>
                </div>
              </a>

              <a
                href="https://www.tiktok.com/@techinnova1"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white rounded-xl border border-[#C5A059]/40 hover:border-pink-500 transition flex items-center gap-3 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                  🎵
                </div>
                <div>
                  <span className="font-bold text-slate-900 block group-hover:text-pink-600 transition">TikTok Oficial</span>
                  <span className="text-[11px] text-slate-500 font-mono">@techinnova1</span>
                </div>
              </a>

              <div className="p-4 bg-white rounded-xl border border-slate-200 opacity-70 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Canal de YouTube</span>
                  <span className="text-[11px] text-slate-500 italic">Próximamente</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-600 py-10 text-xs border-t border-[#C5A059]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-[#C5A059]/40">
              <Image src="/logo-eventcontrol.jpg" alt="EventControl" fill className="object-cover" />
            </div>
            <span className="font-bold text-slate-900">EventControl.pe © 2026</span>
          </div>

          <div className="text-center sm:text-right text-slate-600">
            Desarrollado con excelencia por{' '}
            <a 
              href="https://tech-innova.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#B8860B] font-bold hover:underline"
            >
              Tech Innova
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
