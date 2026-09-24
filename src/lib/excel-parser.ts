import * as XLSX from 'xlsx';
import { GuestCompanion } from '@/lib/supabase/types';

export interface RawExcelSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  secondaryCompanionsMap?: Record<string, string[]>;
}

export interface ColumnMapping {
  groupNameCol: string;
  maxPassesCol: string;
  phoneCol?: string;
  responsibleCol?: string;
  companionCol?: string;
  externalIdCol?: string;
  notesCol?: string;
}

export interface ValidatedGuestRow {
  rowNumber: number;
  groupName: string;
  maxPasses: number;
  phone?: string;
  responsible?: string;
  externalId?: string;
  notes?: string;
  companions?: GuestCompanion[];
  isValid: boolean;
  errors: string[];
}

export interface ImportValidationResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  totalPasses: number;
  validRows: ValidatedGuestRow[];
  invalidRows: ValidatedGuestRow[];
}

export function isGenericCompanionName(str: string): boolean {
  if (!str) return true;
  const clean = str.trim().toLowerCase();
  if (clean.length < 2) return true;
  if (/^[x?*\-_\s]+$/.test(clean)) return true;
  
  const genericKeywords = [
    'pareja', 'esposa', 'esposo', 'hijo', 'hija', 'mama', 'papa', 'novia', 'novio',
    'enamorado', 'enamorada', 'acompañante', 'acompanante', 'invitado', 'invitada',
    'amigo', 'amiga', 'familiar', '+1', '+2', '+3', 'xxxxxxxxxxxxxxx', 'n/a',
    'ninguno', 'sin nombre', 'por confirmar', 'pendiente', 'sin definir', 'esposa amilcar'
  ];

  return genericKeywords.some(kw => clean === kw || clean.startsWith(kw + ' ') || clean.endsWith(' ' + kw));
}

export function extractCompanionsForGroup(
  groupName: string,
  maxPasses: number,
  rawCompanionField?: string,
  secondaryCompanions?: string[]
): GuestCompanion[] {
  const companionSlotsCount = Math.max(0, maxPasses - 1);
  if (companionSlotsCount === 0) return [];

  const rawNamesList: string[] = [];

  // 1. From secondary sheet (e.g. ACOMPAÑASTES sheet)
  if (Array.isArray(secondaryCompanions) && secondaryCompanions.length > 0) {
    secondaryCompanions.forEach(c => {
      if (c && c.trim()) rawNamesList.push(c.trim());
    });
  }

  // 2. From raw companion column in main row
  if (rawNamesList.length === 0 && rawCompanionField && rawCompanionField.trim()) {
    if (rawCompanionField.includes(',')) {
      rawCompanionField.split(',').forEach(s => {
        if (s.trim()) rawNamesList.push(s.trim());
      });
    } else {
      rawNamesList.push(rawCompanionField.trim());
    }
  }

  // 3. From groupName if groupName contains comma-separated list (e.g. "Lili, Lucho, Moico")
  if (rawNamesList.length === 0 && groupName && groupName.includes(',')) {
    const parts = groupName.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      parts.slice(1).forEach(p => rawNamesList.push(p));
    }
  }

  const result: GuestCompanion[] = [];

  for (let i = 0; i < companionSlotsCount; i++) {
    const candidateName = rawNamesList[i] || '';
    const isGeneric = isGenericCompanionName(candidateName);

    result.push({
      id: `comp-${i + 1}-${Math.random().toString(36).substring(2, 7)}`,
      name: candidateName ? candidateName : `Acompañante ${i + 1}`,
      isNamed: !isGeneric,
      isApproved: !isGeneric, // Protocol 1 (named -> true), Protocol 2 (generic -> false, requires verification)
    });
  }

  return result;
}

export function extractSecondarySheetCompanions(workbook: XLSX.WorkBook): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  
  const companionSheetName = workbook.SheetNames.find(name => {
    const upper = name.toUpperCase();
    return upper.includes('ACOMPAÑ') || upper.includes('ACOMPAN');
  });

  if (!companionSheetName) return map;

  const worksheet = workbook.Sheets[companionSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });
  if (jsonData.length < 2) return map;

  let headerIndex = -1;
  for (let r = 0; r < Math.min(10, jsonData.length); r++) {
    const joined = (jsonData[r] || []).map((c: any) => String(c || '').toUpperCase()).join(' ');
    if (joined.includes('APELLIDO') || joined.includes('ACOMPAÑANTE') || joined.includes('PASES')) {
      headerIndex = r;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;
  const headers = (jsonData[headerIndex] as any[]).map(h => String(h || '').trim().toUpperCase());
  
  const titularColIdx = headers.findIndex(h => h.includes('APELLIDO') || h.includes('TITULAR') || h.includes('NOMBRE'));
  const companionColIdx = headers.findIndex(h => h.includes('ACOMPAÑANTE') || h.includes('ACOMPANANTE'));
  const kidsColIdx = headers.findIndex(h => h.includes('NIÑO') || h.includes('NINO') || h.includes('HIJO'));

  let currentTitularKey = '';

  for (let i = headerIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];
    if (!row || row.length === 0) continue;

    const rawTitular = titularColIdx !== -1 && row[titularColIdx] ? String(row[titularColIdx]).trim() : '';
    if (rawTitular) {
      currentTitularKey = rawTitular.toLowerCase();
      if (!map[currentTitularKey]) {
        map[currentTitularKey] = [];
      }
    }

    const companionVal = companionColIdx !== -1 && row[companionColIdx] ? String(row[companionColIdx]).trim() : '';
    const kidsVal = kidsColIdx !== -1 && row[kidsColIdx] ? String(row[kidsColIdx]).trim() : '';

    if (currentTitularKey) {
      if (companionVal && companionVal.toUpperCase() !== 'ACOMPAÑANTE') {
        map[currentTitularKey].push(companionVal);
      }
      if (kidsVal && kidsVal.toUpperCase() !== 'NIÑOS') {
        map[currentTitularKey].push(kidsVal);
      }
    }
  }

  return map;
}

