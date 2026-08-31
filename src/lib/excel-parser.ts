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
  externalIdCol?: string;
  notesCol?: string;
}

export interface ValidatedGuestRow {
  rowNumber: number;
  groupName: string;
  maxPasses: number;
  phone?: string;
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
 * Parses an Excel or CSV file buffer and returns sheet headers and row objects
 */
export function parseExcelFile(fileBuffer: ArrayBuffer): RawExcelSheet[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const result: RawExcelSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });

    if (jsonData.length === 0) continue;

    // Find header row (first non-empty row)
    let headerIndex = 0;
    while (headerIndex < jsonData.length && (!jsonData[headerIndex] || jsonData[headerIndex].length === 0)) {
      headerIndex++;
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

      if (hasData) {
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
      errors.push('El nombre del grupo o responsable está vacío');
    } else if (groupName.toUpperCase() === 'TOTAL') {
      errors.push('Fila de total omitida');
    } else if (seenGroupNames.has(groupName.toLowerCase())) {
      errors.push(`Grupo duplicado en el archivo: "${groupName}"`);
    }

    // 2. Max Passes (Mandatory, positive integer)
    const rawPasses = mapping.maxPassesCol ? row[mapping.maxPassesCol] : '';
    const maxPasses = parseInt(String(rawPasses), 10);

    if (isNaN(maxPasses)) {
      errors.push('La cantidad de pases no es un número válido');
    } else if (maxPasses <= 0) {
      errors.push(`Cantidad de pases inválida (${maxPasses}). Debe ser mayor a 0`);
    }

    // 3. Optional Phone validation
    const phone = mapping.phoneCol ? String(row[mapping.phoneCol] || '').trim() : '';
    if (phone && !/^\+?[0-9\s\-]{6,15}$/.test(phone)) {
      errors.push(`Formato de teléfono sospechoso: "${phone}"`);
    }

    // 4. Optional fields
    const externalId = mapping.externalIdCol ? String(row[mapping.externalIdCol] || '').trim() : '';
    const notes = mapping.notesCol ? String(row[mapping.notesCol] || '').trim() : '';

    const validatedRow: ValidatedGuestRow = {
      rowNumber: rowNum,
      groupName,
      maxPasses: isNaN(maxPasses) ? 0 : maxPasses,
      phone,
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
 * Generates downloadable error report Excel buffer
 */
export function generateErrorReportExcel(invalidRows: ValidatedGuestRow[]): Uint8Array {
  const exportData = invalidRows.map(r => ({
    Fila: r.rowNumber,
    'Grupo / Responsable': r.groupName || '(Vacío)',
    Pases: r.maxPasses,
    Teléfono: r.phone || '',
    Errores: r.errors.join(' | '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Errores_Importacion');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}
