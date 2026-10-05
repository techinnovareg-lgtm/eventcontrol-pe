'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createAdminAccount, setActiveSession } from '@/lib/superadmin-store';

import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName || !email || !password) return;
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      const { account } = createAdminAccount({
        companyName: workspaceName.trim(),
        adminName: workspaceName.trim(),
        contactEmail: cleanEmail,
        planCode: 'STARTER',
        durationDays: 30,
        initialPassword: cleanPass,
      });

      // 1. Primary: Register account with Supabase Auth authority
      try {
        const supabase = createClient();
        await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: {
            data: {
              companyName: workspaceName.trim(),
              workspaceId: account.workspaceId,
              initialPassword: cleanPass,
              planCode: 'STARTER',
              role: 'ADMIN',
            },
          },
        });
      } catch (sbErr) {
        console.warn('[Supabase Auth Registration Notice]', sbErr);
      }

      // 2. Synchronously sync created account to central server DB authority
      await fetch('/api/auth/sync-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPSERT', account }),
      }).catch(() => {});

      setActiveSession({
        user: {
          id: account.id,
          email: account.contactEmail,
          name: account.companyName,
          role: 'ADMIN',
          workspaceId: account.workspaceId,
        },
      });

      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Crear Cuenta</h2>
          <p className="text-xs text-slate-500">Registra tu estudio o negocio de eventos (Plan Starter S/ 29.99)</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre de tu Negocio / Workspace
            </label>
            <input
              type="text"
              required
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Ej. AMG Wedding Planners"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@miestudio.pe"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 gold-button font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? 'Creando cuenta...' : 'Crear Workspace & Comenzar'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-[#B8860B] font-bold hover:underline">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
