import * as XLSX from 'xlsx';

export interface RawExcelSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
}

export interface ColumnMapping {
  groupNameCol: string;
  maxPassesCol: string;
  phoneCol?: string;
  responsibleCol?: string;
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

/**
 * Parses an Excel or CSV file buffer and returns sheet headers and row objects,
 * with smart header row detection for title rows (like Formato_ejemplo.xlsx).
 */
export function parseExcelFile(fileBuffer: ArrayBuffer): RawExcelSheet[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
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
        (joinedRow.includes('PASES') || joinedRow.includes('INVITADO') || joinedRow.includes('GRUPO')) &&
        (joinedRow.includes('PERSONAS') || joinedRow.includes('RESPONSABLE') || joinedRow.includes('CANTIDAD') || joinedRow.includes('NRO'))
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
    });
  }

  return result;
}

/**
 * Validates Excel rows according to user-selected column mappings
 */
export function validateMappedRows(
  rows: Record<string, any>[],
  mapping: ColumnMapping
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
    const phone = mapping.phoneCol ? String(row[mapping.phoneCol] || '').trim() : '';
    if (phone && !/^\+?[0-9\s\-]{6,15}$/.test(phone)) {
      errors.push(`Formato de teléfono sospechoso: "${phone}"`);
    }

    // 4. Optional Responsible & Notes
    const responsible = mapping.responsibleCol ? String(row[mapping.responsibleCol] || '').trim() : '';
    const externalId = mapping.externalIdCol ? String(row[mapping.externalIdCol] || '').trim() : '';
    const notes = mapping.notesCol ? String(row[mapping.notesCol] || '').trim() : '';

    const validatedRow: ValidatedGuestRow = {
      rowNumber: rowNum,
      groupName,
      maxPasses: isNaN(maxPasses) ? 0 : maxPasses,
      phone,
      responsible,
      externalId,
      notes,
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
