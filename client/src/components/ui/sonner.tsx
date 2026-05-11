"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-left"
      closeButton
      duration={3200}
      theme="light"
      toastOptions={{
        style: {
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(193, 198, 214, 0.9)",
          color: "hsl(var(--foreground))",
          boxShadow: "var(--shadow-level-2)",
          borderRadius: "1rem",
        },
      }}
    />
  );
}
