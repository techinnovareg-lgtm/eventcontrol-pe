import { CheckIn, CheckInResultStatus, GuestGroup } from '@/lib/supabase/types';
import { resolveQRToken } from '@/lib/qr-engine';
import { getEventGuestGroups } from '@/lib/events';
import { getEventTableAssignments, getEventTables } from '@/lib/tables';
import { checkInRealtimeChannel } from '@/lib/realtime';

let checkInsLogStore: CheckIn[] = [];

export interface CheckInExecutionResult {
  success: boolean;
  reason: CheckInResultStatus;
  groupName?: string;
  tableName?: string;
  maxPasses?: number;
  alreadyEntered?: number;
  passesEntered?: number;
  passesAccumulated?: number;
  availablePasses?: number;
  status?: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO';
  message: string;
}

/**
 * Atomics Check-in Execution Engine (Simulates Postgres rpc_register_check_in)
 * Handles race conditions, locks rows, enforces strict pass limits, and logs audit events
 */
export function executeAtomicCheckIn(
  tokenHash: string,
  passesRequested: number,
  operatorId = 'user-security-01',
  eventId = 'evt-102',
  isOfflineSync = false
): CheckInExecutionResult {

  // 1. Resolve Token
  const tokenResult = resolveQRToken(tokenHash);

  if (!tokenResult.valid) {
    const reason = (tokenResult.reason as CheckInResultStatus) || 'REJECTED_INVALID';
    
    // Log audit event for invalid scan
    checkInsLogStore.unshift({
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event_id: eventId,
      workspace_id: 'ws-a-1111',
      operator_user_id: operatorId,
      passes_entered: passesRequested,
      passes_accumulated: 0,
      is_offline_sync: isOfflineSync,
      result_status: reason,
      entry_timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      reason,
      message: reason === 'REJECTED_REVOKED' 
        ? '✕ CÓDIGO QR REVOCADO: El código fue invalidado por el administrador.' 
        : '✕ CÓDIGO QR INVÁLIDO: No existe registro en el sistema.',
    };
  }

  const token = tokenResult.token!;
  const groups = getEventGuestGroups(token.event_id);
  const group = groups.find(g => g.id === token.group_id);

  if (!group) {
    return {
      success: false,
      reason: 'REJECTED_INVALID',
      message: '✕ GRUPO NO ENCONTRADO',
    };
  }

  // Find Table assigned to group
  const assignments = getEventTableAssignments(token.event_id);
  const assignment = assignments.find(a => a.group_id === group.id);
  let tableName = 'Sin Mesa Asignada';
  if (assignment) {
    const tables = getEventTables(token.event_id);
    const tbl = tables.find(t => t.id === assignment.table_id);
    if (tbl) tableName = tbl.name;
  }

  // 2. Validate Overbooking (Caso 3)
  const currentCheckedIn = group.checked_in_count || 0;
  const availablePasses = group.max_passes - currentCheckedIn;

  if (currentCheckedIn + passesRequested > group.max_passes) {
    // Audit log failed attempt
    checkInsLogStore.unshift({
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event_id: token.event_id,
      group_id: group.id,
      qr_token_id: token.id,
      workspace_id: token.workspace_id,
      operator_user_id: operatorId,
      passes_entered: passesRequested,
      passes_accumulated: currentCheckedIn,
      is_offline_sync: isOfflineSync,
      result_status: 'REJECTED_EXCEEDED',
      entry_timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      reason: 'REJECTED_EXCEEDED',
      groupName: group.group_name,
      tableName,
      maxPasses: group.max_passes,
      alreadyEntered: currentCheckedIn,
      availablePasses,
      passesEntered: passesRequested,
      message: `⚠️ CANTIDAD NO AUTORIZADA. Disponibles: ${availablePasses}, Solicitados: ${passesRequested}.`,
    };
  }

  // 3. Perform Atomic State Update (Casos 1 y 2)
  const newCheckedIn = currentCheckedIn + passesRequested;
  const isComplete = newCheckedIn === group.max_passes;
  const newStatus = isComplete ? 'COMPLETO' : 'PARCIAL';
  const resultStatus: CheckInResultStatus = isComplete ? 'SUCCESS_COMPLETE' : 'SUCCESS_PARTIAL';

  group.checked_in_count = newCheckedIn;
  group.status = newStatus;

  // Audit log success check-in
  const checkInRecord: CheckIn = {
    id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    event_id: token.event_id,
    group_id: group.id,
    qr_token_id: token.id,
    workspace_id: token.workspace_id,
    operator_user_id: operatorId,
    passes_entered: passesRequested,
    passes_accumulated: newCheckedIn,
    is_offline_sync: isOfflineSync,
    result_status: resultStatus,
    entry_timestamp: new Date().toISOString(),
  };

  checkInsLogStore.unshift(checkInRecord);
  checkInRealtimeChannel.notify(checkInRecord);

  return {
    success: true,
    reason: resultStatus,
    groupName: group.group_name,
    tableName,
    maxPasses: group.max_passes,
    alreadyEntered: currentCheckedIn,
    passesEntered: passesRequested,
    passesAccumulated: newCheckedIn,
    availablePasses: group.max_passes - newCheckedIn,
    status: newStatus,
    message: isComplete 
      ? '✓ INGRESO COMPLETO REGISTRADO. El grupo alcanzó el máximo de pases.' 
      : `✓ INGRESO PARCIAL REGISTRADO (${newCheckedIn}/${group.max_passes}).`,
  };
}

/**
 * Concurrency Race Condition Simulator (Caso 5)
 * Simulates two operators scanning the same QR at the exact same millisecond
 */
export function simulateConcurrentScans(tokenHash: string, passesOpA: number, passesOpB: number) {
  const resultOpA = executeAtomicCheckIn(tokenHash, passesOpA, 'operator-A-puerta-1');
  const resultOpB = executeAtomicCheckIn(tokenHash, passesOpB, 'operator-B-puerta-2');

  return {
    operatorA: resultOpA,
    operatorB: resultOpB,
  };
}

/**
 * Returns event check-in audit history
 */
export function getEventCheckInLogs(eventId: string): CheckIn[] {
  return checkInsLogStore.filter(c => c.event_id === eventId);
}
