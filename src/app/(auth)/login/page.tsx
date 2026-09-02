'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { setActiveSession } from '@/lib/superadmin-store';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Super Admin direct login check
    if (email.toLowerCase().includes('superadmin')) {
      setActiveSession({
        user: {
          id: 'usr-super-admin',
          email: 'superadmin@eventcontrol.pe',
          name: 'Super User (Admin de Admins)',
          role: 'SUPER_USER',
        },
      });
      router.push('/superadmin');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback demo access for event planner accounts
        setActiveSession({
          user: {
            id: 'usr-admin-01',
            email: email || 'ana@amgweddings.pe',
            name: 'Ana María Gamarra (AMG Weddings)',
            role: 'ADMIN',
            workspaceId: 'ws-a-1111',
          },
        });
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setEmail('demo@eventcontrol.pe');
    setPassword('demo123456');
    setActiveSession({
      user: {
        id: 'usr-admin-01',
        email: 'demo@eventcontrol.pe',
        name: 'AMG Wedding Planners (Demo)',
        role: 'ADMIN',
        workspaceId: 'ws-a-1111',
      },
    });
    router.push('/dashboard');
  };

  const handleSuperAdminLogin = () => {
    setEmail('superadmin@eventcontrol.pe');
    setPassword('superadmin123');
    setActiveSession({
      user: {
        id: 'usr-super-admin',
        email: 'superadmin@eventcontrol.pe',
        name: 'Super User (Admin de Admins)',
        role: 'SUPER_USER',
      },
    });
    router.push('/superadmin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4 selection:bg-[#C5A059] selection:text-white">
      <div className="max-w-md w-full card-luxury p-8 space-y-6 shadow-xl border border-[#C5A059]/30">
        
        {/* Official Trademark Logo */}
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
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Iniciar Sesión</h2>
          <p className="text-xs text-slate-500">Accede a tu Workspace de EventControl.pe</p>
        </div>

        {/* QUICK ACCESS DEMO BUTTONS */}
        <div className="space-y-2">
          <div className="p-3.5 bg-amber-50/80 border border-[#C5A059]/40 rounded-2xl text-center shadow-sm space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[#B8860B] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#C5A059]" /> Demostración de Event Planner
            </div>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 gold-button font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              Ingresar como Administrador de Evento <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-center shadow-sm space-y-2 border border-slate-800">
            <div className="flex items-center justify-center gap-1.5 text-[#DBBB6E] text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#DBBB6E]" /> Control Super Admin
            </div>
            <button
              type="button"
              onClick={handleSuperAdminLogin}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
              Ingresar como Super User (Admin de Admins) <ShieldCheck className="w-4 h-4 text-[#DBBB6E]" />
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase">O tus credenciales</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@amgweddings.pe o superadmin@eventcontrol.pe"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
            />
          </div>

          <div className="flex justify-end text-xs">
            <Link href="/forgot-password" className="text-[#B8860B] hover:underline font-semibold">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
