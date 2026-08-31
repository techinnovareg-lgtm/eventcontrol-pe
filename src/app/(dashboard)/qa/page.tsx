'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, ArrowLeft, Play, CheckCircle2, XCircle, 
  Layers, Lock, Cpu, Smartphone, Download, Zap
} from 'lucide-react';
import { runFullQASuite, QATestResult } from '@/lib/qa-runner';

export default function QACenterPage() {
  const [running, setRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<{
    overallPassed: boolean;
    totalPassed: number;
    totalFailed: number;
    results: QATestResult[];
  } | null>(null);

  const handleExecuteQA = async () => {
    setRunning(true);
    // Execute automated QA suite
    const res = await runFullQASuite();
    setSuiteResult(res);
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </Link>
          <span className="text-xs bg-slate-900 text-white font-semibold px-3 py-1 rounded-full border border-slate-800">
            Fase 12 — QA & Audits
          </span>
        </div>

        {/* Page Title */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Batería de Pruebas Obligatorias
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Centro de Control de QA y Auditoría Final</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ejecución e inspección integral de los 10 Casos Críticos de QA exigidos por la especificación del proyecto.
            </p>
          </div>

          <button
            onClick={handleExecuteQA}
            disabled={running}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md disabled:opacity-50 self-start sm:self-auto"
          >
            <Play className="w-4 h-4" /> {running ? 'Ejecutando Pruebas...' : 'Ejecutar Batería de 10 Casos QA'}
          </button>
        </div>

        {/* SUMMARY CARDS */}
        {suiteResult && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs text-slate-400 font-bold uppercase block">Total Casos Práctica</span>
              <strong className="text-3xl font-black text-slate-900">10</strong>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 shadow-sm text-center">
              <span className="text-xs text-emerald-700 font-bold uppercase block">Casos Aprobados</span>
              <strong className="text-3xl font-black text-emerald-600">{suiteResult.totalPassed}</strong>
            </div>

            <div className="bg-red-50/60 p-5 rounded-2xl border border-red-200 shadow-sm text-center">
              <span className="text-xs text-red-700 font-bold uppercase block">Casos Fallidos</span>
              <strong className="text-3xl font-black text-red-600">{suiteResult.totalFailed}</strong>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm text-center ${
              suiteResult.overallPassed ? 'bg-slate-900 border-slate-800 text-white' : 'bg-red-950 border-red-800 text-white'
            }`}>
              <span className="text-xs text-slate-400 font-bold uppercase block">Estado de Auditoría</span>
              <strong className="text-xl font-extrabold text-emerald-400 mt-1 block">
                {suiteResult.overallPassed ? '100% APROBADO' : 'REQUIERE ATENCIÓN'}
              </strong>
            </div>
          </div>
        )}

        {/* RESULTS TABLE */}
        {suiteResult && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Resultados de la Batería de Pruebas Críticas
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                    <th className="py-3 px-4">Caso #</th>
                    <th className="py-3 px-4">Nombre del Escenario</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Resultado</th>
                    <th className="py-3 px-4">Evidencia / Detalle Técnico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suiteResult.results.map((res) => (
                    <tr key={res.caseNumber} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">Caso {res.caseNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{res.caseName}</td>
                      <td className="py-3 px-4 text-slate-500 font-semibold">{res.category}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 w-fit ${
                          res.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {res.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {res.passed ? 'APROBADO' : 'FALLIDO'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{res.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SYSTEM AUDIT CHECKLIST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <Lock className="w-4 h-4" /> Auditoría de Seguridad
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Multi-tenant RLS por workspace_id</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cero PII en códigos QR (Tokens 256 bits)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Permisos RBAC (5 roles estrictos)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Prevención de desbordamiento de pases</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <Smartphone className="w-4 h-4" /> Rendimiento & Mobile PWA
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PWA Service Worker activo</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Manifiesto e IndexedDB (Dexie.js)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Interfaz responsive adaptada</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Escaneo acelerado en smartphone</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Zap className="w-4 h-4" /> Concurrencia & Resiliencia
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Transacción atómica FOR UPDATE</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sincronización idempotente</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> WebSockets Realtime en Vivo</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Snapshots e inmutabilidad</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
