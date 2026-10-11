"use client";

import { useSyncExternalStore } from "react";

// SSR-safe media query; false on the server and first paint.
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Master-detail layouts switch at the design's desktop width.
export const WIDE_QUERY = "(min-width: 1280px)";
