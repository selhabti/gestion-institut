import { useSyncExternalStore } from "react";
import { getCurrentInstitutId, INSTITUT_ID_CHANGED_EVENT, type InstitutId } from "@/lib/institutes";

let listeners = new Set<() => void>();

// Simple event-based subscription so components can react to institut changes
export function useCurrentInstitut(): InstitutId | null {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null
  );
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): InstitutId | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem("selected-institut") as InstitutId | null;
  return id && (id === "zayed" || id === "attanzil") ? id : null;
}

// Callback invoked by the institut selector when it changes
if (typeof window !== "undefined") {
  window.addEventListener(INSTITUT_ID_CHANGED_EVENT, () => {
    listeners.forEach((cb) => cb());
  });
}
