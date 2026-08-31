'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, Users, ShieldCheck, UserPlus, Lock, Key, 
  ArrowLeft, CheckCircle2, AlertTriangle, Play 
} from 'lucide-react';
import { testCrossWorkspaceIsolation } from '@/lib/workspace';

export default function WorkspaceManagementPage() {
  const currentWorkspaceId = 'ws-a-1111';
  const [isolationResult, setIsolationResult] = useState<{ passed: boolean; logs: string[] } | null>(null);

  const handleRunIsolationTest = () => {
    const res = testCrossWorkspaceIsolation();
    setIsolationResult(res);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059] selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-[#C5A059]/20 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
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
                Configuración del Workspace
              </span>
            </div>
          </Link>

          <Link href="/dashboard" className="text-xs text-slate-600 hover:text-[#C5A059] font-bold flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 w-full">
        {/* Title Bar */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">Espacio de Trabajo</span>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">AMG Wedding Planners</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Plan Activo: <span className="font-bold text-[#1A1A1A]">Starter (S/ 29/mes)</span></p>
          </div>

          <button className="gold-button font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 self-start sm:self-auto">
            <UserPlus className="w-4 h-4" /> Invitar Usuario al Equipo
          </button>
        </div>

        {/* Team Members List */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#B8860B]" /> Equipo y Permisos RBAC (5 Roles)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4">Alcance de Permisos</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">Ana María González (ana@amgweddings.pe)</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">OWNER (Propietario)</td>
                  <td className="py-3 px-4 text-slate-600">Acceso total, facturación, usuarios y eventos</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">Activo</span></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">Carlos Pérez (carlos@amgweddings.pe)</td>
                  <td className="py-3 px-4 font-bold text-indigo-700">COORDINADOR</td>
                  <td className="py-3 px-4 text-slate-600">Edición de eventos, invitados, mesas y cortes</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">Activo</span></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">Operador Seguridad Puerta 1 (puerta1@amgweddings.pe)</td>
                  <td className="py-3 px-4 font-bold text-amber-800">SEGURIDAD (Puerta)</td>
                  <td className="py-3 px-4 text-slate-600">Escaneo de QR y registro de check-in únicamente</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">Activo</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* AUTOMATED MULTI-TENANT ISOLATION SECURITY AUDITOR */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">Seguridad Multi-Tenant (RLS)</span>
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Prueba Automatizada de Aislamiento IDOR</h3>
              <p className="text-xs text-slate-500">Verifica que un usuario del Workspace A no pueda acceder a datos del Workspace B.</p>
            </div>

            <button
              onClick={handleRunIsolationTest}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-2 shrink-0"
            >
              <Play className="w-4 h-4 text-emerald-400" /> Ejecutar Test de Aislamiento (Caso 9)
            </button>
          </div>

          {isolationResult && (
            <div className={`p-4 rounded-xl text-xs font-mono space-y-1 ${
              isolationResult.passed ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-red-50 border border-red-300 text-red-900'
            }`}>
              <div className="font-bold flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> {isolationResult.passed ? 'RESULTADO: 100% AISLADO (IDOR SAFE)' : 'FALLO DE SEGURIDAD'}
              </div>
              {isolationResult.logs.map((log, idx) => (
                <p key={idx}>{log}</p>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
