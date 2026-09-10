import { Table, TableAssignment } from '@/lib/supabase/types';

export type VenueElementType = 
  | 'ESCENARIO'
  | 'PISTA_BAILE'
  | 'PISTA_ORQUESTA'
  | 'BAR'
  | 'BUFFET'
  | 'PISCINA'
  | 'JARDIN'
  | 'MACETERO'
  | 'COLUMNA'
  | 'ENTRADA';

export type ElementSize = 'small' | 'medium' | 'large';

export interface VenueElement {
  id: string;
  event_id: string;
  workspace_id: string;
  type: VenueElementType;
  label: string;
  size: ElementSize;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical';
  shape: 'rect' | 'round_rect' | 'circle' | 'oval';
  created_at: string;
}

const TABLES_STORAGE_KEY = 'eventcontrol_tables';
const ASSIGNMENTS_STORAGE_KEY = 'eventcontrol_table_assignments';
const VENUE_ELEMENTS_STORAGE_KEY = 'eventcontrol_venue_elements';

const INITIAL_TABLES: Record<string, Table[]> = {};
const INITIAL_ASSIGNMENTS: Record<string, TableAssignment[]> = {};
const INITIAL_VENUE_ELEMENTS: Record<string, VenueElement[]> = {};

let tablesMemoryStore: Record<string, Table[]> | null = null;
let assignmentsMemoryStore: Record<string, TableAssignment[]> | null = null;
let venueElementsMemoryStore: Record<string, VenueElement[]> | null = null;

export async function syncTablesToServerAsync(eventId: string): Promise<void> {
  if (typeof window === 'undefined' || !eventId) return;
  try {
    const allTables = loadTablesFromStorage();
    const allAssignments = loadAssignmentsFromStorage();
    const tables = allTables[eventId] || [];
    const assignments = allAssignments[eventId] || [];

    await fetch('/api/events/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_TABLES', eventId, tables, assignments }),
    });
  } catch (err) {}
}

export async function syncVenueElementsToServerAsync(eventId: string): Promise<void> {
  if (typeof window === 'undefined' || !eventId) return;
  try {
    const allVenueElements = loadVenueElementsFromStorage();
    const venueElements = allVenueElements[eventId] || [];

    await fetch('/api/events/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_VENUE_ELEMENTS', eventId, venueElements }),
    });
  } catch (err) {}
}

export async function autoSyncTablesToServerAsync(eventId?: string): Promise<void> {
  if (!eventId) return;
  await Promise.all([
    syncTablesToServerAsync(eventId),
    syncVenueElementsToServerAsync(eventId),
  ]);
}

export function autoSyncTablesToServer(eventId?: string) {
  if (eventId) autoSyncTablesToServerAsync(eventId);
}

function loadTablesFromStorage(): Record<string, Table[]> {
  if (tablesMemoryStore) return tablesMemoryStore;
  if (typeof window === 'undefined') return INITIAL_TABLES;
  try {
    const raw = localStorage.getItem(TABLES_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        delete parsed['evt-101'];
        delete parsed['evt-102'];
        tablesMemoryStore = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[TablesStore] Failed to load tables from storage', err);
  }
  saveTablesToStorage(INITIAL_TABLES);
  return INITIAL_TABLES;
}

function saveTablesToStorage(data: Record<string, Table[]>) {
  tablesMemoryStore = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[TablesStore] Failed to save tables to storage', err);
    }
  }
}

function loadAssignmentsFromStorage(): Record<string, TableAssignment[]> {
  if (assignmentsMemoryStore) return assignmentsMemoryStore;
  if (typeof window === 'undefined') return INITIAL_ASSIGNMENTS;
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        delete parsed['evt-101'];
        delete parsed['evt-102'];
        assignmentsMemoryStore = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[TablesStore] Failed to load assignments from storage', err);
  }
  saveAssignmentsToStorage(INITIAL_ASSIGNMENTS);
  return INITIAL_ASSIGNMENTS;
}

function saveAssignmentsToStorage(data: Record<string, TableAssignment[]>) {
  assignmentsMemoryStore = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[TablesStore] Failed to save assignments to storage', err);
    }
  }
}

