import { useAppSelector } from "@/store/hooks";

/** All permission codes granted to the current user in the active tenant (see IamUser.permissions). */
export function usePermissions(): string[] {
  return useAppSelector((s) => s.auth.user?.permissions.map((p) => p.code) ?? []);
}

/** True if the current user holds the given permission code, e.g. "iam.user.manage". */
export function useHasPermission(code: string): boolean {
  const codes = usePermissions();
  return codes.includes(code);
}

/** True if the current user holds any of the given permission codes. */
export function useHasAnyPermission(codes: string[]): boolean {
  const granted = usePermissions();
  return codes.some((c) => granted.includes(c));
}

/** Primary role name for the active tenant, e.g. "admin" | "teacher". */
export function useRole(): string | null {
  return useAppSelector((s) => s.auth.user?.role ?? null);
}
