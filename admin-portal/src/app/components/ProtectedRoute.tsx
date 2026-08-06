import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "@/store/hooks";

/** Redirects to /login when unauthenticated, or to /select-tenant when a tenant hasn't been chosen yet. */
export function ProtectedRoute() {
  const { isAuthenticated, tenantContextRequired, activeTenant } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if ((tenantContextRequired || !activeTenant) && location.pathname !== "/select-tenant") {
    return <Navigate to="/select-tenant" replace />;
  }
  return <Outlet />;
}

/** Requires a logged-in session but not a resolved tenant — used for /select-tenant itself. */
export function RequireAuth() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Keeps an already-authenticated user with an active tenant off the login/select-tenant screens. */
export function GuestRoute() {
  const { isAuthenticated, tenantContextRequired, activeTenant } = useAppSelector((s) => s.auth);
  if (isAuthenticated && !tenantContextRequired && activeTenant) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
