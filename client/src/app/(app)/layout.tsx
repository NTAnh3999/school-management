"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getAccessTokenFromCookie } from "@/lib/token-storage";
import { useSessionStore } from "@/stores/session-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);
  const hasHydrated = useSessionStore((state) => state.hasHydrated);
  const hasAccessToken = Boolean(accessToken ?? getAccessTokenFromCookie());

  useEffect(() => {
    if (hasHydrated && !hasAccessToken) {
      router.replace("/login");
    }
  }, [hasAccessToken, hasHydrated, router]);

  if (!hasAccessToken) return null;

  return <AppShell>{children}</AppShell>;
}
