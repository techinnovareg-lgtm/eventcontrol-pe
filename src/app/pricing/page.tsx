'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ShieldCheck, ArrowLeft, Sparkles, HelpCircle } from 'lucide-react';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">EventControl<span className="text-brand-600">.pe</span></span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-brand-600 transition">
              Iniciar Sesión
            </Link>
            <Link href="/login" className="text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition shadow-sm">
              Acceso a Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-600" /> Tarifas Oficiales MVP Perú 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Planes diseñados para Wedding Planners y Agencias
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Aumenta el control de tus bodas y eventos sociales sin costos ocultos de mensajería.
          </p>

          {/* Monthly / Annual Toggle Switch */}
          <div className="pt-6 flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Facturación Mensual</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-8 bg-slate-900 rounded-full p-1 transition flex items-center relative"
            >
              <div
                className={`w-6 h-6 bg-brand-500 rounded-full shadow-md transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-bold flex items-center gap-1.5 ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
              Facturación Anual <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">2 Meses Gratis</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(Object.keys(PLAN_LIMITS) as PlanCode[]).map((code) => {
            const plan = PLAN_LIMITS[code];
            const price = isAnnual ? plan.annualPricePEN : plan.monthlyPricePEN;
            const isPopular = code === 'PROFESSIONAL';

            return (
              <div
                key={code}
                className={`bg-white rounded-3xl p-6 border transition flex flex-col justify-between relative ${
                  isPopular 
                    ? 'border-brand-500 shadow-xl ring-2 ring-brand-500/20' 
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white font-extrabold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full shadow">
                    Recomendado
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 min-h-[32px] mb-3">{plan.profile}</p>

                  <div className="my-3">
                    <span className="text-4xl font-extrabold text-slate-900">S/{price}</span>
                    <span className="text-slate-500 text-xs font-medium">{isAnnual ? ' / año' : ' / mes'}</span>
                  </div>

                  <ul className="space-y-2.5 border-t border-slate-100 pt-4 text-xs">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href="/login"
                    className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center shadow-sm ${
                      isPopular
                        ? 'bg-brand-600 hover:bg-brand-700 text-white'
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

        {/* Pricing Footnote */}
        <div className="text-center text-xs text-slate-500 max-w-2xl mx-auto bg-white p-4 rounded-xl border border-slate-200">
          * El plan Business con eventos activos ilimitados está sujeto a política de uso razonable. Los límites de los planes pueden modificarse desde configuración sin reprogramar el producto.
        </div>
      </main>
    </div>
  );
}
