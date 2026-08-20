import type { Plan } from "@prisma/client";

export const PLAN_LIMITS: Record<Plan, { maxLocations: number; platforms: string[]; sms: boolean }> = {
  starter: { maxLocations: 1, platforms: ["google", "facebook"], sms: false },
  growth: { maxLocations: 3, platforms: ["google", "facebook"], sms: true },
};

export function canAddLocation(plan: Plan, currentLocationCount: number): boolean {
  return currentLocationCount < PLAN_LIMITS[plan].maxLocations;
}

export function canUseSms(plan: Plan): boolean {
  return PLAN_LIMITS[plan].sms;
}
