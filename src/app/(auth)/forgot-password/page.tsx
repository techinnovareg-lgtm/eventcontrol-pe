'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4 selection:bg-[#C5A059] selection:text-white">
      <div className="max-w-md w-full card-luxury p-8 space-y-6 shadow-xl border border-[#C5A059]/30">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block group">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-[#C5A059]/40 mx-auto group-hover:scale-105 transition-transform">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover"
              />
            </div>
          </Link>
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Recuperar Contraseña</h2>
          <p className="text-xs text-slate-500">Ingresa tu correo registrado para recibir instrucciones</p>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <h4 className="font-bold text-emerald-800 text-sm">¡Correo enviado!</h4>
            <p className="text-xs text-emerald-700">
              Si tu correo se encuentra registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link href="/login" className="inline-block text-xs font-bold text-emerald-800 hover:underline pt-2">
              Volver al Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@eventcontrol.pe"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 gold-button font-bold text-xs rounded-xl transition shadow-md"
            >
              Enviar Enlace de Recuperación
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <Link href="/login" className="text-[#B8860B] font-bold hover:underline">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
