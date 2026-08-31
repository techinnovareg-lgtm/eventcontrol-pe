import { Workspace, WorkspaceMember, UserRole, Event } from '@/lib/supabase/types';

export interface WorkspaceContext {
  workspace: Workspace;
  role: UserRole;
}

// In-memory tenant store for development and testing workspace isolation
const mockWorkspaces: Record<string, Workspace> = {
  'ws-a-1111': {
    id: 'ws-a-1111',
    name: 'AMG Wedding Planners (Workspace A)',
    slug: 'amg-weddings',
    plan_code: 'STARTER',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'ws-b-2222': {
    id: 'ws-b-2222',
    name: 'Festejos & Eventos VIP (Workspace B)',
    slug: 'festejos-vip',
    plan_code: 'PROFESSIONAL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const mockMembers: WorkspaceMember[] = [
  { id: 'm-1', workspace_id: 'ws-a-1111', user_id: 'user-owner-a', role: 'OWNER', created_at: new Date().toISOString() },
  { id: 'm-2', workspace_id: 'ws-a-1111', user_id: 'user-security-a', role: 'SEGURIDAD', created_at: new Date().toISOString() },
  { id: 'm-3', workspace_id: 'ws-b-2222', user_id: 'user-owner-b', role: 'OWNER', created_at: new Date().toISOString() },
];

const mockEvents: Event[] = [
  {
    id: 'evt-a-1',
    workspace_id: 'ws-a-1111',
    name: 'Boda Ronny & Diana',
    event_type: 'Boda',
    event_date: '2026-10-15',
    status: 'ACTIVO',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'evt-b-1',
    workspace_id: 'ws-b-2222',
    name: 'Aniversario Corporativo Tech',
    event_type: 'Corporativo',
    event_date: '2026-11-20',
    status: 'ACTIVO',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Strict Multi-Tenant Event Access Verifier
 * Prevents cross-workspace data access (IDOR protection)
 */
export function getEventsForUserWorkspace(userId: string, targetWorkspaceId: string): { success: boolean; events?: Event[]; error?: string } {
  // 1. Verify user membership in requested workspace
  const membership = mockMembers.find(m => m.user_id === userId && m.workspace_id === targetWorkspaceId);

  if (!membership) {
    return {
      success: false,
      error: 'ACCESS_DENIED: User does not belong to the target workspace.',
    };
  }

  // 2. Filter events strictly matching workspace_id
  const events = mockEvents.filter(e => e.workspace_id === targetWorkspaceId);

  return {
    success: true,
    events,
  };
}

/**
 * Automated Multi-Tenant Isolation Test Runner
 * Returns proof of cross-tenant security verification
 */
export function testCrossWorkspaceIsolation(): { passed: boolean; logs: string[] } {
  const logs: string[] = [];
  
  // Test 1: User A requests Workspace A events -> Should succeed
  const resultA = getEventsForUserWorkspace('user-owner-a', 'ws-a-1111');
  if (resultA.success && resultA.events?.length === 1 && resultA.events[0].id === 'evt-a-1') {
    logs.push('✅ Test 1 PASSED: User A successfully retrieved Workspace A events.');
  } else {
    logs.push('❌ Test 1 FAILED.');
  }

  // Test 2: User A attempts to access Workspace B events -> Must be DENIED
  const resultCross = getEventsForUserWorkspace('user-owner-a', 'ws-b-2222');
  if (!resultCross.success && resultCross.error?.includes('ACCESS_DENIED')) {
    logs.push('✅ Test 2 PASSED: User A cross-workspace access to Workspace B was DENIED (IDOR Blocked).');
  } else {
    logs.push('❌ Test 2 FAILED: Data leakage detected!');
  }

  // Test 3: User B attempts to access Workspace A events -> Must be DENIED
  const resultCrossB = getEventsForUserWorkspace('user-owner-b', 'ws-a-1111');
  if (!resultCrossB.success && resultCrossB.error?.includes('ACCESS_DENIED')) {
    logs.push('✅ Test 3 PASSED: User B cross-workspace access to Workspace A was DENIED.');
  } else {
    logs.push('❌ Test 3 FAILED: Data leakage detected!');
  }

  const passed = logs.every(l => l.includes('PASSED'));
  return { passed, logs };
}
