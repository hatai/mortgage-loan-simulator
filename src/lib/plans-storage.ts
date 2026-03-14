import type { SavedPlan } from "./types";

const STORAGE_KEY = "mortgage-simulator-plans";

export function loadPlans(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function savePlan(plan: SavedPlan): void {
  const plans = loadPlans();
  plans.push(plan);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function deletePlan(id: string): void {
  const plans = loadPlans().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function renamePlan(id: string, name: string): void {
  const plans = loadPlans().map((p) => (p.id === id ? { ...p, name } : p));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
