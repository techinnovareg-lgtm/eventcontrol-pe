'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ShieldCheck, ArrowLeft, Sparkles, HelpCircle, ExternalLink } from 'lucide-react';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-[#C5A059]/20 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md border border-[#C5A059]/30 group-hover:scale-105 transition-transform">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#1A1A1A] font-serif">
                EventControl<span className="text-[#C5A059]">.pe</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                Planes & Tarifas
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-bold text-slate-700 hover:text-[#C5A059] transition">
              Iniciar Sesión
            </Link>
            <Link href="/login" className="text-xs font-bold gold-button px-5 py-2.5 rounded-xl transition shadow-md">
              Acceso a Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#C5A059]/40 text-[#B8860B] text-xs font-extrabold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-4 h-4 text-[#C5A059]" /> Tarifas Oficiales MVP Perú 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif text-[#1A1A1A] tracking-tight">
            Planes diseñados para Wedding Planners y Agencias
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Aumenta el control de tus bodas y eventos sociales sin costos ocultos de mensajería.
          </p>

          {/* Monthly / Annual Toggle Switch */}
          <div className="pt-6 flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-[#1A1A1A]' : 'text-slate-500'}`}>Facturación Mensual</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-8 bg-slate-900 rounded-full p-1 transition flex items-center relative border border-slate-700"
            >
              <div
                className={`w-6 h-6 bg-[#C5A059] rounded-full shadow-md transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-bold flex items-center gap-1.5 ${isAnnual ? 'text-[#1A1A1A]' : 'text-slate-500'}`}>
              Facturación Anual <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">2 Meses Gratis</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {(Object.keys(PLAN_LIMITS) as PlanCode[]).map((code) => {
            const plan = PLAN_LIMITS[code];
            const price = isAnnual ? plan.annualPricePEN : plan.monthlyPricePEN;
            const isPopular = code === 'PROFESSIONAL';

            return (
              <div 
                  key={code} 
                  className={`card-luxury pt-10 p-8 flex flex-col justify-between relative hover-lift ${
                    isPopular 
                      ? 'border-2 border-[#C5A059] shadow-2xl ring-2 ring-[#C5A059]/30' 
                      : 'border border-[#C5A059]/40 shadow-md'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#B8860B] text-white font-extrabold text-[11px] uppercase tracking-widest px-4 py-1 rounded-full shadow-lg border border-amber-200 z-30 flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-amber-200">★</span> RECOMENDADO
                    </div>
                  )}

                <div>
                  <h3 className="text-xl font-serif text-[#1A1A1A] mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 min-h-[32px] mb-3">{plan.profile}</p>

                  <div className="my-4">
                    <span className="text-4xl font-extrabold text-[#1A1A1A]">S/{price}</span>
                    <span className="text-slate-500 text-xs font-medium">{isAnnual ? ' / año' : ' / mes'}</span>
                  </div>

                  <ul className="space-y-2.5 border-t border-slate-100 pt-4 text-xs">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/login"
                    className={`w-full py-3.5 rounded-xl font-bold text-xs transition flex items-center justify-center shadow-md ${
                      isPopular
                        ? 'gold-button'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    Elegir Plan {plan.name}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Developer Credit Footer */}
        <div className="text-center text-xs text-slate-500 max-w-2xl mx-auto bg-white p-4 rounded-2xl border border-[#C5A059]/30 space-y-1 shadow-sm">
          <p>* El plan Business con eventos activos ilimitados está sujeto a política de uso razonable.</p>
          <p className="text-slate-600 font-semibold">
            Plataforma SaaS desarrollada con excelencia por{' '}
            <a href="https://tech-innova.online/" target="_blank" rel="noopener noreferrer" className="text-[#B8860B] font-bold hover:underline">
              Tech Innova
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
