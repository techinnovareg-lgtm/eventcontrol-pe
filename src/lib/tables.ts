import { Table, TableAssignment } from '@/lib/supabase/types';

// Mock repository for Tables and Assignments
let tablesStore: Record<string, Table[]> = {
  'evt-102': [
    { id: 'tbl-1', event_id: 'evt-102', workspace_id: 'ws-a-1111', name: 'Mesa 1 (Familia)', capacity: 10, pos_x: 50, pos_y: 50, created_at: new Date().toISOString() },
    { id: 'tbl-2', event_id: 'evt-102', workspace_id: 'ws-a-1111', name: 'Mesa 2 (Amigos)', capacity: 8, pos_x: 250, pos_y: 50, created_at: new Date().toISOString() },
    { id: 'tbl-3', event_id: 'evt-102', workspace_id: 'ws-a-1111', name: 'Mesa 3 (Honor)', capacity: 6, pos_x: 450, pos_y: 50, created_at: new Date().toISOString() },
  ]
};

let assignmentsStore: Record<string, TableAssignment[]> = {
  'evt-102': [
    { id: 'ta-1', table_id: 'tbl-1', group_id: 'gg-1', event_id: 'evt-102', workspace_id: 'ws-a-1111', assigned_passes: 1, created_at: new Date().toISOString() },
    { id: 'ta-2', table_id: 'tbl-1', group_id: 'gg-2', event_id: 'evt-102', workspace_id: 'ws-a-1111', assigned_passes: 6, created_at: new Date().toISOString() },
  ]
};

export function getEventTables(eventId: string): Table[] {
  return tablesStore[eventId] || [];
}

export function createTable(eventId: string, workspaceId: string, name: string, capacity: number, pos_x = 100, pos_y = 100): Table {
  const newTbl: Table = {
    id: `tbl-${Date.now()}`,
    event_id: eventId,
    workspace_id: workspaceId,
    name,
    capacity,
    pos_x,
    pos_y,
    created_at: new Date().toISOString(),
  };

  if (!tablesStore[eventId]) tablesStore[eventId] = [];
  tablesStore[eventId].push(newTbl);
  return newTbl;
}

export function deleteTable(eventId: string, tableId: string) {
  if (tablesStore[eventId]) {
    tablesStore[eventId] = tablesStore[eventId].filter(t => t.id !== tableId);
  }
  if (assignmentsStore[eventId]) {
    assignmentsStore[eventId] = assignmentsStore[eventId].filter(a => a.table_id !== tableId);
  }
}

export function getEventTableAssignments(eventId: string): TableAssignment[] {
  return assignmentsStore[eventId] || [];
}

export function assignGroupToTable(eventId: string, workspaceId: string, tableId: string, groupId: string, passes: number): TableAssignment {
  if (!assignmentsStore[eventId]) assignmentsStore[eventId] = [];

  // Remove existing assignment if group was assigned elsewhere
  assignmentsStore[eventId] = assignmentsStore[eventId].filter(a => a.group_id !== groupId);

  const newAssign: TableAssignment = {
    id: `ta-${Date.now()}`,
    table_id: tableId,
    group_id: groupId,
    event_id: eventId,
    workspace_id: workspaceId,
    assigned_passes: passes,
    created_at: new Date().toISOString(),
  };

  assignmentsStore[eventId].push(newAssign);
  return newAssign;
}

export function unassignGroupFromTable(eventId: string, groupId: string) {
  if (assignmentsStore[eventId]) {
    assignmentsStore[eventId] = assignmentsStore[eventId].filter(a => a.group_id !== groupId);
  }
}

export function calculateTableOccupancy(eventId: string, tableId: string, capacity: number) {
  const assignments = (assignmentsStore[eventId] || []).filter(a => a.table_id === tableId);
  const totalAssigned = assignments.reduce((sum, a) => sum + a.assigned_passes, 0);
  const isOvercapacity = totalAssigned > capacity;
  const overflowCount = isOvercapacity ? totalAssigned - capacity : 0;

  return {
    totalAssigned,
    capacity,
    isOvercapacity,
    overflowCount,
    occupancyRatio: `${totalAssigned} / ${capacity}`,
  };
}
