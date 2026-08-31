import { UserRole } from '@/lib/supabase/types';

export type PermissionAction = 
  | 'manage_billing'
  | 'manage_workspace_users'
  | 'create_event'
  | 'edit_event'
  | 'import_guests'
  | 'manage_tables'
  | 'generate_qr'
  | 'perform_check_in'
  | 'create_cut'
  | 'view_dashboard'
  | 'export_reports';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  OWNER: [
    'manage_billing',
    'manage_workspace_users',
    'create_event',
    'edit_event',
    'import_guests',
    'manage_tables',
    'generate_qr',
    'perform_check_in',
    'create_cut',
    'view_dashboard',
    'export_reports',
  ],
  ADMIN: [
    'create_event',
    'edit_event',
    'import_guests',
    'manage_tables',
    'generate_qr',
    'perform_check_in',
    'create_cut',
    'view_dashboard',
    'export_reports',
  ],
  COORDINADOR: [
    'create_event',
    'edit_event',
    'import_guests',
    'manage_tables',
    'generate_qr',
    'perform_check_in',
    'create_cut',
    'view_dashboard',
    'export_reports',
  ],
  SEGURIDAD: [
    'perform_check_in',
  ],
  CONSULTA: [
    'view_dashboard',
    'export_reports',
  ],
};

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function isSecurityOnlyRole(role: UserRole): boolean {
  return role === 'SEGURIDAD';
}