function loadVenueElementsFromStorage(): Record<string, VenueElement[]> {
  if (venueElementsMemoryStore) return venueElementsMemoryStore;
  if (typeof window === 'undefined') return INITIAL_VENUE_ELEMENTS;
  try {
    const raw = localStorage.getItem(VENUE_ELEMENTS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        delete parsed['evt-101'];
        delete parsed['evt-102'];
        venueElementsMemoryStore = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[TablesStore] Failed to load venue elements from storage', err);
  }
  saveVenueElementsToStorage(INITIAL_VENUE_ELEMENTS);
  return INITIAL_VENUE_ELEMENTS;
}

function saveVenueElementsToStorage(data: Record<string, VenueElement[]>) {
  venueElementsMemoryStore = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VENUE_ELEMENTS_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[TablesStore] Failed to save venue elements to storage', err);
    }
  }
}

export function computeElementDimensions(
  size: ElementSize = 'medium', 
  shape: 'rect' | 'round_rect' | 'circle' | 'oval' = 'round_rect', 
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): { width: number; height: number } {
  let w = 200;
  let h = 100;

  if (size === 'small') {
    w = shape === 'circle' ? 80 : 130;
    h = shape === 'circle' ? 80 : 65;
  } else if (size === 'large') {
    w = shape === 'circle' ? 160 : 280;
    h = shape === 'circle' ? 160 : 140;
  } else {
    // medium
    w = shape === 'circle' ? 110 : 200;
    h = shape === 'circle' ? 110 : 95;
  }

  if (orientation === 'vertical' && shape !== 'circle') {
    const temp = w;
    w = h;
    h = temp;
  }

  return { width: w, height: h };
}



export function createTable(eventId: string, workspaceId: string, name: string, capacity: number, posX = 440, posY = 220): Table {
  const store = loadTablesFromStorage();
  if (!store[eventId]) {
    store[eventId] = [];
  }
  const newTbl: Table = {
    id: `tbl-${Date.now()}`,
    workspace_id: workspaceId,
    event_id: eventId,
    name,
    capacity,
    pos_x: posX,
    pos_y: posY,
    created_at: new Date().toISOString(),
  };
  store[eventId].push(newTbl);
  saveTablesToStorage(store);
  syncTablesToServerAsync(eventId);
  return newTbl;
}

export async function createTableAsync(eventId: string, workspaceId: string, name: string, capacity: number, posX = 440, posY = 220): Promise<Table> {
  const newTbl = createTable(eventId, workspaceId, name, capacity, posX, posY);
  await syncTablesToServerAsync(eventId);
  return newTbl;
}

export function deleteTable(eventId: string, tableId: string): void {
  const store = loadTablesFromStorage();
  if (store[eventId]) {
    store[eventId] = store[eventId].filter(t => t.id !== tableId);
    saveTablesToStorage(store);
  }
  const asgnStore = loadAssignmentsFromStorage();
  if (asgnStore[eventId]) {
    asgnStore[eventId] = asgnStore[eventId].filter(a => a.table_id !== tableId);
    saveAssignmentsToStorage(asgnStore);
  }
  syncTablesToServerAsync(eventId);
}

export async function deleteTableAsync(eventId: string, tableId: string): Promise<void> {
  deleteTable(eventId, tableId);
  await syncTablesToServerAsync(eventId);
}

export function updateTablePosition(eventId: string, tableId: string, posX: number, posY: number): void {
  const store = loadTablesFromStorage();
  if (store[eventId]) {
    const tbl = store[eventId].find(t => t.id === tableId);
    if (tbl) {
      tbl.pos_x = posX;
      tbl.pos_y = posY;
      saveTablesToStorage(store);
      syncTablesToServerAsync(eventId);
    }
  }
}

export async function updateTablePositionAsync(eventId: string, tableId: string, posX: number, posY: number): Promise<void> {
  updateTablePosition(eventId, tableId, posX, posY);
  await syncTablesToServerAsync(eventId);
}

export function updateTable(eventId: string, tableId: string, name: string, capacity: number): Table | null {
  const store = loadTablesFromStorage();
  if (store[eventId]) {
    const tbl = store[eventId].find(t => t.id === tableId);
    if (tbl) {
      tbl.name = name;
      tbl.capacity = capacity;
      saveTablesToStorage(store);
      syncTablesToServerAsync(eventId);
      return tbl;
    }
  }
  return null;
}

export async function updateTableAsync(eventId: string, tableId: string, name: string, capacity: number): Promise<Table | null> {
  const res = updateTable(eventId, tableId, name, capacity);
  await syncTablesToServerAsync(eventId);
  return res;
}

