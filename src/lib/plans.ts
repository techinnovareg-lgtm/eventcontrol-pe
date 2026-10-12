export type PlanCode = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  monthlyPricePEN: number;
  annualPricePEN: number;
  maxActiveEvents: number; // -1 for unlimited
  maxPassesPerEvent: number;
  maxWorkspaceUsers: number;
  maxCutsPerEvent: number; // -1 for unlimited
  hasAdvancedSeating: boolean;
  hasPdfExecutive: boolean;
  profile: string;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanCode, PlanDefinition> = {
  STARTER: {
    code: 'STARTER',
    name: 'Starter',
    monthlyPricePEN: 29.99,
    annualPricePEN: 299.99,
    maxActiveEvents: 3,
    maxPassesPerEvent: 150,
    maxWorkspaceUsers: 1,
    maxCutsPerEvent: 5,
    hasAdvancedSeating: true,
    hasPdfExecutive: true,
    profile: 'Planner independiente con pocos eventos.',
    features: [
      'Hasta 3 Eventos Activos',
      'Hasta 150 pases por evento',
      '1 Usuario (Workspace)',
      'Importación desde Excel (.xlsx / .csv)',
      'Generación de códigos QR únicos por grupo',
      'Plano de Mesas Interactivo',
      'Check-in atómico en tiempo real',
      'Dashboard en vivo',
      '5 Cortes por evento',
      'Reporte Ejecutivo en PDF y Excel',
      'WhatsApp Asistido (wa.me)',
      'Soporte Básico',
    ],
  },
  PROFESSIONAL: {
    code: 'PROFESSIONAL',
    name: 'Professional',
    monthlyPricePEN: 59.99,
    annualPricePEN: 599.99,
    maxActiveEvents: 10,
    maxPassesPerEvent: 500,
    maxWorkspaceUsers: 5,
    maxCutsPerEvent: -1,
    hasAdvancedSeating: true,
    hasPdfExecutive: true,
    profile: 'Planner con eventos recurrentes y equipo pequeño.',
    features: [
      'Hasta 10 Eventos Activos',
      'Hasta 500 pases por evento',
      'Hasta 5 Usuarios / Workspace (Roles RBAC)',
      'Plano de Mesas Avanzado',
      'Check-in atómico en tiempo real',
      'Dashboard en vivo',
      'Cortes de Catering Ilimitados',
      'Reportes PDF Ejecutivos con Dashboards',
      'WhatsApp Asistido (wa.me)',
      'Histórico de 1 año',
      'Soporte Prioritario',
    ],
  },
  BUSINESS: {
    code: 'BUSINESS',
    name: 'Business',
    monthlyPricePEN: 99.99,
    annualPricePEN: 999.99,
    maxActiveEvents: -1,
    maxPassesPerEvent: 1000,
    maxWorkspaceUsers: 10,
    maxCutsPerEvent: -1,
    hasAdvancedSeating: true,
    hasPdfExecutive: true,
    profile: 'Planner profesional / agencia con mayor volumen.',
    features: [
      'Eventos Activos Ilimitados*',
      'Hasta 1,000+ pases por evento',
      'Hasta 10+ Usuarios / Workspace',
      'Plano de Mesas Avanzado',
      'Check-in atómico en tiempo real',
      'Dashboard en vivo',
      'Cortes de Catering Ilimitados',
      'Resiliencia Offline-First (IndexedDB)',
      'Reportes PDF y Excel sin marca de agua',
      'Histórico según política',
      'Soporte Prioritario y Onboarding',
    ],
  },
};

/**
 * Checks if workspace can create a new event based on plan limits
 */
