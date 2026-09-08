'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  FileSpreadsheet, ArrowLeft, Upload, CheckCircle2, AlertTriangle, 
  Download, ArrowRight, Table as TableIcon, Layers, FileCheck, FileText, Sparkles,
  Trash2, Edit3, UserCheck, Users, RefreshCw
} from 'lucide-react';
import { 
  parseExcelFile, validateMappedRows, generateErrorReportExcel, generateTemplateExcel,
  RawExcelSheet, ColumnMapping, ImportValidationResult 
} from '@/lib/excel-parser';
import { getEventById, saveEventGuestGroups, getEventGuestGroups, deleteEventGuestGroups } from '@/lib/events';
import { getActiveSession, getAccountForSession } from '@/lib/superadmin-store';
import { GuestGroup } from '@/lib/supabase/types';
import EventNavHeader from '@/components/EventNavHeader';

type WizardStep = 1 | 2 | 3;

export default function ExcelImportWizardPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = String(params.id || 'evt-102');

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws-a-1111');
  const [existingGroups, setExistingGroups] = useState<GuestGroup[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const session = getActiveSession();
    const account = getAccountForSession();
    const wsId = session?.user?.workspaceId || account?.workspaceId || 'ws-a-1111';
    setCurrentWorkspaceId(wsId);
    setExistingGroups(getEventGuestGroups(eventId));
  }, [eventId]);

  const refreshGuestGroups = () => {
    setExistingGroups(getEventGuestGroups(eventId));
  };

  const event = getEventById(eventId, currentWorkspaceId);

  // Wizard Steps: 1 = Upload, 2 = Map, 3 = Validate & Import
  const [step, setStep] = useState<WizardStep>(1);
  const [fileName, setFileName] = useState<string>('');
  const [sheets, setSheets] = useState<RawExcelSheet[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);

  const handleReimport = () => {
    setStep(1);
    setFileName('');
    setSheets([]);
    setValidationResult(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Column Mappings
  const [mapping, setMapping] = useState<ColumnMapping>({
    groupNameCol: '',
    maxPassesCol: '',
    phoneCol: '',
    responsibleCol: '',
    externalIdCol: '',
    notesCol: '',
  });

  // Validation Results
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);

  // Download official Excel template matching Formato_ejemplo.xlsx
  const handleDownloadTemplate = () => {
    const excelBytes = generateTemplateExcel(event?.name);
    const blob = new Blob([excelBytes.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Modelo_Importacion_Invitados_EventControl.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sample data fallback for testing matching Formato_ejemplo.xlsx
  const loadDemoExcel = () => {
    setFileName('Formato_ejemplo.xlsx');
    const demoHeaders = ['PASES O GRUPOS', 'NRO DE PERSONAS', 'RESPONSABLE GRUPO/PASE', 'NRO DE TELÉFONO (WhatsApp)'];
    const demoRows = [
      { 'PASES O GRUPOS': 'Juan', 'NRO DE PERSONAS': '1', 'RESPONSABLE GRUPO/PASE': 'Juan', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 5 },
      { 'PASES O GRUPOS': 'Lili , Lucho , Moico, Enamorada,Gaby , Sra. Ernestina', 'NRO DE PERSONAS': '6', 'RESPONSABLE GRUPO/PASE': 'Lucho', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 6 },
      { 'PASES O GRUPOS': 'Nathali , German ,Lula, Tati', 'NRO DE PERSONAS': '4', 'RESPONSABLE GRUPO/PASE': 'Lili', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 7 },
      { 'PASES O GRUPOS': 'Nidia, Emo', 'NRO DE PERSONAS': '2', 'RESPONSABLE GRUPO/PASE': 'Nidia', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 8 },
      { 'PASES O GRUPOS': 'Pepe', 'NRO DE PERSONAS': '1', 'RESPONSABLE GRUPO/PASE': 'Pepe', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 9 },
      { 'PASES O GRUPOS': 'Melo , Nidia, Enamorado, Nico', 'NRO DE PERSONAS': '4', 'RESPONSABLE GRUPO/PASE': 'Melo', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 10 },
      { 'PASES O GRUPOS': 'Miguel , Nicol', 'NRO DE PERSONAS': '2', 'RESPONSABLE GRUPO/PASE': 'Miguel', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 11 },
      { 'PASES O GRUPOS': 'Claudia , Jorge Matias', 'NRO DE PERSONAS': '3', 'RESPONSABLE GRUPO/PASE': 'Claudia', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 12 },
      { 'PASES O GRUPOS': 'Lapo , Gasdy', 'NRO DE PERSONAS': '2', 'RESPONSABLE GRUPO/PASE': 'Lapo', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 13 },
      { 'PASES O GRUPOS': 'Opal , Yovana', 'NRO DE PERSONAS': '2', 'RESPONSABLE GRUPO/PASE': 'Opal', 'NRO DE TELÉFONO (WhatsApp)': '912345678', _rowNum: 14 },
    ];

    setSheets([{ sheetName: 'Hoja1', headers: demoHeaders, rows: demoRows }]);
    setSelectedSheetIndex(0);
    setMapping({
      groupNameCol: 'PASES O GRUPOS',
      maxPassesCol: 'NRO DE PERSONAS',
      responsibleCol: 'RESPONSABLE GRUPO/PASE',
      phoneCol: 'NRO DE TELÉFONO (WhatsApp)',
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

      // Auto-detect columns accurately matching "PASES O GRUPOS" and "NRO DE PERSONAS"
      const headers = parsedSheets[0].headers;
      
      const groupCol = headers.find(h => /^pases\s*o\s*grupos$/i.test(h.trim()))
        || headers.find(h => /pases|grupos|invitado|lista/i.test(h) && !/personas|nro|cantidad/i.test(h))
        || headers.find(h => /nombre/i.test(h))
        || headers[0] || '';

      const passesCol = headers.find(h => /^nro\s*de\s*personas$/i.test(h.trim()))
        || headers.find(h => /nro\s*de\s*personas|personas|cantidad|pases\s*autorizados|num\s*personas/i.test(h))
        || headers.find(h => /nro|num/i.test(h) && !/grupos|lista/i.test(h))
        || headers[1] || '';

      const respCol = headers.find(h => /responsable/i.test(h)) || '';
      const phoneCol = headers.find(h => /tel[eé]fono|celular|whatsapp|phone/i.test(h)) || '';

      setMapping({
        groupNameCol: groupCol,
        maxPassesCol: passesCol,
        responsibleCol: respCol,
        phoneCol: phoneCol,
      });

      setStep(2);
    }
  };

  const handleRunValidation = () => {
    if (!mapping.groupNameCol || !mapping.maxPassesCol) {
      alert('Debes seleccionar las columnas obligatorias: Pases/Grupos y Cantidad de Personas.');
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
      notes: r.responsible ? `Responsable: ${r.responsible}` : r.notes || '',
      status: 'PENDIENTE' as const,
    }));

    saveEventGuestGroups(eventId, currentWorkspaceId, guestGroups);
    refreshGuestGroups();
    alert(`¡Éxito! Se han importado ${validationResult.validCount} pases/grupos de invitados con ${validationResult.totalPasses} personas autorizadas totales.`);
    setStep(1);
  };

  const handleClearAllGuests = () => {
    if (confirm(`¿Estás seguro de eliminar y limpiar toda la lista de ${existingGroups.length} pases cargados para este evento? Esta acción permitirá subir un nuevo archivo Excel.`)) {
      deleteEventGuestGroups(eventId);
      refreshGuestGroups();
      alert('La lista de invitados ha sido eliminada exitosamente. Puedes proceder a cargar un nuevo archivo Excel.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col select-none">
      <EventNavHeader currentTab="import" eventId={eventId} eventName={event?.name} />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full">

        {/* Header Title Bar */}
        <div className="card-luxury p-6 border border-[#C5A059]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest block">Asistente de Importación Oficial</span>
              <span className="text-[11px] font-serif font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-[#C5A059]/40 shadow-2xs">
                🍷 Evento: {event?.name}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">Cargar Pases e Invitados desde Excel / CSV</h1>
            <p className="text-xs text-slate-500 mt-0.5">Basado en el formato oficial de la plataforma (PASES O GRUPOS, NRO DE PERSONAS, RESPONSABLE, TELÉFONO).</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              style={{ backgroundColor: '#DBBB6E' }}
              className="flex items-center gap-2 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-md hover:brightness-110"
            >
              <Download className="w-4 h-4 text-white" /> Descargar Modelo (.xlsx)
            </button>

            <button
              onClick={loadDemoExcel}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Cargar Formato Ejemplo
            </button>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="card-luxury p-4 border border-[#C5A059]/30 shadow-sm">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            <div className={`py-2 rounded-xl transition ${step === 1 ? 'bg-[#1A1A1A] text-white shadow-sm font-bold' : 'bg-slate-100 text-slate-600'}`}>
              1. Seleccionar Archivo
            </div>
            <div className={`py-2 rounded-xl transition ${step === 2 ? 'bg-[#1A1A1A] text-white shadow-sm font-bold' : 'bg-slate-100 text-slate-600'}`}>
              2. Mapear Columnas
            </div>
            <div className={`py-2 rounded-xl transition ${step === 3 ? 'bg-[#1A1A1A] text-white shadow-sm font-bold' : 'bg-slate-100 text-slate-600'}`}>
              3. Validar e Importar
            </div>
          </div>
        </div>

        {/* STEP 1: FILE UPLOAD */}
        {step === 1 && (
          <div className="card-luxury p-8 border border-[#C5A059]/30 shadow-md text-center space-y-6">
            <div className="border-2 border-dashed border-[#C5A059]/40 hover:border-[#C5A059] rounded-2xl p-10 transition bg-amber-50/20">
              <Upload className="w-12 h-12 text-[#B8860B] mx-auto mb-3" />
              <h3 className="text-base font-serif font-bold text-[#1A1A1A] mb-1">Arrastra tu archivo Excel (.xlsx) o CSV aquí</h3>
              <p className="text-xs text-slate-500 mb-6">Formatos soportados: .xlsx, .xls, .csv (Soporta títulos iniciales como en Formato_ejemplo.xlsx)</p>

              <div className="flex justify-center items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md">
                  <FileSpreadsheet className="w-4 h-4 text-[#C5A059]" /> Seleccionar Archivo Excel
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs px-5 py-3 rounded-xl transition shadow-sm"
                >
                  <Download className="w-4 h-4 text-[#B8860B]" /> Descargar Plantilla Modelo (.xlsx)
                </button>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 space-y-2">
              <strong className="font-bold block text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#B8860B]" /> Estructura Oficial del Modelo (.xlsx):
              </strong>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
                <div className="bg-white p-2 rounded-lg border border-amber-300">
                  <strong className="text-slate-900 block font-sans">1. PASES O GRUPOS</strong>
                  Ej: "Lili, Lucho, Moico, Gaby"
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-300">
                  <strong className="text-slate-900 block font-sans">2. NRO DE PERSONAS</strong>
                  Ej: 6 (Pases autorizados)
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-300">
                  <strong className="text-slate-900 block font-sans">3. RESPONSABLE GRUPO</strong>
                  Ej: "Lucho" (Contacto principal)
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-300">
                  <strong className="text-slate-900 block font-sans">4. NRO DE TELÉFONO</strong>
                  Ej: 912345678 (WhatsApp)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && sheets.length > 0 && (
          <div className="card-luxury p-6 border border-[#C5A059]/40 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Mapeo de Columnas ({fileName})</h3>
                <p className="text-xs text-slate-500">Asocia las columnas de tu Excel con los campos del sistema.</p>
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
              <div className="p-4 bg-amber-50/60 rounded-xl border border-[#C5A059]/40">
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1">
                  Pases o Grupos (Lista de Invitados) <span className="text-red-500">* (Obligatorio)</span>
                </label>
                <p className="text-xs text-amber-800 mb-2">Columna con nombres del pase o grupo (Ej: "PASES O GRUPOS").</p>
                <select
                  value={mapping.groupNameCol}
                  onChange={(e) => setMapping({ ...mapping, groupNameCol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                >
                  <option value="">-- Seleccionar Columna --</option>
                  {sheets[selectedSheetIndex].headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Mandatory Field 2 */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-[#C5A059]/40">
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1">
                  Nro de Personas (Pases Autorizados) <span className="text-red-500">* (Obligatorio)</span>
                </label>
                <p className="text-xs text-amber-800 mb-2">Número total de personas autorizadas (Ej: "NRO DE PERSONAS").</p>
                <select
                  value={mapping.maxPassesCol}
                  onChange={(e) => setMapping({ ...mapping, maxPassesCol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
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
                  Responsable Grupo / Pase (Opcional)
                </label>
                <p className="text-xs text-slate-500 mb-2">Contacto titular del grupo (Ej: "RESPONSABLE GRUPO/PASE").</p>
                <select
                  value={mapping.responsibleCol || ''}
                  onChange={(e) => setMapping({ ...mapping, responsibleCol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
                >
                  <option value="">-- Sin asignar / No incluir --</option>
                  {sheets[selectedSheetIndex].headers.map((h, idx) => (
                    <option key={idx} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Optional Field 2 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nro de Teléfono WhatsApp (Opcional)
                </label>
                <p className="text-xs text-slate-500 mb-2">Para envíos de invitaciones por WhatsApp (Ej: "NRO DE TELÉFONO").</p>
                <select
                  value={mapping.phoneCol || ''}
                  onChange={(e) => setMapping({ ...mapping, phoneCol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#C5A059] focus:outline-none"
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
                style={{ backgroundColor: '#DBBB6E' }}
                className="flex items-center gap-2 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-md hover:brightness-110"
              >
                Validar Registros <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VALIDATION SUMMARY & PREVIEW */}
        {step === 3 && validationResult && (
          <div className="space-y-6">
            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="card-luxury p-5 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold uppercase block">Total Filas</span>
                <strong className="text-3xl font-serif font-bold text-slate-900">{validationResult.totalRows}</strong>
              </div>
              <div className="card-luxury p-5 border border-emerald-200 bg-emerald-50/50 text-center">
                <span className="text-xs text-emerald-800 font-semibold uppercase block">Pases Válidos</span>
                <strong className="text-3xl font-serif font-bold text-emerald-800">{validationResult.validCount}</strong>
              </div>
              <div className="card-luxury p-5 border border-red-200 bg-red-50/50 text-center">
                <span className="text-xs text-red-800 font-semibold uppercase block">Filas Erróneas</span>
                <strong className="text-3xl font-serif font-bold text-red-800">{validationResult.errorCount}</strong>
              </div>
              <div className="card-luxury p-5 border border-[#C5A059]/40 bg-amber-50/50 text-center">
                <span className="text-xs text-amber-900 font-semibold uppercase block">Total Personas Autorizadas</span>
                <strong className="text-3xl font-serif font-bold text-[#B8860B]">{validationResult.totalPasses}</strong>
              </div>
            </div>

            {/* Error Report Banner */}
            {validationResult.errorCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Se detectaron {validationResult.errorCount} filas inválidas u omitidas</h4>
                    <p className="text-xs text-amber-700">Filas vacías o totales fueron aisladas automáticamente para prevenir corrupción de datos.</p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadErrorReport}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shrink-0"
                >
                  <Download className="w-4 h-4" /> Descargar Reporte de Errores (.xlsx)
                </button>
              </div>
            )}

            {/* Valid Rows Preview Table */}
            <div className="card-luxury border border-[#C5A059]/40 p-6 shadow-md">
              <h3 className="text-base font-serif font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Vista Previa de Pases e Invitados a Importar ({validationResult.validCount})
              </h3>

              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold text-slate-700 uppercase">
                    <tr>
                      <th className="py-2.5 px-4"># Fila</th>
                      <th className="py-2.5 px-4">Pases o Grupos (Invitados)</th>
                      <th className="py-2.5 px-4">Nro Personas</th>
                      <th className="py-2.5 px-4">Responsable</th>
                      <th className="py-2.5 px-4">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validationResult.validRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/30">
                        <td className="py-2 px-4 text-slate-400 font-mono">{r.rowNumber}</td>
                        <td className="py-2 px-4 font-semibold text-slate-900">{r.groupName}</td>
                        <td className="py-2 px-4 font-bold text-[#B8860B]">{r.maxPasses} pers.</td>
                        <td className="py-2 px-4 text-slate-700">{r.responsible || '-'}</td>
                        <td className="py-2 px-4 text-slate-500 font-mono">{r.phone || '-'}</td>
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
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition shadow-md disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" /> Confirmar e Importar {validationResult.validCount} Grupos
              </button>
            </div>
          </div>
        )}

        {/* SECTION: CURRENTLY IMPORTED GUEST LIST TABLE WITH DELETE & EDIT ACTIONS */}
        <div className="card-luxury p-6 border border-[#C5A059]/40 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#B8860B]" /> Lista de Invitados Registrada Actualmente ({existingGroups.length} Pases)
              </h3>
              <p className="text-xs text-slate-500">
                Total de personas autorizadas en este evento: <strong className="text-amber-900 font-bold">{existingGroups.reduce((sum, g) => sum + g.max_passes, 0)} personas</strong>.
              </p>
            </div>

            {existingGroups.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReimport}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-[#B8860B] font-bold text-xs rounded-xl border border-[#C5A059]/40 transition flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Re-importar / Reemplazar Excel
                </button>

                <button
                  type="button"
                  onClick={handleClearAllGuests}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar / Eliminar Lista
                </button>
              </div>
            )}
          </div>

          {existingGroups.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">Aún no hay invitados importados en este evento.</p>
              <p className="text-slate-500">Utiliza el asistente de arriba para cargar tu plantilla Excel o CSV.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 sticky top-0 border-b border-slate-300 font-bold text-slate-700 uppercase">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Pase / Grupo (Invitados)</th>
                    <th className="py-3 px-4">Nro Personas (Pases)</th>
                    <th className="py-3 px-4">Notas / Responsable</th>
                    <th className="py-3 px-4">Teléfono WhatsApp</th>
                    <th className="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {existingGroups.map((g, idx) => (
                    <tr key={g.id || idx} className="hover:bg-amber-50/40 transition">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{g.group_name}</td>
                      <td className="py-2.5 px-4 font-extrabold text-[#B8860B]">{g.max_passes} personas</td>
                      <td className="py-2.5 px-4 text-slate-600">{g.notes || '-'}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{g.responsible_phone || '-'}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          g.status === 'COMPLETO' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          g.status === 'PARCIAL' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
