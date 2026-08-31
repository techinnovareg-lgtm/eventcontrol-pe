'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    const res = await runFullQASuite();
    setSuiteResult(res);
    setRunning(false);
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
                Fase 12 — QA & Audits
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
            <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" /> Batería de Pruebas Obligatorias
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">Centro de Control de QA y Auditoría Final</h1>
            <p className="text-xs text-slate-500">
              Ejecución e inspección integral de los 10 Casos Críticos de QA exigidos por la especificación del proyecto.
            </p>
          </div>

          <button
            onClick={handleExecuteQA}
            disabled={running}
            className="gold-button font-bold text-xs px-5 py-3 rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
          >
            <Play className="w-4 h-4 text-amber-100" /> {running ? 'Ejecutando Pruebas...' : 'Ejecutar Batería de 10 Casos QA'}
          </button>
        </div>

        {/* SUMMARY CARDS */}
        {suiteResult && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card-luxury p-5 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase block">Total Casos Práctica</span>
              <strong className="text-3xl font-serif font-black text-slate-900">10</strong>
            </div>

            <div className="card-luxury p-5 text-center bg-emerald-50/60 border border-emerald-200">
              <span className="text-xs text-emerald-800 font-bold uppercase block">Casos Aprobados</span>
              <strong className="text-3xl font-serif font-black text-emerald-700">{suiteResult.totalPassed}</strong>
            </div>

            <div className="card-luxury p-5 text-center bg-red-50/60 border border-red-200">
              <span className="text-xs text-red-800 font-bold uppercase block">Casos Fallidos</span>
              <strong className="text-3xl font-serif font-black text-red-700">{suiteResult.totalFailed}</strong>
            </div>

            <div className="card-luxury p-5 text-center bg-slate-900 text-white">
              <span className="text-xs text-slate-400 font-bold uppercase block">Estado de Auditoría</span>
              <strong className="text-xl font-serif font-extrabold text-[#C5A059] mt-1 block">
                {suiteResult.overallPassed ? '100% APROBADO' : 'REQUIERE ATENCIÓN'}
              </strong>
            </div>
          </div>
        )}

        {/* RESULTS TABLE */}
        {suiteResult && (
          <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md space-y-4">
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
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
      </main>
    </div>
  );
}
