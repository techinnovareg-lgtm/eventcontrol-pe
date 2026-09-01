'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  FileSpreadsheet, ArrowLeft, Upload, CheckCircle2, AlertTriangle, 
  Download, ArrowRight, Table as TableIcon, Layers, FileCheck
} from 'lucide-react';
import { 
  parseExcelFile, validateMappedRows, generateErrorReportExcel, 
  RawExcelSheet, ColumnMapping, ImportValidationResult 
} from '@/lib/excel-parser';
import { getEventById, saveEventGuestGroups } from '@/lib/events';

export default function ImportExcelPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = String(params.id || 'evt-102');
  const currentWorkspaceId = 'ws-a-1111';

  const event = getEventById(eventId, currentWorkspaceId);

  // Wizard Steps: 1 = Upload, 2 = Map, 3 = Validate & Import
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string>('');
  const [sheets, setSheets] = useState<RawExcelSheet[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);

  // Column Mappings
  const [mapping, setMapping] = useState<ColumnMapping>({
    groupNameCol: '',
    maxPassesCol: '',
    phoneCol: '',
    externalIdCol: '',
    notesCol: '',
  });

  // Validation Results
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);

  // Sample data fallback for testing
  const loadDemoExcel = () => {
    setFileName('lista_invitados_ejemplo.xlsx');
    const demoHeaders = ['INVITADOS', 'Pases'];
    const demoRows = [
      { INVITADOS: 'Mamami', Pases: '1', _rowNum: 3 },
      { INVITADOS: 'Lili , Lucho , Moico, Enamorada,Gaby , Sra. Ernestina', Pases: '6', _rowNum: 4 },
      { INVITADOS: 'Nathali , German ,Lula, Tati', Pases: '4', _rowNum: 6 },
      { INVITADOS: 'Nidia, Emo', Pases: '2', _rowNum: 7 },
      { INVITADOS: 'Pepe', Pases: '1', _rowNum: 8 },
      { INVITADOS: 'Melo , Nidia, Enamorado, Nico', Pases: '4', _rowNum: 9 },
      { INVITADOS: 'Miguel , Nicol', Pases: '2', _rowNum: 10 },
      { INVITADOS: 'Claudia , Jorge Matias', Pases: '3', _rowNum: 11 },
      { INVITADOS: 'Lapo , Gasdy', Pases: '2', _rowNum: 12 },
      { INVITADOS: 'Opal , Yovana', Pases: '2', _rowNum: 13 },
      { INVITADOS: 'Shen, Esposa', Pases: '2', _rowNum: 14 },
      { INVITADOS: 'Tato, Gardenia', Pases: '2', _rowNum: 15 },
      { INVITADOS: 'Gorky , Lucy', Pases: '2', _rowNum: 16 },
      { INVITADOS: 'Helsby, Mary', Pases: '2', _rowNum: 17 },
      { INVITADOS: 'Renan, Eli', Pases: '2', _rowNum: 18 },
      { INVITADOS: 'Melcocha, Yovana', Pases: '2', _rowNum: 19 },
      { INVITADOS: 'Reptilio , Esposa', Pases: '2', _rowNum: 20 },
      { INVITADOS: 'Piolin', Pases: '1', _rowNum: 21 },
      { INVITADOS: 'Lucho Jimenez y Esposa', Pases: '2', _rowNum: 22 },
      { INVITADOS: 'Luis Rodriguez y esposa', Pases: '2', _rowNum: 23 },
      { INVITADOS: 'Papás de Jorge', Pases: '2', _rowNum: 24 },
      { INVITADOS: 'Nacho y Esposa', Pases: '2', _rowNum: 25 },
      { INVITADOS: 'Hermano jorge y esposa', Pases: '2', _rowNum: 26 },
      { INVITADOS: 'Totita', Pases: '1', _rowNum: 27 },
      { INVITADOS: 'Hans y ñora', Pases: '2', _rowNum: 28 },
      { INVITADOS: 'Zancudo Percy', Pases: '1', _rowNum: 29 },
      { INVITADOS: 'Zinia', Pases: '1', _rowNum: 30 },
      { INVITADOS: 'Fila Vacía de Prueba', Pases: '', _rowNum: 31 },
      { INVITADOS: 'TOTAL', Pases: '50', _rowNum: 34 },
    ];

    setSheets([{ sheetName: 'Sheet1', headers: demoHeaders, rows: demoRows }]);
    setSelectedSheetIndex(0);
    setMapping({
      groupNameCol: 'INVITADOS',
      maxPassesCol: 'Pases',
      phoneCol: '',
    });
    setStep(2);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const parsedSheets = parseExcelFile(arrayBuffer);

    if (parsedSheets.length > 0) {
      setSheets(parsedSheets);
      setSelectedSheetIndex(0);

      // Auto-detect columns based on common names
      const headers = parsedSheets[0].headers;
      const groupCol = headers.find(h => /invitado|grupo|nombre|responsable/i.test(h)) || headers[0] || '';
      const passesCol = headers.find(h => /pase|cantidad|invitados|num/i.test(h)) || headers[1] || '';
      const phoneCol = headers.find(h => /tel[eé]fono|celular|phone|whatsapp/i.test(h)) || '';

      setMapping({
        groupNameCol: groupCol,
        maxPassesCol: passesCol,
        phoneCol: phoneCol,
      });

      setStep(2);
    }
  };

  const handleRunValidation = () => {
    if (!mapping.groupNameCol || !mapping.maxPassesCol) {
      alert('Debes seleccionar las columnas obligatorias: Grupo/Responsable y Cantidad de Pases.');
      return;
    }

    const currentSheet = sheets[selectedSheetIndex];
    const result = validateMappedRows(currentSheet.rows, mapping);
    setValidationResult(result);
    setStep(3);
  };

  const handleDownloadErrorReport = () => {
    if (!validationResult) return;
    const excelBytes = generateErrorReportExcel(validationResult.invalidRows);
    const blob = new Blob([excelBytes.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Errores_Importacion_${fileName || 'Excel'}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    if (!validationResult || validationResult.validCount === 0) return;

    const guestGroups = validationResult.validRows.map(r => ({
      event_id: eventId,
      workspace_id: currentWorkspaceId,
      group_name: r.groupName,
      max_passes: r.maxPasses,
      checked_in_count: 0,
      responsible_phone: r.phone,
      external_id: r.externalId,
      notes: r.notes,
      status: 'PENDIENTE' as const,
    }));

    saveEventGuestGroups(eventId, currentWorkspaceId, guestGroups);
    alert(`¡Éxito! Se han importado ${validationResult.validCount} grupos de invitados con ${validationResult.totalPasses} pases totales.`);
    router.push('/events');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Volver a Eventos
          </Link>
          <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-3 py-1 rounded-full">
            Evento: {event?.name || 'Boda / Evento Social'}
          </span>
        </div>

        {/* Header Title */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Asistente de Importación</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Cargar Invitados desde Excel / CSV</h1>
            <p className="text-xs text-slate-500 mt-0.5">Soporta mapeo dinámico de columnas y validación estricta antes de importar.</p>
          </div>
          <button
            onClick={loadDemoExcel}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Cargar Lista Ejemplo (.xlsx)
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            <div className={`py-2 rounded-xl transition ${step === 1 ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
              1. Seleccionar Archivo
            </div>
            <div className={`py-2 rounded-xl transition ${step === 2 ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
              2. Mapear Columnas
            </div>
            <div className={`py-2 rounded-xl transition ${step === 3 ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
              3. Validar e Importar
            </div>
          </div>
        </div>

        {/* STEP 1: FILE UPLOAD */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-10 transition bg-slate-50/50">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Arrastra tu archivo Excel o CSV aquí</h3>
              <p className="text-xs text-slate-500 mb-6">Formatos soportados: .xlsx, .xls, .csv</p>

              <label className="cursor-pointer inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-sm">
                <FileSpreadsheet className="w-4 h-4" /> Seleccionar Archivo Excel
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && sheets.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Mapeo de Columnas ({fileName})</h3>
                <p className="text-xs text-slate-500">Asocia las columnas de tu Excel con los campos requeridos por la plataforma.</p>
              </div>

              {sheets.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mr-2">Hoja:</label>
                  <select
                    value={selectedSheetIndex}
                    onChange={(e) => setSelectedSheetIndex(Number(e.target.value))}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {sheets.map((s, idx) => (
                      <option key={idx} value={idx}>{s.sheetName} ({s.rows.length} filas)</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Mapping Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mandatory Field 1 */}
              <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-200">
                <label className="block text-xs font-bold text-brand-900 uppercase tracking-wider mb-1">
                  Grupo / Responsable <span className="text-red-500">* (Obligatorio)</span>
                </label>
                <p className="text-xs text-brand-700 mb-2">Nombre visible del grupo o familia invitada.</p>
                <select
                  value={mapping.groupNameCol}
                  onChange={(e) => setMapping({ ...mapping, groupNameCol: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-300 rounded-lg text-sm bg-white font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar Columna --</option>
                  {sheets[selectedSheetIndex].headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Mandatory Field 2 */}
              <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-200">
                <label className="block text-xs font-bold text-brand-900 uppercase tracking-wider mb-1">
                  Cantidad de Pases <span className="text-red-500">* (Obligatorio)</span>
                </label>
                <p className="text-xs text-brand-700 mb-2">Número máximo de personas autorizadas.</p>
                <select
                  value={mapping.maxPassesCol}
                  onChange={(e) => setMapping({ ...mapping, maxPassesCol: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-300 rounded-lg text-sm bg-white font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar Columna --</option>
                  {sheets[selectedSheetIndex].headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Optional Field 1 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teléfono Responsable (Opcional)
                </label>
                <p className="text-xs text-slate-500 mb-2">Para habilitar envío asistido por WhatsApp.</p>
                <select
                  value={mapping.phoneCol || ''}
                  onChange={(e) => setMapping({ ...mapping, phoneCol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- Sin asignar / No incluir --</option>
                  {sheets[selectedSheetIndex].headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Wizard Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Atrás
              </button>
              <button
                onClick={handleRunValidation}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
              >
                Validar Registros <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VALIDATION SUMMARY & PREVIEW (CASO 10) */}
        {step === 3 && validationResult && (
          <div className="space-y-6">
            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span className="text-xs text-slate-500 font-semibold uppercase block">Total Filas</span>
                <strong className="text-3xl font-extrabold text-slate-900">{validationResult.totalRows}</strong>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm text-center bg-emerald-50/50">
                <span className="text-xs text-emerald-700 font-semibold uppercase block">Registros Válidos</span>
                <strong className="text-3xl font-extrabold text-emerald-600">{validationResult.validCount}</strong>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm text-center bg-red-50/50">
                <span className="text-xs text-red-700 font-semibold uppercase block">Registros con Error</span>
                <strong className="text-3xl font-extrabold text-red-600">{validationResult.errorCount}</strong>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-brand-200 shadow-sm text-center bg-brand-50/50">
                <span className="text-xs text-brand-800 font-semibold uppercase block">Pases Autorizados</span>
                <strong className="text-3xl font-extrabold text-brand-600">{validationResult.totalPasses}</strong>
              </div>
            </div>

            {/* Error Report Banner (Caso 10) */}
            {validationResult.errorCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Se detectaron {validationResult.errorCount} filas inválidas u omitidas</h4>
                    <p className="text-xs text-amber-700">Filas vacías, totales o sin pases válidos fueron aisladas automáticamente para prevenir corrupción de datos.</p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadErrorReport}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shrink-0"
                >
                  <Download className="w-4 h-4" /> Descargar Reporte de Errores (.xlsx)
                </button>
              </div>
            )}

            {/* Valid Rows Preview Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Vista Previa de Grupos Válidos a Importar ({validationResult.validCount})
              </h3>

              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-4"># Fila</th>
                      <th className="py-2.5 px-4">Grupo / Responsable</th>
                      <th className="py-2.5 px-4">Pases Autorizados</th>
                      <th className="py-2.5 px-4">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validationResult.validRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-4 text-slate-400 font-mono">{r.rowNumber}</td>
                        <td className="py-2 px-4 font-semibold text-slate-900">{r.groupName}</td>
                        <td className="py-2 px-4 font-bold text-brand-600">{r.maxPasses}</td>
                        <td className="py-2 px-4 text-slate-500">{r.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Volver al Mapeo
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={validationResult.validCount === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-3 rounded-xl transition shadow-md disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" /> Confirmar e Importar {validationResult.validCount} Grupos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
