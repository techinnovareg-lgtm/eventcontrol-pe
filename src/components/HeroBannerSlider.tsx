'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

/* Gracefully Curved Baroque Filigree Corner SVG Ornament */
function BaroqueCornerSVG({ className = "w-10 h-10 text-[#C5A059]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 6 36 C 6 18, 18 6, 36 6" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" />
      <path d="M 12 40 C 12 24, 24 12, 40 12" stroke="#B8860B" strokeWidth="1" strokeLinecap="round" opacity="0.6" strokeDasharray="3 2" />
      <path d="M 6 22 C 14 22, 22 14, 22 6 C 14 12, 10 16, 6 22 Z" fill="#C5A059" opacity="0.75" />
      <circle cx="20" cy="20" r="3.5" fill="#D4AF37" />
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden border-2 border-[#C5A059]/40 shadow-2xl bg-slate-900 group">
      
      {/* Baroque Corner Filigree Flourishes */}
      <div className="baroque-corner-tl"><BaroqueCornerSVG /></div>
      <div className="baroque-corner-tr"><BaroqueCornerSVG /></div>
      <div className="baroque-corner-bl"><BaroqueCornerSVG /></div>
      <div className="baroque-corner-br"><BaroqueCornerSVG /></div>

      {/* Main Slide Carousel Wrapper */}
      <div className="relative h-[480px] sm:h-[540px] md:h-[600px] w-full overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
              }`}
            >
              {/* Background Image */}
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={idx === 0}
                className="object-cover object-center transition-transform duration-10000 ease-linear scale-105"
              />

              {/* Romantic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-900/30"></div>
              <div className="absolute inset-0 bg-radial-vignette opacity-60"></div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-12 space-y-4 sm:space-y-6 max-w-4xl mx-auto z-20">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-[#C5A059]/60 text-amber-200 text-xs sm:text-sm font-semibold tracking-widest backdrop-blur-md shadow-md animate-fade-in-up">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" /> {slide.badge}
                </div>

                {/* Elegant Handwriting Script Phrase */}
                <h3 className="font-handwriting text-3xl sm:text-5xl md:text-6xl text-[#F5E6C8] font-normal leading-tight tracking-wide drop-shadow-lg animate-fade-in-up">
                  “{slide.handwriteTag}”
                </h3>

                {/* Main Slide Title */}
                <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-white font-extrabold tracking-tight drop-shadow-md max-w-3xl leading-tight">
                  {slide.title}
                </h2>

                {/* Subtitle / Description */}
                <p className="text-xs sm:text-base text-slate-200 max-w-2xl font-light leading-relaxed drop-shadow">
                  {slide.description}
                </p>

                {/* CTA Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  <Link
                    href="/login"
                    className="gold-button font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition shadow-xl flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-100" /> Ingresar a Demo <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/pricing"
                    className="bg-white/90 hover:bg-white text-slate-900 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl border border-[#C5A059]/50 transition shadow-md backdrop-blur-sm"
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
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white border border-[#C5A059]/50 backdrop-blur-md flex items-center justify-center transition opacity-80 hover:opacity-100 hover:scale-110 shadow-lg"
        aria-label="Diapositiva Anterior"
      >
        <ChevronLeft className="w-6 h-6 text-[#C5A059]" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white border border-[#C5A059]/50 backdrop-blur-md flex items-center justify-center transition opacity-80 hover:opacity-100 hover:scale-110 shadow-lg"
        aria-label="Siguiente Diapositiva"
      >
        <ChevronRight className="w-6 h-6 text-[#C5A059]" />
      </button>

      {/* Bottom Dot Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-30 flex items-center justify-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? 'w-8 h-2.5 bg-[#C5A059] shadow-md'
                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