/**
 * Parses an Excel or CSV file buffer and returns sheet headers and row objects,
 * with smart header row detection for title rows (like Formato_ejemplo.xlsx).
 */
export function parseExcelFile(fileBuffer: ArrayBuffer): RawExcelSheet[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const secondaryCompanionsMap = extractSecondarySheetCompanions(workbook);
  const result: RawExcelSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });

    if (jsonData.length === 0) continue;

    // Smart Header Row Detection:
    // Look for a row containing typical column keywords (PASES, GRUPOS, PERSONAS, RESPONSABLE, INVITADOS)
    let headerIndex = -1;
    for (let r = 0; r < Math.min(15, jsonData.length); r++) {
      const rowArr = jsonData[r] as any[];
      if (!rowArr || rowArr.length === 0) continue;
      const joinedRow = rowArr.map(c => String(c || '').toUpperCase()).join(' ');
      if (
        (joinedRow.includes('PASES') || joinedRow.includes('INVITADO') || joinedRow.includes('GRUPO') || joinedRow.includes('CÓDIGO')) &&
        (joinedRow.includes('PERSONAS') || joinedRow.includes('RESPONSABLE') || joinedRow.includes('CANTIDAD') || joinedRow.includes('NRO') || joinedRow.includes('PASES'))
      ) {
        headerIndex = r;
        break;
      }
    }

    // Fallback to first non-empty row if keyword match is not found
    if (headerIndex === -1) {
      headerIndex = 0;
      while (headerIndex < jsonData.length && (!jsonData[headerIndex] || jsonData[headerIndex].length === 0)) {
        headerIndex++;
      }
    }

    if (headerIndex >= jsonData.length) continue;

    const rawHeaders = (jsonData[headerIndex] as any[]).map((h, idx) => 
      h ? String(h).trim() : `Columna_${idx + 1}`
    );

    // Convert data rows to objects keyed by header
    const rows: Record<string, any>[] = [];
    for (let i = headerIndex + 1; i < jsonData.length; i++) {
      const rowArr = jsonData[i] as any[];
      if (!rowArr || rowArr.length === 0) continue;

      const rowObj: Record<string, any> = { _rowNum: i + 1 };
      let hasData = false;

      rawHeaders.forEach((header, idx) => {
        const val = rowArr[idx];
        rowObj[header] = val !== undefined && val !== null ? String(val).trim() : '';
        if (rowObj[header]) hasData = true;
      });

      const firstColVal = String(rowObj[rawHeaders[0]] || '').trim().toUpperCase();
      if (hasData && firstColVal !== 'EVENTO' && firstColVal !== 'TOTAL' && !firstColVal.startsWith('---')) {
        rows.push(rowObj);
      }
    }

    result.push({
      sheetName,
      headers: rawHeaders,
      rows,
      secondaryCompanionsMap,
    });
  }

  return result;
}

/**
 * Validates Excel rows according to user-selected column mappings
 */
