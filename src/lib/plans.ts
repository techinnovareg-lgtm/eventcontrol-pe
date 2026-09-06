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
