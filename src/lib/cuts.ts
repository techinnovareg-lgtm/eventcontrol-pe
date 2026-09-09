import { Cut } from '@/lib/supabase/types';
import { calculateDashboardMetrics, getTablesOccupancyStats } from '@/lib/dashboard-stats';
import { checkInRealtimeChannel } from '@/lib/realtime';

const CUTS_STORAGE_KEY = 'eventcontrol_cuts';

let cutsMemoryStore: Record<string, Cut[]> | null = null;

function loadCutsFromStorage(): Record<string, Cut[]> {
  if (cutsMemoryStore) return cutsMemoryStore;
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUTS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        delete parsed['evt-101'];
        delete parsed['evt-102'];
        cutsMemoryStore = parsed;
        setTimeout(() => autoSyncCutsToServer(), 100);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CutsStore] Failed to load cuts from storage', err);
  }
  return {};
}

function saveCutsToStorage(data: Record<string, Cut[]>) {
  cutsMemoryStore = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CUTS_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[CutsStore] Failed to save cuts to storage', err);
    }
  }
}

function autoSyncCutsToServer(eventId?: string) {
  if (typeof window === 'undefined') return;
  try {
    const store = loadCutsFromStorage();
    const targetEventIds = eventId ? [eventId] : Object.keys(store);

    targetEventIds.forEach(evtId => {
      const cuts = store[evtId] || [];
      if (cuts.length > 0) {
        fetch('/api/events/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'SYNC_CUTS', eventId: evtId, cuts }),
        }).catch(() => {});
      }
    });
  } catch (err) {}
}

export function getEventCuts(eventId: string): Cut[] {
  const store = loadCutsFromStorage();
  return store[eventId] || [];
}

export async function getEventCutsAsync(eventId: string): Promise<Cut[]> {
  try {
    const res = await fetch(`/api/events/sync?eventId=${encodeURIComponent(eventId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.cuts)) {
        const store = loadCutsFromStorage();
        store[eventId] = data.cuts;
        saveCutsToStorage(store);
        return data.cuts;
      }
    }
  } catch (err) {}
  return getEventCuts(eventId);
}

export function deleteEventCuts(eventId: string): void {
  const store = loadCutsFromStorage();
  delete store[eventId];
  saveCutsToStorage(store);
}

/**
 * Creates an immutable frozen snapshot of the event state at the current second
 */
export function createEventCut(eventId: string, workspaceId: string, cutName: string): Cut {
  const metrics = calculateDashboardMetrics(eventId);
  const tablesStats = getTablesOccupancyStats(eventId);

  const newCut: Cut = {
    id: `cut-${Date.now()}`,
    event_id: eventId,
    workspace_id: workspaceId,
    cut_name: cutName,
    cut_timestamp: new Date().toISOString(),
    total_authorized: metrics.totalAuthorized,
    total_present: metrics.totalEntered,
    total_pending: metrics.totalPending,
    table_snapshots: tablesStats.map(t => ({
      tableName: t.tableName,
      present: t.presentPasses,
      capacity: t.capacity,
    })),
    created_at: new Date().toISOString(),
  };

  const store = loadCutsFromStorage();
  if (!store[eventId]) store[eventId] = [];
  store[eventId].unshift(newCut);
  saveCutsToStorage(store);

  checkInRealtimeChannel.notify({ type: 'CUT_CREATED', eventId, cut: newCut });

  if (typeof window !== 'undefined') {
    fetch('/api/events/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_CUTS', eventId, cuts: store[eventId] }),
    }).catch(err => console.warn('[Sync Cuts API dispatch warning]', err));
  }

  return newCut;
}

export function deleteEventCut(eventId: string, cutId: string): void {
  const store = loadCutsFromStorage();
  if (store[eventId]) {
    store[eventId] = store[eventId].filter(c => c.id !== cutId);
    saveCutsToStorage(store);
    checkInRealtimeChannel.notify({ type: 'CUT_DELETED', eventId, cutId });

    if (typeof window !== 'undefined') {
      fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_CUTS', eventId, cuts: store[eventId] }),
      }).catch(() => {});
    }
  }
}

export interface CateringAnalysisResult {
  foodCutName: string;
  foodCutTimestamp: string;
  platesRequiredAtCut: number;
  currentTotalPresent: number;
  lateArrivalsCount: number;
  potentialExtraPlates: number;
  tableBreakdown: {
    tableName: string;
    presentAtCut: number;
    currentPresent: number;
    lateArrivals: number;
  }[];
}

/**
 * Calculates catering plates required at food cut vs late arrivals (Caso 8)
 */
export function calculateCateringDiff(eventId: string): CateringAnalysisResult | null {
  const cuts = getEventCuts(eventId);
  const foodCut = cuts.find(c => c.cut_name.toLowerCase().includes('comida') || c.cut_name.toLowerCase().includes('catering')) || cuts[0];

  if (!foodCut) return null;

  const currentMetrics = calculateDashboardMetrics(eventId);
  const currentTablesStats = getTablesOccupancyStats(eventId);

  const lateArrivalsCount = Math.max(0, currentMetrics.totalEntered - foodCut.total_present);
  const snapTables = (foodCut.table_snapshots as any[]) || [];

  const tableBreakdown = currentTablesStats.map((ct) => {
    const snap = snapTables.find((s: any) => s.tableName === ct.tableName);
    const presentAtCut = snap ? snap.present : 0;
    const currentPresent = ct.presentPasses;
    const lateArrivals = Math.max(0, currentPresent - presentAtCut);

    return {
      tableName: ct.tableName,
      presentAtCut,
      currentPresent,
      lateArrivals,
    };
  });

  return {
    foodCutName: foodCut.cut_name,
    foodCutTimestamp: foodCut.cut_timestamp,
    platesRequiredAtCut: foodCut.total_present,
    currentTotalPresent: currentMetrics.totalEntered,
    lateArrivalsCount,
    potentialExtraPlates: lateArrivalsCount,
    tableBreakdown,
  };
}