export function checkCanCreateEvent(planCode: PlanCode, currentActiveEventsCount: number): { allowed: boolean; reason?: string } {
  const plan = PLAN_LIMITS[planCode] || PLAN_LIMITS.STARTER;

  if (plan.maxActiveEvents !== -1 && currentActiveEventsCount >= plan.maxActiveEvents) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${plan.maxActiveEvents} eventos activos de tu plan ${plan.name}. Actualiza a un plan superior para continuar.`,
    };
  }

  return { allowed: true };
}

/**
 * Checks if guest count exceeds plan limit per event
 */
export function checkCanImportPasses(planCode: PlanCode, passesCount: number): { allowed: boolean; reason?: string } {
  const plan = PLAN_LIMITS[planCode] || PLAN_LIMITS.STARTER;

  if (passesCount > plan.maxPassesPerEvent) {
    return {
      allowed: false,
      reason: `La cantidad de ${passesCount} pases supera el máximo permitido de ${plan.maxPassesPerEvent} pases por evento de tu plan ${plan.name}.`,
    };
  }

  return { allowed: true };
}

/**
 * Checks if workspace can add more team members / collaborators based on plan limits
 */
export function checkCanAddWorkspaceMember(planCode: PlanCode, currentMembersCount: number): { allowed: boolean; reason?: string } {
  const plan = PLAN_LIMITS[planCode] || PLAN_LIMITS.STARTER;

  if (plan.maxWorkspaceUsers !== -1 && currentMembersCount >= plan.maxWorkspaceUsers) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${plan.maxWorkspaceUsers} ${plan.maxWorkspaceUsers === 1 ? 'usuario' : 'usuarios'} de tu plan ${plan.name}. Para invitar más coordinadores u operadores de puerta, actualiza a un plan superior (Professional o Business).`,
    };
  }

  return { allowed: true };
}

/**
 * Checks if event can record more catering cuts based on plan limits
 */
export function checkCanCreateCut(planCode: PlanCode, currentCutsCount: number): { allowed: boolean; reason?: string } {
  const plan = PLAN_LIMITS[planCode] || PLAN_LIMITS.STARTER;

  if (plan.maxCutsPerEvent !== -1 && currentCutsCount >= plan.maxCutsPerEvent) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${plan.maxCutsPerEvent} cortes de catering por evento de tu plan ${plan.name}. Actualiza a Plan Professional o Business para cortes ilimitados.`,
    };
  }

  return { allowed: true };
}

export interface RolePermissionDetail {
  role: 'OWNER' | 'ADMIN' | 'COORDINADOR' | 'OPERATOR';
  title: string;
  badgeColor: string;
  scope: string;
  canManageWorkspace: boolean;
  canCreateEvents: boolean;
  canManageTeam: boolean;
  canManageGuestsAndTables: boolean;
  canScanQR: boolean;
  canViewReports: boolean;
  description: string;
}

export const ROLE_PERMISSIONS: Record<string, RolePermissionDetail> = {
  OWNER: {
    role: 'OWNER',
    title: 'PROPIETARIO (Titular)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    scope: 'Acceso total a la cuenta, facturación, eventos y equipo.',
    canManageWorkspace: true,
    canCreateEvents: true,
    canManageTeam: true,
    canManageGuestsAndTables: true,
    canScanQR: true,
    canViewReports: true,
    description: 'Control absoluto del espacio de trabajo, gestión de eventos según límites del plan, facturación y adición de usuarios.',
  },
  ADMIN: {
    role: 'ADMIN',
    title: 'ADMINISTRADOR',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    scope: 'Gestión completa de eventos, invitados, mesas y personal.',
    canManageWorkspace: true,
    canCreateEvents: true,
    canManageTeam: true,
    canManageGuestsAndTables: true,
    canScanQR: true,
    canViewReports: true,
    description: 'Administración operativa completa de todos los eventos del workspace, coordinación de mesas y personal de puerta.',
  },
  COORDINADOR: {
    role: 'COORDINADOR',
    title: 'COORDINADOR (Gestión & Mesas)',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    scope: 'Gestión operativa del evento asignado (mesas, pases, reportes).',
    canManageWorkspace: false,
    canCreateEvents: false,
    canManageTeam: false,
    canManageGuestsAndTables: true,
    canScanQR: true,
    canViewReports: true,
    description: 'Coordinación directa de invitados, asignación de mesas en plano interactivo, envíos de WhatsApp y reportes ejecutivos del evento.',
  },
  OPERATOR: {
    role: 'OPERATOR',
    title: 'SEGURIDAD (Puerta)',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    scope: 'Control de acceso y escáner de códigos QR en puerta exclusivamente.',
    canManageWorkspace: false,
    canCreateEvents: false,
    canManageTeam: false,
    canManageGuestsAndTables: false,
    canScanQR: true,
    canViewReports: false,
    description: 'Personal de puerta con acceso exclusivo a la cámara y escáner QR para validación atómica y registro de asistencia en tiempo real.',
  },
};
