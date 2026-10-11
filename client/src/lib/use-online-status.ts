"use client";

import { useSyncExternalStore } from "react";

// Browser connectivity for the offline banners in the Learning Player and
// Assessment Attempt. Assumes online during SSR.
export function useOnlineStatus() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
