import * as XLSX from 'xlsx';
import { getEventById, getEventGuestGroups } from '@/lib/events';
import { getEventTables, getEventTableAssignments } from '@/lib/tables';
import { getEventCheckInLogs } from '@/lib/checkin';
import { getEventCuts, calculateCateringDiff } from '@/lib/cuts';
import { calculateDashboardMetrics, getTablesOccupancyStats } from '@/lib/dashboard-stats';

/**
 * Generates and triggers browser download of a formatted Multi-Sheet Excel Workbook
 */
export function exportEventToExcel(eventId: string, workspaceId: string) {
  const event = getEventById(eventId, workspaceId);
  const metrics = calculateDashboardMetrics(eventId);
  const groups = getEventGuestGroups(eventId);
  const tablesStats = getTablesOccupancyStats(eventId);
  const checkIns = getEventCheckInLogs(eventId);
  const cuts = getEventCuts(eventId);

  const workbook = XLSX.utils.book_new();

  // SHEET 1: Resumen General
  const resumenData = [
    { Indicador: 'Nombre del Evento', Valor: event?.name || 'Evento' },
    { Indicador: 'Tipo de Evento', Valor: event?.event_type || 'Boda' },
    { Indicador: 'Fecha y Hora', Valor: `${event?.event_date || ''} ${event?.event_time || ''}` },
    { Indicador: 'Lugar / Recepción', Valor: event?.venue_name || '' },
    { Indicador: 'Pases Autorizados Totales', Valor: metrics.totalAuthorized },
    { Indicador: 'Personas Ingresadas (Presentes)', Valor: metrics.totalEntered },
    { Indicador: 'Pases Pendientes por Ingresar', Valor: metrics.totalPending },
    { Indicador: 'Porcentaje de Asistencia', Valor: `${metrics.occupancyPercentage}%` },
    { Indicador: 'Grupos Completos', Valor: metrics.completeGroupsCount },
    { Indicador: 'Grupos Parciales', Valor: metrics.partialGroupsCount },
    { Indicador: 'Grupos Pendientes', Valor: metrics.pendingGroupsCount },
  ];
  const wsResumen = XLSX.utils.json_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

  // SHEET 2: Lista de Invitados / Grupos
  const invitadosData = groups.map((g) => ({
    'Grupo / Responsable': g.group_name,
    'Pases Autorizados': g.max_passes,
    'Pases Ingresados': g.checked_in_count || 0,
    'Pases Pendientes': Math.max(0, g.max_passes - (g.checked_in_count || 0)),
    Estado: g.status,
    Teléfono: g.responsible_phone || '-',
    Notas: g.notes || '',
  }));
  const wsInvitados = XLSX.utils.json_to_sheet(invitadosData);
  XLSX.utils.book_append_sheet(workbook, wsInvitados, 'Invitados');

  // SHEET 3: Ocupación por Mesas
  const mesasData = tablesStats.map((t) => ({
    Mesa: t.tableName,
    Capacidad: t.capacity,
    'Pases Asignados': t.assignedPasses,
    'Presentes en Mesa': t.presentPasses,
    'Ocupación %': `${t.occupancyPercentage}%`,
  }));
  const wsMesas = XLSX.utils.json_to_sheet(mesasData);
  XLSX.utils.book_append_sheet(workbook, wsMesas, 'Mesas');

  // SHEET 4: Historial de Check-ins
  const checkInsData = checkIns.map((c) => ({
    'Fecha / Hora': new Date(c.entry_timestamp).toLocaleString(),
    Pases: c.passes_entered,
    Acumulado: c.passes_accumulated,
    Resultado: c.result_status,
    'Operador ID': c.operator_user_id || 'Seguridad',
  }));
  const wsCheckIns = XLSX.utils.json_to_sheet(checkInsData);
  XLSX.utils.book_append_sheet(workbook, wsCheckIns, 'CheckIns');

  // SHEET 5: Cortes e Inmutables
  const cortesData = cuts.map((c) => ({
    Corte: c.cut_name,
    'Fecha y Hora': new Date(c.cut_timestamp).toLocaleString(),
    'Autorizados a esa Hora': c.total_authorized,
    'Presentes a esa Hora': c.total_present,
    'Pendientes a esa Hora': c.total_pending,
  }));
  const wsCortes = XLSX.utils.json_to_sheet(cortesData);
  XLSX.utils.book_append_sheet(workbook, wsCortes, 'Cortes');

  // Write and Trigger Download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Completo_${(event?.name || 'Evento').replace(/\s+/g, '_')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
