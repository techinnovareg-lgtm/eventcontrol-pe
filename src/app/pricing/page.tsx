'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowLeft, Sparkles, X, MessageSquare, Mail, Phone, ExternalLink } from 'lucide-react';
import { PLAN_LIMITS, PlanCode } from '@/lib/plans';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ code: PlanCode; name: string; price: number } | null>(null);

  const handleSelectPlan = (code: PlanCode) => {
    const plan = PLAN_LIMITS[code];
    const price = isAnnual ? plan.annualPricePEN : plan.monthlyPricePEN;
    setSelectedPlan({ code, name: plan.name, price });
  };

  const getWhatsAppLink = () => {
    if (!selectedPlan) return '#';
    const text = encodeURIComponent(
      `Hola Tech Innova, deseo adquirir el Plan ${selectedPlan.name} (S/ ${selectedPlan.price.toFixed(2)} ${isAnnual ? '/ año' : '/ mes'}) para EventControl.pe. ¿Podrían brindarme información y los pasos para el alta?`
    );
    return `https://wa.me/51947515529?text=${text}`;
  };

  const getEmailLink = () => {
    if (!selectedPlan) return '#';
    const subject = encodeURIComponent(`Solicitud de Plan ${selectedPlan.name} - EventControl.pe`);
    const body = encodeURIComponent(
      `Hola equipo de Tech Innova,\n\nEstoy interesado en adquirir el Plan ${selectedPlan.name} (S/ ${selectedPlan.price.toFixed(2)} ${isAnnual ? '/ año' : '/ mes'}) para mi empresa de eventos.\n\nPor favor contáctenme para proceder con la activación.\n\nGracias.`
    );
    return `mailto:tech.innova.reg@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white relative">
      {/* Navigation Header */}
      <header className="border-b border-[#C5A059]/20 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-xs font-extrabold text-[#B8860B] hover:text-slate-900 transition bg-amber-50 px-3.5 py-2 rounded-xl border border-[#C5A059]/40 shadow-sm"
              title="Volver a la Página Principal"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Inicio
            </Link>

            <Link href="/" className="hidden sm:flex items-center gap-3 group border-l border-slate-200 pl-4">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md border border-[#C5A059]/30 group-hover:scale-105 transition-transform">
                <Image 
                  src="/logo-eventcontrol.jpg" 
                  alt="EventControl.pe Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-[#1A1A1A] font-serif block">
                  EventControl<span className="text-[#C5A059]">.pe</span>
                </span>
              </div>
            </Link>
          </div>

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
            <Sparkles className="w-4 h-4 text-[#C5A059]" /> Tarifas Oficiales 2026
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
                    <span className="text-4xl font-extrabold text-[#1A1A1A]">S/ {price.toFixed(2)}</span>
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
                  <button
                    onClick={() => handleSelectPlan(code)}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs transition flex items-center justify-center shadow-md ${
                      isPopular
                        ? 'gold-button'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    Elegir Plan {plan.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Developer Credit & Support Footer */}
        <div className="text-center text-xs text-slate-500 max-w-2xl mx-auto bg-white p-4 rounded-2xl border border-[#C5A059]/30 space-y-2 shadow-sm">
          <p>* El plan Business con eventos activos ilimitados está sujeto a política de uso razonable.</p>
          <div className="pt-1 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-600 font-semibold">
            <span>Tech Innova WhatsApp: <strong className="text-slate-900">+51 947 515 529</strong></span>
            <span>Email: <strong className="text-slate-900">tech.innova.reg@gmail.com</strong></span>
          </div>
        </div>
      </main>

      {/* PLAN DISPATCH SELECTION MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-[#C5A059] shadow-2xl space-y-6 relative">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-[#B8860B] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Plan Seleccionado
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                Plan {selectedPlan.name} (S/ {selectedPlan.price.toFixed(2)} {isAnnual ? '/ año' : '/ mes'})
              </h2>
              <p className="text-xs text-slate-600">
                Elige cómo deseas solicitar la activación de tu plan con el equipo oficial de <strong>Tech Innova</strong>:
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm flex items-center justify-between shadow-lg transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Solicitar por WhatsApp</span>
                    <span className="text-[11px] font-normal text-white/90">Envío de mensaje automático a +51 947 515 529</span>
                  </div>
                </div>
                <span>→</span>
              </a>

              <a
                href={getEmailLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-between shadow-lg transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Solicitar por Correo Electrónico</span>
                    <span className="text-[11px] font-normal text-slate-300">tech.innova.reg@gmail.com</span>
                  </div>
                </div>
                <span>→</span>
              </a>
            </div>

            <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
              ¿Ya tienes una cuenta registrada?{' '}
              <Link href="/login" className="text-[#B8860B] font-bold hover:underline">
                Inicia Sesión aquí
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