export function getEventTables(eventId: string): Table[] {
  const store = loadTablesFromStorage();
  return store[eventId] || [];
}

export async function getEventTablesAsync(eventId: string): Promise<Table[]> {
  try {
    const res = await fetch(`/api/events/sync?eventId=${encodeURIComponent(eventId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.tables)) {
        const store = loadTablesFromStorage();
        store[eventId] = data.tables;
        saveTablesToStorage(store);
        return data.tables;
      }
    }
  } catch (err) {}
  return getEventTables(eventId);
}

export function getEventTableAssignments(eventId: string): TableAssignment[] {
  const store = loadAssignmentsFromStorage();
  return store[eventId] || [];
}

export async function getEventTableAssignmentsAsync(eventId: string): Promise<TableAssignment[]> {
  try {
    const res = await fetch(`/api/events/sync?eventId=${encodeURIComponent(eventId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.assignments)) {
        const store = loadAssignmentsFromStorage();
        store[eventId] = data.assignments;
        saveAssignmentsToStorage(store);
        return data.assignments;
      }
    }
  } catch (err) {}
  return getEventTableAssignments(eventId);
}

export function deleteEventTables(eventId: string): void {
  const store = loadTablesFromStorage();
  delete store[eventId];
  saveTablesToStorage(store);
  syncTablesToServerAsync(eventId);
}

export function deleteEventAssignments(eventId: string): void {
  const store = loadAssignmentsFromStorage();
  delete store[eventId];
  saveAssignmentsToStorage(store);
  syncTablesToServerAsync(eventId);
}

export function deleteEventVenueElements(eventId: string): void {
  const store = loadVenueElementsFromStorage();
  delete store[eventId];
  saveVenueElementsToStorage(store);
  syncVenueElementsToServerAsync(eventId);
}

export function assignGroupToTable(eventId: string, workspaceId: string, tableId: string, groupId: string, passes: number): TableAssignment {
  const store = loadAssignmentsFromStorage();
  if (!store[eventId]) {
    store[eventId] = [];
  }
  // Remove existing assignment if any
  store[eventId] = store[eventId].filter(a => a.group_id !== groupId);

  const newAsgn: TableAssignment = {
    id: `asgn-${Date.now()}`,
    workspace_id: workspaceId,
    event_id: eventId,
    table_id: tableId,
    group_id: groupId,
    assigned_passes: passes,
    created_at: new Date().toISOString(),
  };
  store[eventId].push(newAsgn);
  saveAssignmentsToStorage(store);
  syncTablesToServerAsync(eventId);
  return newAsgn;
}

export async function assignGroupToTableAsync(eventId: string, workspaceId: string, tableId: string, groupId: string, passes: number): Promise<TableAssignment> {
  const asgn = assignGroupToTable(eventId, workspaceId, tableId, groupId, passes);
  await syncTablesToServerAsync(eventId);
  return asgn;
}

export function unassignGroupFromTable(eventId: string, groupId: string): void {
  const store = loadAssignmentsFromStorage();
  if (store[eventId]) {
    store[eventId] = store[eventId].filter(a => a.group_id !== groupId);
    saveAssignmentsToStorage(store);
    syncTablesToServerAsync(eventId);
  }
}

export async function unassignGroupFromTableAsync(eventId: string, groupId: string): Promise<void> {
  unassignGroupFromTable(eventId, groupId);
  await syncTablesToServerAsync(eventId);
}

export function calculateTableOccupancy(eventId: string, tableId: string, capacity: number) {
  const assignments = getEventTableAssignments(eventId).filter(a => a.table_id === tableId);
  const totalAssigned = assignments.reduce((sum, a) => sum + a.assigned_passes, 0);
  const isOvercapacity = totalAssigned > capacity;
  const overflowCount = isOvercapacity ? totalAssigned - capacity : 0;
  const pct = capacity > 0 ? Math.round((totalAssigned / capacity) * 100) : 0;

  return {
    totalAssigned,
    capacity,
    isOvercapacity,
    overflowCount,
    occupancyRatio: `${totalAssigned} / ${capacity}`,
    occupancyPercentage: pct,
  };
}

/* VENUE ELEMENTS FUNCTIONS WITH SIZE SUPPORT */
export function getEventVenueElements(eventId: string): VenueElement[] {
  const store = loadVenueElementsFromStorage();
  return store[eventId] || [];
}

