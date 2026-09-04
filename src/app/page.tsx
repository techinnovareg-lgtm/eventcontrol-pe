import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, Users, QrCode, Grid, Clock, FileSpreadsheet, 
  ShieldCheck, CheckCircle2, ArrowRight, Utensils, HelpCircle, Sparkles, ExternalLink, Video, Star
} from 'lucide-react';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';
import HeroBannerSlider from '@/components/HeroBannerSlider';

/* Gracefully Curved Baroque Filigree Corner SVG Ornament tailored for rounded card containers */
function BaroqueCornerSVG({ className = "w-10 h-10 text-[#DBBB6E]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 6 36 C 6 18, 18 6, 36 6" stroke="#DBBB6E" strokeWidth="2" strokeLinecap="round" />
      <path d="M 12 40 C 12 24, 24 12, 40 12" stroke="#B8860B" strokeWidth="1" strokeLinecap="round" opacity="0.6" strokeDasharray="3 2" />
      <path d="M 6 22 C 14 22, 22 14, 22 6 C 14 12, 10 16, 6 22 Z" fill="#DBBB6E" opacity="0.75" />
      <circle cx="20" cy="20" r="3.5" fill="#DBBB6E" />
      <circle cx="36" cy="14" r="2" fill="#B8860B" />
      <circle cx="14" cy="36" r="2" fill="#B8860B" />
    </svg>
  );
}

/* Centered Baroque Floral Crest Divider between Sections */
function BaroqueFloralCrestDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-8 max-w-xl mx-auto opacity-90">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#DBBB6E] to-[#DBBB6E]"></div>
      
      <svg className="w-16 h-8 text-[#DBBB6E]" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 10 20 C 30 5, 50 35, 70 20 C 50 15, 30 25, 10 20 Z" fill="#DBBB6E" opacity="0.85" />
        <polygon points="80,8 88,20 80,32 72,20" fill="#DBBB6E" />
        <circle cx="80" cy="20" r="3" fill="#FAF8F5" />
        <path d="M 150 20 C 130 5, 110 35, 90 20 C 110 15, 130 25, 150 20 Z" fill="#DBBB6E" opacity="0.85" />
      </svg>

      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#DBBB6E] to-[#DBBB6E]"></div>
    </div>
  );
}

