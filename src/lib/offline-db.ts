import Dexie, { Table as DexieTable } from 'dexie';
import { resolveQRToken, getOrCreateGroupQRToken } from '@/lib/qr-engine';
import { getEventGuestGroups } from '@/lib/events';
import { executeAtomicCheckIn, CheckInExecutionResult } from '@/lib/checkin';

export interface OfflineManifestRecord {
  event_id: string;
  downloaded_at: string;
  groups: {
    id: string;
    group_name: string;
    max_passes: number;
    checked_in_count: number;
    token_hash: string;
  }[];
}

export interface OfflineSyncQueueItem {
  id: string; // UUID generated on device for idempotency
  event_id: string;
  token_hash: string;
  passes_requested: number;
  operator_id: string;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT_OVERFLOW';
  error_message?: string;
}

class EventControlOfflineDB extends Dexie {
  manifests!: DexieTable<OfflineManifestRecord, string>;
  sync_queue!: DexieTable<OfflineSyncQueueItem, string>;

  constructor() {
    super('EventControlOfflineDB');
    this.version(1).stores({
      manifests: 'event_id, downloaded_at',
      sync_queue: 'id, event_id, status, timestamp',
    });
  }
}

export const offlineDb = new EventControlOfflineDB();

/**
 * Downloads and caches event manifest to IndexedDB for offline scan resilience
 */
export async function downloadEventOfflineManifest(eventId: string, workspaceId: string): Promise<OfflineManifestRecord> {
  const groups = getEventGuestGroups(eventId);
  
  const manifestGroups = groups.map((g) => {
    const token = getOrCreateGroupQRToken(g.id, eventId, workspaceId);
    return {
      id: g.id,
      group_name: g.group_name,
      max_passes: g.max_passes,
      checked_in_count: g.checked_in_count || 0,
      token_hash: token.token_hash,
    };
  });

  const record: OfflineManifestRecord = {
    event_id: eventId,
    downloaded_at: new Date().toISOString(),
    groups: manifestGroups,
  };

  await offlineDb.manifests.put(record);
  return record;
}

/**
 * Validates and records check-in locally in IndexedDB when offline (Caso 6)
 */
export async function executeOfflineCheckIn(
  tokenHash: string,
  passesRequested: number,
  operatorId: string,
  eventId: string
): Promise<CheckInExecutionResult> {
  const manifest = await offlineDb.manifests.get(eventId);

  if (!manifest) {
    return {
      success: false,
      reason: 'REJECTED_INVALID',
      message: '✕ MANIFIESTO LOCAL NO ENCONTRADO: Descarga el evento antes de pasar a modo offline.',
    };
  }

  const group = manifest.groups.find(g => g.token_hash === tokenHash);

  if (!group) {
    return {
      success: false,
      reason: 'REJECTED_INVALID',
      message: '✕ CÓDIGO QR NO ENCONTRADO EN CACHÉ LOCAL.',
    };
  }

  const currentChecked = group.checked_in_count || 0;
  const available = group.max_passes - currentChecked;

  if (currentChecked + passesRequested > group.max_passes) {
    return {
      success: false,
      reason: 'REJECTED_EXCEEDED',
      groupName: group.group_name,
      maxPasses: group.max_passes,
      alreadyEntered: currentChecked,
      availablePasses: available,
      message: `⚠️ CANTIDAD NO AUTORIZADA (OFFLINE). Disponibles: ${available}, Solicitados: ${passesRequested}.`,
    };
  }

  // Update local manifest count
  group.checked_in_count = currentChecked + passesRequested;
  await offlineDb.manifests.put(manifest);

  // Queue item with unique device UUID for idempotent sync (Caso 7)
  const queueItem: OfflineSyncQueueItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `offline-${Date.now()}-${Math.random()}`,
    event_id: eventId,
    token_hash: tokenHash,
    passes_requested: passesRequested,
    operator_id: operatorId,
    timestamp: new Date().toISOString(),
    status: 'PENDING',
  };

  await offlineDb.sync_queue.put(queueItem);

  const isComplete = group.checked_in_count === group.max_passes;

  return {
    success: true,
    reason: isComplete ? 'SUCCESS_COMPLETE' : 'SUCCESS_PARTIAL',
    groupName: group.group_name,
    maxPasses: group.max_passes,
    alreadyEntered: currentChecked,
    passesEntered: passesRequested,
    passesAccumulated: group.checked_in_count,
    availablePasses: group.max_passes - group.checked_in_count,
    message: isComplete 
      ? '✓ INGRESO COMPLETO REGISTRADO (MODO OFFLINE)' 
      : `✓ INGRESO PARCIAL REGISTRADO (MODO OFFLINE: ${group.checked_in_count}/${group.max_passes})`,
  };
}

/**
 * Idempotently flushes and synchronizes offline queue items to server upon reconnection (Caso 7)
 */
export async function syncOfflineQueueToServer(eventId: string): Promise<{ syncedCount: number; conflictCount: number; errors: string[] }> {
  const pendingItems = await offlineDb.sync_queue.where('status').equals('PENDING').toArray();
  
  let syncedCount = 0;
  let conflictCount = 0;
  const errors: string[] = [];

  for (const item of pendingItems) {
    try {
      // Execute atomic checkin transaction on server engine
      const res = executeAtomicCheckIn(item.token_hash, item.passes_requested, item.operator_id, item.event_id, true);

      if (res.success) {
        item.status = 'SYNCED';
        syncedCount++;
      } else {
        item.status = 'CONFLICT_OVERFLOW';
        item.error_message = res.message;
        conflictCount++;
        errors.push(`Conflicto en grupo "${res.groupName || item.token_hash}": ${res.message}`);
      }

      await offlineDb.sync_queue.put(item);
    } catch (err: any) {
      errors.push(`Error al sincronizar ítem ${item.id}: ${err.message}`);
    }
  }

  return { syncedCount, conflictCount, errors };
}

export async function getPendingOfflineQueueCount(eventId: string): Promise<number> {
  return await offlineDb.sync_queue.where({ event_id: eventId, status: 'PENDING' }).count();
}
