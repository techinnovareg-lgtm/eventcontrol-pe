export type UserRole = 'OWNER' | 'ADMIN' | 'COORDINADOR' | 'SEGURIDAD' | 'CONSULTA';
export type EventStatus = 'BORRADOR' | 'PREPARACION' | 'ACTIVO' | 'FINALIZADO' | 'ARCHIVADO';
export type GroupStatus = 'PENDIENTE' | 'PARCIAL' | 'COMPLETO';
export type CheckInResultStatus = 
  | 'SUCCESS_PARTIAL' 
  | 'SUCCESS_COMPLETE' 
  | 'REJECTED_EXCEEDED' 
  | 'REJECTED_INVALID' 
  | 'REJECTED_REVOKED';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  plan_code: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Event {
  id: string;
  workspace_id: string;
  name: string;
  event_type: string;
  event_date: string;
  event_time?: string;
  venue_name?: string;
  status: EventStatus;
  contingency_pin?: string;
  allow_free_manual_checkin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuestGroup {
  id: string;
  event_id: string;
  workspace_id: string;
  group_name: string;
  max_passes: number;
  checked_in_count: number;
  responsible_phone?: string;
  external_id?: string;
  notes?: string;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
}

export interface QRToken {
  id: string;
  group_id: string;
  event_id: string;
  workspace_id: string;
  token_hash: string;
  is_active: boolean;
  created_at: string;
}

export interface Table {
  id: string;
  event_id: string;
  workspace_id: string;
  name: string;
  capacity: number;
  pos_x: number;
  pos_y: number;
  created_at: string;
}

export interface TableAssignment {
  id: string;
  table_id: string;
  group_id: string;
  event_id: string;
  workspace_id: string;
  assigned_passes: number;
  created_at: string;
}

export interface CheckIn {
  id: string;
  event_id: string;
  group_id?: string;
  qr_token_id?: string;
  workspace_id: string;
  operator_user_id?: string;
  passes_entered: number;
  passes_accumulated: number;
  is_offline_sync: boolean;
  result_status: CheckInResultStatus;
  entry_timestamp: string;
}

export interface Cut {
  id: string;
  event_id: string;
  workspace_id: string;
  cut_name: string;
  cut_timestamp: string;
  total_authorized: number;
  total_present: number;
  total_pending: number;
  table_snapshots: Record<string, any>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id?: string;
  action_type: string;
  entity_name: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}