export function validateMappedRows(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  secondaryCompanionsMap?: Record<string, string[]>
): ImportValidationResult {
  const validRows: ValidatedGuestRow[] = [];
  const invalidRows: ValidatedGuestRow[] = [];
  let totalPasses = 0;
  const seenGroupNames = new Set<string>();

  rows.forEach((row, idx) => {
    const errors: string[] = [];
    const rowNum = row._rowNum || idx + 1;

    // 1. Group / Responsible Name (Mandatory)
    const rawGroupName = mapping.groupNameCol ? row[mapping.groupNameCol] : '';
    const groupName = rawGroupName ? String(rawGroupName).trim() : '';

    if (!groupName) {
      errors.push('El nombre del grupo o lista de personas está vacío');
    } else if (groupName.toUpperCase() === 'TOTAL') {
      errors.push('Fila de total omitida');
    } else if (seenGroupNames.has(groupName.toLowerCase())) {
      errors.push(`Grupo duplicado en el archivo: "${groupName}"`);
    }

    // 2. Max Passes (Mandatory, positive integer)
    const rawPasses = mapping.maxPassesCol ? row[mapping.maxPassesCol] : '';
    const maxPasses = parseInt(String(rawPasses), 10);

    if (isNaN(maxPasses)) {
      errors.push('La cantidad de personas/pases no es un número válido');
    } else if (maxPasses <= 0) {
      errors.push(`Cantidad de pases inválida (${maxPasses}). Debe ser mayor a 0`);
    }

    // 3. Optional Phone validation
    const rawPhone = mapping.phoneCol ? String(row[mapping.phoneCol] || '').trim() : '';
    const phoneDigitsOnly = rawPhone.replace(/[\s\-\(\)]/g, '');
    const phone = rawPhone;
    if (rawPhone && !/^\+?[0-9]{6,15}$/.test(phoneDigitsOnly)) {
      errors.push(`Formato de teléfono sospechoso: "${rawPhone}"`);
    }

    // 4. Optional Responsible, Notes & Companions
    const responsible = mapping.responsibleCol ? String(row[mapping.responsibleCol] || '').trim() : '';
    const externalId = mapping.externalIdCol ? String(row[mapping.externalIdCol] || '').trim() : '';
    const notes = mapping.notesCol ? String(row[mapping.notesCol] || '').trim() : '';
    const companionColVal = mapping.companionCol ? String(row[mapping.companionCol] || '').trim() : '';

    const secondaryList = secondaryCompanionsMap ? (secondaryCompanionsMap[groupName.toLowerCase()] || []) : [];

    const companions = extractCompanionsForGroup(
      groupName,
      isNaN(maxPasses) ? 0 : maxPasses,
      companionColVal,
      secondaryList
    );

    const validatedRow: ValidatedGuestRow = {
      rowNumber: rowNum,
      groupName,
      maxPasses: isNaN(maxPasses) ? 0 : maxPasses,
      phone,
      responsible,
      externalId,
      notes,
      companions,
      isValid: errors.length === 0,
      errors,
    };

    if (validatedRow.isValid) {
      seenGroupNames.add(groupName.toLowerCase());
      totalPasses += validatedRow.maxPasses;
      validRows.push(validatedRow);
    } else {
      invalidRows.push(validatedRow);
    }
  });

  return {
    totalRows: rows.length,
    validCount: validRows.length,
    errorCount: invalidRows.length,
    totalPasses,
    validRows,
    invalidRows,
  };
}

/**
 * Generates downloadable official Excel template (.xlsx) based on Formato_ejemplo.xlsx
 */
export function generateTemplateExcel(eventName?: string): Uint8Array {
  const wb = XLSX.utils.book_new();
  const data = [
    ['EVENTO', (eventName || 'CUMPLEAÑOS TAVO 60 AÑOS').toUpperCase(), '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['PASES O GRUPOS', 'NRO DE PERSONAS', 'RESPONSABLE GRUPO/PASE', 'NRO DE TELÉFONO (WhatsApp)'],
    ['Juan', 1, 'Juan', '912345678'],
    ['Lili , Lucho , Moico, Enamorada, Gaby , Sra. Ernestina', 6, 'Lucho', '912345678'],
    ['Nathali , German , Lula, Tati', 4, 'Lili', '912345678'],
    ['Nidia, Emo', 2, 'Nidia', '912345678'],
    ['Pepe', 1, 'Pepe', '912345678'],
    ['Melo , Nidia, Enamorado, Nico', 4, 'Melo', '912345678'],
    ['Miguel , Nicol', 2, 'Miguel', '912345678'],
    ['Claudia , Jorge Matias', 3, 'Claudia', '912345678'],
    ['Lapo , Gasdy', 2, 'Lapo', '912345678'],
    ['Opal , Yovana', 2, 'Opal', '912345678'],
    ['Shen, Esposa', 2, 'Esposa', '912345678'],
    ['Tato, Gardenia', 2, 'Gardenia', '912345678'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 55 }, // PASES O GRUPOS
    { wch: 18 }, // NRO DE PERSONAS
    { wch: 28 }, // RESPONSABLE GRUPO/PASE
    { wch: 28 }, // NRO DE TELÉFONO (WhatsApp)
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Hoja1');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Generates downloadable error report Excel buffer
 */
export function generateErrorReportExcel(invalidRows: ValidatedGuestRow[]): Uint8Array {
  const exportData = invalidRows.map(r => ({
    Fila: r.rowNumber,
    'Pases o Grupos': r.groupName || '(Vacío)',
    'Nro de Personas': r.maxPasses,
    'Responsable': r.responsible || '',
    'Teléfono': r.phone || '',
    'Errores Detectados': r.errors.join(' | '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Errores_Importacion');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}