export async function getEventVenueElementsAsync(eventId: string): Promise<VenueElement[]> {
  try {
    const res = await fetch(`/api/events/sync?eventId=${encodeURIComponent(eventId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.venueElements)) {
        const store = loadVenueElementsFromStorage();
        store[eventId] = data.venueElements;
        saveVenueElementsToStorage(store);
        return data.venueElements;
      }
    }
  } catch (err) {}
  return getEventVenueElements(eventId);
}

export function createVenueElement(
  eventId: string, 
  workspaceId: string, 
  type: VenueElementType, 
  label: string, 
  size: ElementSize = 'medium',
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  shape: 'rect' | 'round_rect' | 'circle' | 'oval' = 'round_rect',
  posX = 750, 
  posY = 320
): VenueElement {
  const store = loadVenueElementsFromStorage();
  if (!store[eventId]) {
    store[eventId] = [];
  }

  const { width, height } = computeElementDimensions(size, shape, orientation);

  const newElem: VenueElement = {
    id: `ve-${Date.now()}`,
    event_id: eventId,
    workspace_id: workspaceId,
    type,
    label,
    size,
    pos_x: posX,
    pos_y: posY,
    width,
    height,
    orientation,
    shape,
    created_at: new Date().toISOString(),
  };

  store[eventId].push(newElem);
  saveVenueElementsToStorage(store);
  syncVenueElementsToServerAsync(eventId);
  return newElem;
}

export async function createVenueElementAsync(
  eventId: string, 
  workspaceId: string, 
  type: VenueElementType, 
  label: string, 
  size: ElementSize = 'medium',
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  shape: 'rect' | 'round_rect' | 'circle' | 'oval' = 'round_rect',
  posX = 750, 
  posY = 320
): Promise<VenueElement> {
  const newElem = createVenueElement(eventId, workspaceId, type, label, size, orientation, shape, posX, posY);
  await syncVenueElementsToServerAsync(eventId);
  return newElem;
}

export function updateVenueElementPosition(eventId: string, elementId: string, posX: number, posY: number): void {
  const store = loadVenueElementsFromStorage();
  if (store[eventId]) {
    const elem = store[eventId].find(e => e.id === elementId);
    if (elem) {
      elem.pos_x = posX;
      elem.pos_y = posY;
      saveVenueElementsToStorage(store);
      syncVenueElementsToServerAsync(eventId);
    }
  }
}

export async function updateVenueElementPositionAsync(eventId: string, elementId: string, posX: number, posY: number): Promise<void> {
  updateVenueElementPosition(eventId, elementId, posX, posY);
  await syncVenueElementsToServerAsync(eventId);
}

export function updateVenueElement(
  eventId: string, 
  elementId: string, 
  data: Partial<Pick<VenueElement, 'label' | 'size' | 'orientation' | 'shape' | 'width' | 'height'>>
): VenueElement | null {
  const store = loadVenueElementsFromStorage();
  if (store[eventId]) {
    const elem = store[eventId].find(e => e.id === elementId);
    if (elem) {
      const nextSize = data.size || elem.size || 'medium';
      const nextShape = data.shape || elem.shape;
      const nextOrientation = data.orientation || elem.orientation;

      const dims = computeElementDimensions(nextSize, nextShape, nextOrientation);

      Object.assign(elem, data, {
        size: nextSize,
        width: dims.width,
        height: dims.height,
      });
      saveVenueElementsToStorage(store);
      syncVenueElementsToServerAsync(eventId);
      return elem;
    }
  }
  return null;
}

export async function updateVenueElementAsync(
  eventId: string, 
  elementId: string, 
  data: Partial<Pick<VenueElement, 'label' | 'size' | 'orientation' | 'shape' | 'width' | 'height'>>
): Promise<VenueElement | null> {
  const res = updateVenueElement(eventId, elementId, data);
  await syncVenueElementsToServerAsync(eventId);
  return res;
}

export function deleteVenueElement(eventId: string, elementId: string): void {
  const store = loadVenueElementsFromStorage();
  if (store[eventId]) {
    store[eventId] = store[eventId].filter(e => e.id !== elementId);
    saveVenueElementsToStorage(store);
    syncVenueElementsToServerAsync(eventId);
  }
}

export async function deleteVenueElementAsync(eventId: string, elementId: string): Promise<void> {
  deleteVenueElement(eventId, elementId);
  await syncVenueElementsToServerAsync(eventId);
}
