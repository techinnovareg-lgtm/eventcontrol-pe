'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckSquare, KeyRound, AlertTriangle, RefreshCw, ArrowLeft, Home, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  setActiveSession, SUPER_ADMIN_EMAIL, isDeviceRemembered, rememberDevice,
  generateAndSendSuperAdmin2FAPin, verifySuperAdmin2FAPin, getAllAdminAccounts,
  verifySuperAdminPassword, authenticateAdminAccountAsync 
} from '@/lib/superadmin-store';
import { authenticateWorkspaceMemberAsync, findMemberByEmail, isCredentialsExpired, formatExpirationDate } from '@/lib/workspace-users';
import { getWorkspaceEvents, getWorkspaceEventsAsync } from '@/lib/events';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDeviceChecked, setRememberDeviceChecked] = useState(false);
  
  // 2FA Verification Modal State for tech.innova.reg@gmail.com
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorPin, setTwoFactorPin] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState<string | undefined>(undefined);
  const [twoFactorTimestamp, setTwoFactorTimestamp] = useState<number | undefined>(undefined);
  const [pinError, setPinError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const inputEmail = email.trim().toLowerCase();

    if (!inputEmail) {
      setErrorMsg('Por favor ingrese su correo electrónico.');
      setLoading(false);
      return;
    }

    if (!password || password.trim().length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      setLoading(false);
      return;
    }

    // Mandatory Super Admin Check: ONLY tech.innova.reg@gmail.com can access Super Admin
    if (inputEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      const isPassValid = verifySuperAdminPassword(password);
      if (!isPassValid) {
        setErrorMsg('Contraseña de Superadmin incorrecta. Verifique sus datos o contacte con soporte.');
        setLoading(false);
        return;
      }

      if (isDeviceRemembered()) {
        setActiveSession({
          user: {
            id: 'usr-super-admin',
            email: SUPER_ADMIN_EMAIL,
            name: 'Tech Innova Super Admin',
            role: 'SUPER_USER',
          },
        });
        router.push('/superadmin');
      } else {
        const pinRes = await generateAndSendSuperAdmin2FAPin();
        setTwoFactorToken(pinRes.token);
        setTwoFactorTimestamp(pinRes.timestamp);
        setShow2FAModal(true);
        setResendNotice('Se ha despachado un código PIN de 4 dígitos a tech.innova.reg@gmail.com.');
      }
      setLoading(false);
      return;
    }

    // Client Administrator Login Verification
    let authUser = null;
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password,
      });

      if (!authError && authData?.user) {
        authUser = authData.user;
      }
    } catch (err: any) {
      console.warn('[Supabase Auth Network Notice]', err);
    }

    if (authUser) {
      const wsId = authUser.user_metadata?.workspaceId || 'ws-a-1111';
      setActiveSession({
        user: {
          id: authUser.id,
          email: authUser.email || inputEmail,
          name: authUser.user_metadata?.name || 'Administrador de Evento',
          role: 'ADMIN',
          workspaceId: wsId,
        },
      });
      const userEvents = await getWorkspaceEventsAsync(wsId);
      const targetEvtId = userEvents[0]?.id;
      router.push(targetEvtId ? `/dashboard?eventId=${targetEvtId}` : '/dashboard');
      return;
    }

    // Check against registered accounts store (with cross-device central API fallback)
    const matchedAccount = await authenticateAdminAccountAsync(inputEmail, password);
    if (matchedAccount) {
      if (matchedAccount.status === 'SUSPENDIDA' || matchedAccount.status === 'VENCIDA') {
        setErrorMsg(`Acceso denegado: Su cuenta se encuentra ${matchedAccount.status.toLowerCase()}. Contacte al soporte de Tech Innova.`);
        setLoading(false);
        return;
      }

      setActiveSession({
        user: {
          id: matchedAccount.id,
          email: matchedAccount.contactEmail,
          name: matchedAccount.companyName || matchedAccount.adminName,
          role: 'ADMIN',
          workspaceId: matchedAccount.workspaceId,
        },
      });

      const userEvents = await getWorkspaceEventsAsync(matchedAccount.workspaceId);
      const targetEvtId = userEvents[0]?.id;
      router.push(targetEvtId ? `/dashboard?eventId=${targetEvtId}` : '/dashboard');
      return;
    }

    // Check against sub-users / team members store (with cross-device central API fallback)
    const matchedSubUser = await authenticateWorkspaceMemberAsync(inputEmail, password);
    if (matchedSubUser) {
      setActiveSession({
        user: {
          id: matchedSubUser.id,
          email: matchedSubUser.email,
          name: matchedSubUser.name,
          role: matchedSubUser.role === 'OPERATOR' ? 'OPERATOR' : 'ADMIN',
          workspaceId: matchedSubUser.workspaceId,
          eventId: matchedSubUser.eventId,
        },
      });

      if (matchedSubUser.role === 'OPERATOR') {
        const scanRoute = matchedSubUser.eventId ? `/scan?event=${matchedSubUser.eventId}` : '/scan';
        router.push(scanRoute);
      } else {
        const subUserEvents = await getWorkspaceEventsAsync(matchedSubUser.workspaceId);
        const targetEvtId = subUserEvents[0]?.id;
        router.push(targetEvtId ? `/dashboard?eventId=${targetEvtId}` : '/dashboard');
      }
      return;
    }

    // Check if sub-user exists but credentials expired or status is inactive
    const existingMember = findMemberByEmail(inputEmail);
    if (existingMember) {
      if (existingMember.status === 'INACTIVO') {
        setErrorMsg('Acceso denegado: Su cuenta de colaborador se encuentra inactiva. Contacte a su administrador.');
        setLoading(false);
        return;
      }
      if (existingMember.credentialsExpiresAt && isCredentialsExpired(existingMember.credentialsExpiresAt)) {
        const expFormatted = formatExpirationDate(existingMember.credentialsExpiresAt);
        setErrorMsg(`✕ CREDENCIALES VENCIDAS: Sus credenciales expiraron el ${expFormatted}. Contacte al usuario principal para renovar su acceso.`);
        setLoading(false);
        return;
      }
    }

    // Strict Rejection for unregistered emails or invalid credentials
    setErrorMsg('Credenciales inválidas o correo no registrado en EventControl.pe. Verifique sus datos o contacte a su administrador.');
    setLoading(false);
  };

  const handleVerify2FAPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const isValid = await verifySuperAdmin2FAPin(twoFactorPin, twoFactorToken, twoFactorTimestamp);

    if (isValid) {
      if (rememberDeviceChecked) {
        rememberDevice(true);
      }
      setActiveSession({
        user: {
          id: 'usr-super-admin',
          email: SUPER_ADMIN_EMAIL,
          name: 'Tech Innova Super Admin',
          role: 'SUPER_USER',
        },
      });
      setShow2FAModal(false);
      router.push('/superadmin');
    } else {
      setPinError('Código PIN incorrecto o expirado. Revisa tu correo tech.innova.reg@gmail.com.');
    }
  };

  const handleResendPin = async () => {
    const pinRes = await generateAndSendSuperAdmin2FAPin();
    setTwoFactorToken(pinRes.token);
    setTwoFactorTimestamp(pinRes.timestamp);
    setResendNotice('Se ha re-enviado un nuevo código PIN de 4 dígitos a la bandeja de tech.innova.reg@gmail.com.');
    setTimeout(() => setResendNotice(null), 6000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4 selection:bg-[#C5A059] selection:text-white">
      <div className="max-w-md w-full card-luxury p-8 space-y-6 shadow-xl border border-[#C5A059]/40">
        
        {/* Official Trademark Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block group" title="Ir a la Página Principal">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-[#C5A059]/40 mx-auto group-hover:scale-105 transition-transform">
              <Image 
                src="/logo-eventcontrol.jpg" 
                alt="EventControl.pe Logo" 
                fill 
                className="object-cover"
              />
            </div>
          </Link>
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Acceso a la Plataforma</h2>
          <p className="text-xs text-slate-500">Ingresa con tus credenciales asignadas de EventControl.pe</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@empresa.pe"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-[#B8860B] transition focus:outline-none p-0.5"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Recordar Dispositivo / Navegador Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-slate-600 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDeviceChecked}
                onChange={(e) => setRememberDeviceChecked(e.target.checked)}
                className="w-4 h-4 rounded text-[#C5A059] focus:ring-[#C5A059] border-slate-300"
              />
              <span>Recordar este dispositivo / navegador</span>
            </label>

            <Link href="/forgot-password" className="text-[#B8860B] hover:underline font-bold">
              ¿Olvidaste tu clave?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#DBBB6E' }}
            className="w-full py-3.5 text-white font-extrabold text-xs rounded-xl transition shadow-md hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión en el Sistema'} <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>

        {/* Bottom Return to Landing Link */}
        <div className="pt-3 border-t border-slate-100 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-[#B8860B] font-bold inline-flex items-center gap-1.5 transition">
            <Home className="w-3.5 h-3.5 text-[#B8860B]" /> Volver al Inicio Web Oficial
          </Link>
        </div>
      </div>

      {/* 2-STEP VERIFICATION TOKEN / PIN MODAL FOR SUPER ADMIN (PIN SECURELY DISPATCHED TO EMAIL, NOT DISPLAYED IN DOM) */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-up">
          <div className="max-w-md w-full card-luxury p-6 shadow-2xl border-2 border-[#C5A059] space-y-4 text-center">
            
            <div className="w-14 h-14 bg-amber-50 text-[#B8860B] rounded-2xl border border-[#C5A059]/40 flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Verificación de 2 Pasos (2FA)</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Se ha enviado un código de seguridad de 4 dígitos a la bandeja de <strong className="text-slate-900 font-mono">tech.innova.reg@gmail.com</strong>.
              </p>
            </div>

            {resendNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-medium">
                {resendNotice}
              </div>
            )}

            {pinError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerify2FAPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Ingresa el PIN de 4 Dígitos
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  value={twoFactorPin}
                  onChange={(e) => setTwoFactorPin(e.target.value)}
                  placeholder="••••"
                  className="w-44 px-4 py-3 bg-white border-2 border-[#C5A059] rounded-xl text-center text-2xl font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="modalRemember"
                  checked={rememberDeviceChecked}
                  onChange={(e) => setRememberDeviceChecked(e.target.checked)}
                  className="w-4 h-4 text-[#C5A059] rounded border-slate-300 cursor-pointer"
                />
                <label htmlFor="modalRemember" className="text-slate-700 font-medium cursor-pointer">
                  Recordar este dispositivo / navegador
                </label>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResendPin}
                  className="text-xs text-[#B8860B] hover:underline font-bold inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Re-enviar código a tech.innova.reg@gmail.com
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#DBBB6E' }}
                  className="w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md text-xs hover:brightness-110"
                >
                  Verificar & Acceder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
