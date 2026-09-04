'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

/* Gracefully Curved Baroque Filigree Corner SVG Ornament */
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

const slides = [
  {
    id: 1,
    image: '/1.jpeg',
    handwriteTag: 'Elegancia & Control Absoluto',
    title: 'Check-in QR Inteligente por Familias',
    description: 'Genera tokens criptográficos de 256 bits y realiza la recepción en puerta en solo 2 segundos sin aglomeraciones.',
    badge: 'Cero Caos en Recepción',
  },
  {
    id: 2,
    image: '/2.jpeg',
    handwriteTag: 'Diseño & Armonía Espacial',
    title: 'Plano Virtual 2D Dinámico Drag & Drop',
    description: 'Organiza mesas circulares, rectangulares o personalizadas en escenarios complejos con fluidez total y zoom dinámico.',
    badge: 'Distribución Flexible de Mesas',
  },
  {
    id: 3,
    image: '/3.jpeg',
    handwriteTag: 'Conciliación Financiera Exacta',
    title: 'Cortes de Catering Inmutables y Reportes',
    description: 'Congela la fotografía de invitados presentes a la hora del servicio de comida y evita sobrecostos innecesarios.',
    badge: 'Garantía para Wedding Planners',
  },
];

export default function HeroBannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Increased display duration per image (9000ms = 9 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full max-w-none overflow-hidden border-y-2 border-[#DBBB6E]/40 shadow-2xl bg-slate-950 group">
      
      {/* Baroque Corner Filigree Flourishes */}
      <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
      <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>
      <div className="baroque-corner-bl"><BaroqueCornerSVG /></div>
      <div className="baroque-corner-br"><BaroqueCornerSVG /></div>

      {/* Main Slide Carousel Wrapper - Full Screen Width Hero Banner */}
      <div className="relative h-[520px] sm:h-[620px] lg:h-[700px] w-full overflow-hidden bg-slate-950">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1500 ease-in-out will-change-auto ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image (Fixed Stable Scale to Prevent Abrupt Resizing/Jumps) */}
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={idx === 0}
                  className="object-cover object-center transform-gpu scale-[1.03]"
                />
              </div>

              {/* Romantic Dark Overlay Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-slate-900/40"></div>

              {/* Content Overlay with Sequential Staggered Entrance Animations */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-12 space-y-4 sm:space-y-6 max-w-5xl mx-auto z-20">
                
                {/* 1. Badge (Fades in at 300ms) */}
                <div 
                  style={{ backgroundColor: '#DBBB6E' }}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-xs sm:text-sm font-extrabold tracking-widest shadow-lg backdrop-blur-md uppercase transform transition-all duration-1000 ease-out ${
                    isActive ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-6 delay-0'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-white" /> {slide.badge}
                </div>

                {/* 2. Elegant Handwriting Script Phrase (Fades in at 500ms) */}
                <h3 className={`font-handwriting text-4xl sm:text-6xl md:text-7xl text-[#F7E7BE] font-normal leading-tight tracking-wide drop-shadow-xl transform transition-all duration-1000 ease-out ${
                  isActive ? 'opacity-100 translate-y-0 delay-500' : 'opacity-0 translate-y-6 delay-0'
                }`}>
                  “{slide.handwriteTag}”
                </h3>

                {/* 3. Main Slide Title (Fades in at 700ms) */}
                <h2 className={`font-serif text-3xl sm:text-5xl md:text-6xl text-white font-extrabold tracking-tight drop-shadow-md max-w-4xl leading-tight transform transition-all duration-1000 ease-out ${
                  isActive ? 'opacity-100 translate-y-0 delay-700' : 'opacity-0 translate-y-6 delay-0'
                }`}>
                  {slide.title}
                </h2>

                {/* 4. Subtitle / Description (Fades in at 900ms) */}
                <p className={`text-sm sm:text-lg text-slate-200 max-w-3xl font-light leading-relaxed drop-shadow transform transition-all duration-1000 ease-out ${
                  isActive ? 'opacity-100 translate-y-0 delay-900' : 'opacity-0 translate-y-6 delay-0'
                }`}>
                  {slide.description}
                </p>

                {/* 5. CTA Buttons (Fades in at 1100ms) */}
                <div className={`pt-4 flex flex-wrap items-center justify-center gap-4 transform transition-all duration-1000 ease-out ${
                  isActive ? 'opacity-100 translate-y-0 delay-1000' : 'opacity-0 translate-y-6 delay-0'
                }`}>
                  <Link
                    href="/login"
                    style={{ backgroundColor: '#DBBB6E' }}
                    className="hover:brightness-110 text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-xl transition shadow-xl flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-white" /> Ingresar a la Plataforma <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/pricing"
                    className="bg-white/90 hover:bg-white text-slate-900 font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-xl border border-[#DBBB6E]/60 transition shadow-md backdrop-blur-sm"
                  >
                    Ver Planes & Tarifas
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrow Controls */}
      <button
        onClick={goToPrev}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white border border-[#DBBB6E]/60 backdrop-blur-md flex items-center justify-center transition opacity-80 hover:opacity-100 hover:scale-110 shadow-lg"
        aria-label="Diapositiva Anterior"
      >
        <ChevronLeft className="w-7 h-7 text-[#DBBB6E]" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white border border-[#DBBB6E]/60 backdrop-blur-md flex items-center justify-center transition opacity-80 hover:opacity-100 hover:scale-110 shadow-lg"
        aria-label="Siguiente Diapositiva"
      >
        <ChevronRight className="w-7 h-7 text-[#DBBB6E]" />
      </button>

      {/* Bottom Dot Indicators */}
      <div className="absolute bottom-6 sm:bottom-8 inset-x-0 z-30 flex items-center justify-center gap-2.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? 'w-10 h-3 shadow-md'
                : 'w-3 h-3 bg-white/40 hover:bg-white/70'
            }`}
            style={{ backgroundColor: idx === currentIndex ? '#DBBB6E' : undefined }}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
