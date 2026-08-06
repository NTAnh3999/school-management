import type { ReactNode } from "react";
import { useHasAnyPermission } from "@/features/auth/permissions";

interface PermissionGateProps {
  /** Permission code(s) required to render children. Any one match is sufficient. */
  permission: string | string[];
  children: ReactNode;
  /** Rendered instead when the permission is missing (default: nothing). */
  fallback?: ReactNode;
}

/**
 * Hides an action/element the current user isn't allowed to use — per UI/UX spec 10.2
 * (Role-based Visibility): "Không có quyền tạo user thì ẩn hoặc disable action".
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const codes = Array.isArray(permission) ? permission : [permission];
  const allowed = useHasAnyPermission(codes);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