/* Floating Golden Granular Sparkles Background Overlay */
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
          <svg viewBox="0 0 24 24" fill="#DBBB6E" className="w-full h-full opacity-70">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1A1A1A] selection:bg-[#DBBB6E] selection:text-white relative">
      
      {/* Animated Soft Floating Gold Sparkles Overlay */}
      <FloatingGoldSparklesOverlay />

      {/* Dark Executive Luxury Header inspired by Liebe & Lavelo Themes */}
      <header className="border-b-2 border-[#C5A059] bg-[#0B132B]/95 backdrop-blur-md sticky top-0 z-50 transition-all shadow-xl select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          
          {/* Logo Crest & Luxury Brand Title */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md border-2 border-[#C5A059] group-hover:scale-105 transition-transform bg-white p-0.5">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover rounded-xl"
              />
            </div>
            <div>
              <span className="text-2xl font-serif font-extrabold tracking-tight text-white flex items-center gap-1">
                EventControl<span className="text-[#DBBB6E]">.pe</span>
              </span>
              <span className="text-[10px] text-amber-200/90 uppercase tracking-[0.2em] font-bold block font-sans">
                Plataforma de Bodas & Eventos de Gala
              </span>
            </div>
          </Link>

          {/* Liebe / Lavelo Styled Navigation Links with Gold Diamond Separators */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-serif font-bold uppercase tracking-widest text-white">
            <a href="#propuesta" className="hover:text-[#DBBB6E] transition relative py-1 group">
              Qué Ofrecemos
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#C5A059] group-hover:w-full transition-all duration-300"></span>
            </a>
            <span className="text-[#C5A059] text-[10px]">✦</span>
            <a href="#flujo" className="hover:text-[#DBBB6E] transition relative py-1 group">
              Flujo Operativo
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#C5A059] group-hover:w-full transition-all duration-300"></span>
            </a>
            <span className="text-[#C5A059] text-[10px]">✦</span>
            <a href="#planes" className="hover:text-[#DBBB6E] transition relative py-1 group">
              Planes & Precios
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#C5A059] group-hover:w-full transition-all duration-300"></span>
            </a>
            <span className="text-[#C5A059] text-[10px]">✦</span>
            <a href="#techinnova" className="hover:text-[#DBBB6E] transition relative py-1 group">
              Tech Innova
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#C5A059] group-hover:w-full transition-all duration-300"></span>
            </a>
          </nav>

          {/* Single High-Impact Luxury CTA Button */}
          <div className="flex items-center">
            <Link 
              href="/login" 
              className="text-xs font-serif font-bold text-white px-6 py-3 rounded-xl transition shadow-lg flex items-center gap-2 bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B8860B] border border-amber-200/60 hover:brightness-110"
            >
              <Sparkles className="w-4 h-4 text-amber-100" /> Acceso al Sistema
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-12 pb-20">
        
        {/* HERO SECTION - LOVESTORY ELEGANT STYLE */}
        <section className="relative pt-8 pb-4 text-center space-y-8 animate-fade-in-up">
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            {/* LoveStory Script Tagline */}
            <span className="font-handwriting text-3xl sm:text-5xl text-[#DBBB6E] font-normal tracking-wide block">
              bienvenidos a la era digital de bodas & eventos
            </span>

            <h1 className="text-4xl sm:text-6xl font-serif text-[#1A1A1A] tracking-tight max-w-5xl mx-auto leading-tight uppercase font-bold">
              Gestión de Invitados, Plano de Mesas y Check-in QR en <span className="gold-gradient-text italic font-serif">Bodas de Gala</span>.
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
                <Sparkles className="w-5 h-5 text-white" /> Ingresar a la Plataforma <ArrowRight className="w-5 h-5 text-white" />
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
          <div className="pt-4 w-full">
            <HeroBannerSlider />
          </div>
        </section>

        {/* PROPOSAL VALUE PILLARS SECTION (LOVESTORY STYLE WITH WHITE PHOTO FRAMES) */}
        <section id="propuesta" className="py-10 bg-white border-y border-[#DBBB6E]/30 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* Orla floral crest inside content section container */}
            <BaroqueFloralCrestDivider />

            {/* LoveStory Section Header */}
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="font-handwriting text-3xl sm:text-4xl text-[#DBBB6E] font-normal block">
                lo que ofrecemos a tu empresa
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-[#1A1A1A] font-bold tracking-tight uppercase">
                La solución completa para la operación en puerta
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto pt-1 leading-relaxed">
                Tecnología de alto nivel pensada exclusivamente para Wedding Planners, salones de fiesta y organizadores de eventos de gala.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Pillar Card 1 */}
              <div className="card-luxury p-6 sm:p-8 space-y-4 hover-lift relative flex flex-col justify-between border border-[#DBBB6E]/40 shadow-lg">
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
                  
                  {/* Card 1 Image */}
                  <div className="relative h-56 w-full rounded-lg overflow-hidden border border-[#DBBB6E]/40 shadow-md my-3 group bg-slate-100">
                    <Image 
                      src="/Lista_invitados.png" 
                      alt="Lista de Invitados e Importación Excel" 
                      fill 
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    />
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
              <div className="card-luxury p-6 sm:p-8 space-y-4 hover-lift relative flex flex-col justify-between border border-[#DBBB6E]/40 shadow-lg">
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
                  
                  {/* Card 2 Image */}
                  <div className="relative h-56 w-full rounded-lg overflow-hidden border border-[#DBBB6E]/40 shadow-md my-3 group bg-slate-100">
                    <Image 
                      src="/Imagen_QR.jfif" 
                      alt="Recepción y Escáner QR de Invitados" 
                      fill 
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
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
              <div className="card-luxury p-6 sm:p-8 space-y-4 hover-lift relative flex flex-col justify-between border border-[#DBBB6E]/40 shadow-lg">
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
                  
                  {/* Card 3 Image */}
                  <div className="relative h-56 w-full rounded-lg overflow-hidden border border-[#DBBB6E]/40 shadow-md my-3 group bg-slate-100">
                    <Image 
                      src="/Control_catering.png" 
                      alt="Control de Asistencia de Mesas 2D y Catering" 
                      fill 
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
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

        {/* VISUAL WORKFLOW ILLUSTRATION SECTION */}
        <section id="flujo" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-luxury-gold p-8 sm:p-12 text-center space-y-6 relative border-2 border-[#DBBB6E]/50 shadow-xl">
            <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-bl"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-br"><BaroqueCornerSVG /></div>

            {/* Orla floral crest inside content card */}
            <BaroqueFloralCrestDivider />

            <div>
              <span className="font-handwriting text-3xl sm:text-4xl text-[#DBBB6E] font-normal block">
                paso a paso hacia la recepción perfecta
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif text-[#1A1A1A] mt-1 font-bold uppercase tracking-tight">
                ¿Cómo funciona EventControl.pe?
              </h2>
              <p className="text-xs text-slate-600 mt-2 max-w-2xl mx-auto">
                Diseñado para que cualquier coordinador o personal de puerta pueda operar el sistema en segundos sin curva de aprendizaje.
              </p>
            </div>

            {/* 3D INFOGRAPHIC WORKFLOW ILLUSTRATION EMBED */}
            <div className="relative rounded-xl overflow-hidden border-2 border-[#DBBB6E]/50 shadow-xl hover-lift bg-white">
              <Image 
                src="/illustration-flow.jpg" 
                alt="Diagrama Infográfico del Flujo Operativo en 4 Pasos" 
                width={1280} 
                height={720} 
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Workflow Steps Grid */}
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

        {/* PRICING SECTION (LOVESTORY STYLE) */}
        <section id="planes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Orla floral crest inside content section container */}
          <BaroqueFloralCrestDivider />

          {/* LoveStory Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="font-handwriting text-3xl sm:text-4xl text-[#DBBB6E] font-normal block">
              inversión transparente para tu empresa
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#1A1A1A] font-bold tracking-tight uppercase">
              Planes y Precios Oficiales
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto pt-1 leading-relaxed">
              Selecciona el plan que se adapte al volumen de tus eventos de gala.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {(Object.keys(PLAN_LIMITS) as PlanCode[]).map((code) => {
              const plan = PLAN_LIMITS[code];
              const isRecommended = code === 'PROFESSIONAL';

              return (
                <div 
                  key={code} 
                  className={`card-luxury pt-12 p-8 flex flex-col justify-between relative hover-lift border-2 ${
                    isRecommended 
                      ? 'border-[#DBBB6E] shadow-2xl ring-4 ring-[#DBBB6E]/20 bg-white' 
                      : 'border-[#DBBB6E]/40 shadow-lg bg-white'
                  }`}
                >
                  <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
                  <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>

                  {isRecommended && (
                    <div 
                      style={{ backgroundColor: '#DBBB6E' }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 text-white font-extrabold text-[11px] uppercase tracking-widest px-4 py-1 rounded-full shadow-lg border border-amber-200 z-30 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Star className="w-3.5 h-3.5 fill-white text-white" /> RECOMENDADO
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-1 uppercase">{plan.name}</h3>
                    <p className="text-xs text-slate-500 min-h-[32px] mb-3">{plan.profile}</p>

                    <div className="my-4 pb-4 border-b border-slate-100">
                      <span className="text-4xl font-serif font-bold text-[#1A1A1A]">S/{plan.monthlyPricePEN}</span>
                      <span className="text-slate-500 text-xs font-medium"> / mes</span>
                    </div>

                    <ul className="space-y-3 text-xs text-slate-700 pt-2">
                      {plan.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#DBBB6E] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link 
                    href="/pricing" 
                    style={isRecommended ? { backgroundColor: '#DBBB6E' } : undefined}
                    className={`mt-8 w-full py-3.5 font-bold text-xs rounded-xl text-center block transition shadow-md ${
                      isRecommended 
                        ? 'text-white hover:brightness-110' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    Ver Plan {plan.name}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* DEVELOPER BRAND BRANDING SECTION: TECH INNOVA */}
        <section id="techinnova" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-luxury-gold p-8 sm:p-12 border-2 border-[#DBBB6E]/50 shadow-xl space-y-6 relative">
            <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-bl"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-br"><BaroqueCornerSVG /></div>

            {/* Orla floral crest inside content card */}
            <BaroqueFloralCrestDivider />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[#DBBB6E]/30 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative rounded-2xl overflow-hidden bg-white border border-[#DBBB6E]/50 shrink-0 p-2 shadow-sm">
                  <Image 
                    src="/techinnova/logo_TI.png" 
                    alt="Tech Innova Logo" 
                    fill 
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <span className="font-handwriting text-2xl text-[#DBBB6E] block font-normal">
                    desarrollado con excelencia por
                  </span>
                  <h3 className="text-2xl font-serif text-[#1A1A1A] font-bold">Tech Innova</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Firma Especializada en Ingeniería de Software, Inteligencia Artificial y Soluciones SaaS.
                  </p>
                </div>
              </div>

              <a
                href="https://tech-innova.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2 shrink-0"
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
                className="p-4 bg-white rounded-xl border border-[#DBBB6E]/40 hover:border-[#DBBB6E] transition flex items-center gap-3 group shadow-sm"
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
                className="p-4 bg-white rounded-xl border border-[#DBBB6E]/40 hover:border-pink-500 transition flex items-center gap-3 group shadow-sm"
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

      {/* LoveStory Footer */}
      <footer className="bg-white text-slate-600 py-10 text-xs border-t border-[#DBBB6E]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-[#DBBB6E]/40">
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
