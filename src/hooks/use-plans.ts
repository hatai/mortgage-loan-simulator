import { useCallback, useSyncExternalStore } from "react";
import type { LoanInput, LoanResult, SavedPlan } from "../lib/types";
import {
  STORAGE_KEY,
  loadPlans,
  savePlan as storageSave,
  deletePlan as storageDelete,
  renamePlan as storageRename,
  generatePlanId,
} from "../lib/plans-storage";

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedPlans: SavedPlan[] = [];

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify() {
  cachedRaw = null;
  listeners.forEach((cb) => cb());
}

function getSnapshot(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedPlans;
    cachedRaw = raw;
    cachedPlans = raw ? JSON.parse(raw) : [];
    return cachedPlans;
  } catch {
    return [];
  }
}

function getServerSnapshot(): SavedPlan[] {
  return [];
}

export function usePlans() {
  const plans = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const save = useCallback((name: string, input: LoanInput, result: LoanResult) => {
    const plan: SavedPlan = {
      id: generatePlanId(),
      name,
      input,
      result,
      createdAt: new Date().toISOString(),
    };
    storageSave(plan);
    notify();
    return plan;
  }, []);

  const remove = useCallback((id: string) => {
    storageDelete(id);
    notify();
  }, []);

  const rename = useCallback((id: string, name: string) => {
    storageRename(id, name);
    notify();
  }, []);

  return { plans, save, remove, rename };
}
