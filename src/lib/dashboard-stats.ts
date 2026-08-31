import { getEventGuestGroups } from '@/lib/events';
import { getEventTables, getEventTableAssignments } from '@/lib/tables';
import { getEventCheckInLogs } from '@/lib/checkin';
import { CheckIn } from '@/lib/supabase/types';

export interface DashboardEventMetrics {
  totalAuthorized: number;
  totalEntered: number;
  totalPending: number;
  occupancyPercentage: number;
  completeGroupsCount: number;
  partialGroupsCount: number;
  pendingGroupsCount: number;
  totalGroupsCount: number;
}

export interface TableOccupancyStat {
  tableId: string;
  tableName: string;
  capacity: number;
  assignedPasses: number;
  presentPasses: number;
  occupancyRatio: string;
  occupancyPercentage: number;
}

export function calculateDashboardMetrics(eventId: string): DashboardEventMetrics {
  const groups = getEventGuestGroups(eventId);

  let totalAuthorized = 0;
  let totalEntered = 0;
  let completeGroupsCount = 0;
  let partialGroupsCount = 0;
  let pendingGroupsCount = 0;

  groups.forEach((g) => {
    const passes = g.max_passes || 0;
    const checked = g.checked_in_count || 0;

    totalAuthorized += passes;
    totalEntered += checked;

    if (g.status === 'COMPLETO') {
      completeGroupsCount++;
    } else if (g.status === 'PARCIAL') {
      partialGroupsCount++;
    } else {
      pendingGroupsCount++;
    }
  });

  const totalPending = Math.max(0, totalAuthorized - totalEntered);
  const occupancyPercentage = totalAuthorized > 0 ? Math.round((totalEntered / totalAuthorized) * 100) : 0;

  return {
    totalAuthorized,
    totalEntered,
    totalPending,
    occupancyPercentage,
    completeGroupsCount,
    partialGroupsCount,
    pendingGroupsCount,
    totalGroupsCount: groups.length,
  };
}

export function getTablesOccupancyStats(eventId: string): TableOccupancyStat[] {
  const tables = getEventTables(eventId);
  const assignments = getEventTableAssignments(eventId);
  const groups = getEventGuestGroups(eventId);

  return tables.map((tbl) => {
    const tblAssignments = assignments.filter(a => a.table_id === tbl.id);
    let assignedPasses = 0;
    let presentPasses = 0;

    tblAssignments.forEach((asgn) => {
      assignedPasses += asgn.assigned_passes;
      const grp = groups.find(g => g.id === asgn.group_id);
      if (grp) {
        presentPasses += grp.checked_in_count || 0;
      }
    });

    const occupancyPercentage = tbl.capacity > 0 ? Math.min(100, Math.round((presentPasses / tbl.capacity) * 100)) : 0;

    return {
      tableId: tbl.id,
      tableName: tbl.name,
      capacity: tbl.capacity,
      assignedPasses,
      presentPasses,
      occupancyRatio: `${presentPasses} / ${tbl.capacity}`,
      occupancyPercentage,
    };
  });
}

export function getRecentCheckInsFeed(eventId: string, limit = 10): (CheckIn & { groupName?: string; tableName?: string })[] {
  const rawLogs = getEventCheckInLogs(eventId);
  const groups = getEventGuestGroups(eventId);
  const assignments = getEventTableAssignments(eventId);
  const tables = getEventTables(eventId);

  return rawLogs.slice(0, limit).map((log) => {
    let groupName = 'Grupo';
    let tableName = 'Sin Mesa';

    if (log.group_id) {
      const grp = groups.find(g => g.id === log.group_id);
      if (grp) groupName = grp.group_name;

      const asgn = assignments.find(a => a.group_id === log.group_id);
      if (asgn) {
        const tbl = tables.find(t => t.id === asgn.table_id);
        if (tbl) tableName = tbl.name;
      }
    }

    return {
      ...log,
      groupName,
      tableName,
    };
  });
}
