import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, Users, QrCode, Grid, Clock, FileSpreadsheet, 
  ShieldCheck, CheckCircle2, ArrowRight, Utensils, HelpCircle, Sparkles, ExternalLink, Video, Star,
  Mail, Phone, MessageSquare
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
            <a href="#contacto" className="hover:text-[#DBBB6E] transition relative py-1 group">
              Contáctanos
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
                Ver Planes (Starter S/ 29.99 • Pro S/ 59.99 • Business S/ 99.99)
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
                      src="/Imagen_QR.jpg" 
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5 pt-4 text-center items-stretch">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B8860B] flex items-center justify-center mb-2.5 shrink-0 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-serif">1. Excel</span>
                <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug font-normal">
                  Importación masiva de lista de invitados en 1 clic.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B8860B] flex items-center justify-center mb-2.5 shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-serif">2. Grupos</span>
                <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug font-normal">
                  Agrupación por familias y pases por delegación.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B8860B] flex items-center justify-center mb-2.5 shrink-0 group-hover:scale-110 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-serif">3. QR Único</span>
                <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug font-normal">
                  Pases digitales por familia enviados vía WhatsApp.
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B8860B] flex items-center justify-center mb-2.5 shrink-0 group-hover:scale-110 transition-transform">
                  <Grid className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-serif">4. Mesas</span>
                <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug font-normal">
                  Asignación de asientos en plano 2D interactivo.
                </p>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B8860B] flex items-center justify-center mb-2.5 shrink-0 group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-serif">5. Check-in</span>
                <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug font-normal">
                  Escaneo instantáneo en puerta con o sin conexión.
                </p>
              </div>

              {/* Step 6 */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-white border border-[#DBBB6E]/40 hover-lift shadow-sm group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B8860B] flex items-center justify-center mb-2.5 shrink-0 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 font-serif">6. Dashboard</span>
                <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug font-normal">
                  Métricas de aforo y avance de flujo en tiempo real.
                </p>
              </div>

              {/* Step 7 */}
              <div 
                style={{ backgroundColor: '#DBBB6E' }}
                className="flex flex-col items-center p-4 rounded-2xl border border-[#C5A059] hover-lift shadow-md text-white group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center mb-2.5 shrink-0 group-hover:scale-110 transition-transform">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white font-serif">7. Catering</span>
                <p className="text-[10.5px] text-amber-50 mt-1.5 leading-snug font-normal">
                  Congelamiento de platos y conciliación de cenas.
                </p>
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
                      <span className="text-4xl font-serif font-bold text-[#1A1A1A]">S/ {plan.monthlyPricePEN.toFixed(2)}</span>
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

        {/* CONTACT SECTION: TECH INNOVA */}
        <section id="contacto" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-[#DBBB6E]/40 shadow-xl space-y-8 relative overflow-hidden">
            <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
            <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>

            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="font-handwriting text-3xl text-[#DBBB6E] font-normal block">
                estamos para servirte
              </span>
              <h2 className="text-3xl font-serif text-[#1A1A1A] font-bold tracking-tight uppercase">
                Contáctanos Directamente
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Resuelve tus dudas, solicita una demostración personalizada o contrata tu plan con el equipo oficial de <strong>Tech Innova</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* WhatsApp Contact Box */}
              <a
                href="https://wa.me/51947515529?text=Hola%20Tech%20Innova,%20quisiera%20más%20información%20sobre%20EventControl.pe"
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 bg-emerald-50/60 rounded-2xl border-2 border-emerald-300/80 hover:border-emerald-500 transition flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center font-bold shadow-md">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider block">WhatsApp Oficial</span>
                    <strong className="text-xl font-black text-slate-900 font-mono block">+51 947 515 529</strong>
                    <span className="text-[11px] text-slate-500 block">Atención directa por WhatsApp</span>
                  </div>
                </div>
                <span className="text-emerald-700 font-extrabold text-xl group-hover:translate-x-1 transition-transform">→</span>
              </a>

              {/* Email Contact Box */}
              <a
                href="mailto:tech.innova.reg@gmail.com?subject=Consulta%20EventControl.pe"
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 bg-amber-50/60 rounded-2xl border-2 border-[#C5A059]/50 hover:border-[#C5A059] transition flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B132B] text-amber-300 flex items-center justify-center font-bold shadow-md border border-[#C5A059]">
                    <Mail className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase text-[#B8860B] tracking-wider block">Correo Electrónico</span>
                    <strong className="text-base font-bold text-slate-900 font-mono block">tech.innova.reg@gmail.com</strong>
                    <span className="text-[11px] text-slate-500 block">Escríbenos para propuestas y cotizaciones</span>
                  </div>
                </div>
                <span className="text-[#B8860B] font-extrabold text-xl group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
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
                href="https://tech-innova.online/"
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
                href="https://tech-innova.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white rounded-xl border border-[#DBBB6E]/40 hover:border-[#DBBB6E] transition flex items-center gap-3 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#B8860B] flex items-center justify-center font-bold">
                  🌐
                </div>
                <div>
                  <span className="font-bold text-slate-900 block group-hover:text-[#B8860B] transition">Portal Web Oficial</span>
                  <span className="text-[11px] text-slate-500 font-mono">tech-innova.online</span>
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

              <a
                href="https://www.youtube.com/@TechInnova-c9k"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white rounded-xl border border-[#DBBB6E]/40 hover:border-red-500 transition flex items-center gap-3 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block group-hover:text-red-600 transition">Canal de YouTube</span>
                  <span className="text-[11px] text-slate-500 font-mono">@TechInnova-c9k</span>
                </div>
              </a>
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
            <div>
              <span className="font-bold text-slate-900 block">EventControl.pe © 2026</span>
              <span className="text-[11px] text-slate-500">Tech Innova: tech.innova.reg@gmail.com • +51 947 515 529</span>
            </div>
          </div>

          <div className="text-center sm:text-right text-slate-600">
            Desarrollado con excelencia por{' '}
            <a 
              href="https://tech-innova.online/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#B8860B] font-bold hover:underline"
            >
              Tech Innova
            </a>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/51947515529?text=Hola%20Tech%20Innova,%20quisiera%20más%20información%20sobre%20la%20plataforma%20EventControl.pe."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center border-2 border-white group"
        title="Escríbenos directamente por WhatsApp (+51 947 515 529)"
      >
        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.157 4.228 4.316-1.132z"/>
        </svg>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold text-xs pl-0 group-hover:pl-2">
          WhatsApp (+51 947 515 529)
        </span>
      </a>
    </div>
  );
}
