'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, UserPlus, Users, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { testCrossWorkspaceIsolation } from '@/lib/workspace';
import { UserRole } from '@/lib/supabase/types';

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVO' | 'PENDIENTE';
}

export default function WorkspacePage() {
  const [members, setMembers] = useState<MemberItem[]>([
    { id: '1', name: 'Ana María García', email: 'ana@amgweddings.pe', role: 'OWNER', status: 'ACTIVO' },
    { id: '2', name: 'Carlos Mendoza', email: 'carlos@amgweddings.pe', role: 'ADMIN', status: 'ACTIVO' },
    { id: '3', name: 'Lucía Fernández', email: 'lucia@amgweddings.pe', role: 'COORDINADOR', status: 'ACTIVO' },
    { id: '4', name: 'Puerta Principal - Guardia 01', email: 'seguridad01@amgweddings.pe', role: 'SEGURIDAD', status: 'ACTIVO' },
  ]);

  const [testResults, setTestResults] = useState<{ passed: boolean; logs: string[] } | null>(null);

  const runIsolationTest = () => {
    const results = testCrossWorkspaceIsolation();
    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </Link>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
            Aislamiento Multi-Tenant Activo
          </span>
        </div>

        {/* Workspace Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workspace Activo</span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">AMG Wedding Planners</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Plan Activo: <span className="font-bold text-slate-800 font-mono">Starter (S/ 29/mes)</span></p>
            </div>
            <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm self-start sm:self-auto">
              <UserPlus className="w-4 h-4" /> Invitar Usuario
            </button>
          </div>
        </div>

        {/* Multi-tenant Isolation Test Battery */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-bold">Verificación de Aislamiento Multi-tenant (Caso 9)</h2>
            </div>
            <button
              onClick={runIsolationTest}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-lg transition"
            >
              Ejecutar Pruebas de Aislamiento
            </button>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            Demuestra que un usuario autenticado en Workspace A tiene acceso estrictamente denegado a datos de Workspace B (Prevención IDOR en backend y base de datos).
          </p>

          {testResults && (
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-2 text-xs font-mono">
              <div className="font-bold text-brand-400 mb-2">
                Resultado: {testResults.passed ? 'PASADO CON ÉXITO (100% AISLADO)' : 'FALLIDO'}
              </div>
              {testResults.logs.map((log, idx) => (
                <div key={idx} className="text-slate-200">{log}</div>
              ))}
            </div>
          )}
        </div>

        {/* Team Members List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" /> Miembros del Workspace y Roles
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Permisos Clave</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{member.name}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{member.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                        member.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                        member.role === 'SEGURIDAD' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {member.role === 'OWNER' && 'Control total + Facturación'}
                      {member.role === 'ADMIN' && 'Gestión eventos, QR y Mesas'}
                      {member.role === 'COORDINADOR' && 'Administración de eventos'}
                      {member.role === 'SEGURIDAD' && 'Solo escaneo QR en smartphone'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
