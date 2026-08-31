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
  features: string[];
}

export const PLAN_LIMITS: Record<PlanCode, PlanDefinition> = {
  STARTER: {
    code: 'STARTER',
    name: 'Starter',
    monthlyPricePEN: 39,
    annualPricePEN: 390, // ~2 months free
    maxActiveEvents: 3,
    maxPassesPerEvent: 150,
    maxWorkspaceUsers: 1,
    maxCutsPerEvent: 5,
    hasAdvancedSeating: true,
    hasPdfExecutive: true,
    features: [
      'Hasta 3 Eventos Activos',
      'Hasta 150 pases por evento',
      '1 Usuario (Owner)',
      'Plano de Mesas Interactivo',
      'WhatsApp Asistido (wa.me)',
      '5 Cortes de Catering por evento',
      'Reporte Ejecutivo en PDF y Excel',
    ],
  },
  PROFESSIONAL: {
    code: 'PROFESSIONAL',
    name: 'Professional',
    monthlyPricePEN: 79,
    annualPricePEN: 790, // ~2 months free
    maxActiveEvents: 10,
    maxPassesPerEvent: 500,
    maxWorkspaceUsers: 5,
    maxCutsPerEvent: -1,
    hasAdvancedSeating: true,
    hasPdfExecutive: true,
    features: [
      'Hasta 10 Eventos Activos',
      'Hasta 500 pases por evento',
      'Hasta 5 Usuarios de Equipo',
      'Plano de Mesas Avanzado',
      'Cortes de Catering Ilimitados',
      'WhatsApp Asistido (wa.me)',
      'Reportes PDF Ejecutivos con Dashboards',
      'Soporte Prioritario',
    ],
  },
  BUSINESS: {
    code: 'BUSINESS',
    name: 'Business',
    monthlyPricePEN: 129,
    annualPricePEN: 1290, // ~2 months free
    maxActiveEvents: -1,
    maxPassesPerEvent: 2000,
    maxWorkspaceUsers: 15,
    maxCutsPerEvent: -1,
    hasAdvancedSeating: true,
    hasPdfExecutive: true,
    features: [
      'Eventos Activos Ilimitados',
      'Hasta 2,000 pases por evento',
      'Hasta 15 Usuarios de Equipo',
      'Plano de Mesas Ilimitado',
      'Cortes de Catering Ilimitados',
      'Sincronización Offline Avanzada',
      'Reportes PDF y Excel sin marca de agua',
      'Atención y Onboarding Personalizado',
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
