import { Cut } from '@/lib/supabase/types';
import { calculateDashboardMetrics, getTablesOccupancyStats } from '@/lib/dashboard-stats';

// Mock in-memory repository for Cuts
let cutsStore: Record<string, Cut[]> = {
  'evt-102': [
    {
      id: 'cut-1',
      event_id: 'evt-102',
      workspace_id: 'ws-a-1111',
      cut_name: 'Brindis de Bienvenida',
      cut_timestamp: new Date('2026-09-20T17:30:00').toISOString(),
      total_authorized: 50,
      total_present: 32,
      total_pending: 18,
      table_snapshots: [
        { tableName: 'Mesa 1 (Familia)', present: 5, capacity: 10 },
        { tableName: 'Mesa 2 (Amigos)', present: 4, capacity: 8 },
        { tableName: 'Mesa 3 (Honor)', present: 3, capacity: 6 },
      ],
      created_at: new Date('2026-09-20T17:30:00').toISOString(),
    },
    {
      id: 'cut-2',
      event_id: 'evt-102',
      workspace_id: 'ws-a-1111',
      cut_name: 'Servicio de Comida (Catering)',
      cut_timestamp: new Date('2026-09-20T19:00:00').toISOString(),
      total_authorized: 50,
      total_present: 42,
      total_pending: 8,
      table_snapshots: [
        { tableName: 'Mesa 1 (Familia)', present: 7, capacity: 10 },
        { tableName: 'Mesa 2 (Amigos)', present: 6, capacity: 8 },
        { tableName: 'Mesa 3 (Honor)', present: 5, capacity: 6 },
      ],
      created_at: new Date('2026-09-20T19:00:00').toISOString(),
    }
  ]
};

export function getEventCuts(eventId: string): Cut[] {
  return cutsStore[eventId] || [];
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

  if (!cutsStore[eventId]) cutsStore[eventId] = [];
  cutsStore[eventId].unshift(newCut);
  return newCut;
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
  // Find official food cut or latest cut
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
