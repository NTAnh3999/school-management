import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse, AuthState } from "@/types";

const STORAGE_KEY = "edtech_admin_auth";

interface PersistedAuth {
  accessToken: string;
  refreshToken: string;
  sessionId: number;
  user: AuthState["user"];
  activeTenant: AuthState["activeTenant"];
  tenants: AuthState["tenants"];
  tenantContextRequired: boolean;
}

const readPersisted = (): PersistedAuth | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedAuth) : null;
  } catch {
    return null;
  }
};

const persisted = readPersisted();

const initialState: AuthState = {
  user: persisted?.user ?? null,
  accessToken: persisted?.accessToken ?? null,
  refreshToken: persisted?.refreshToken ?? null,
  sessionId: persisted?.sessionId ?? null,
  activeTenant: persisted?.activeTenant ?? null,
  tenants: persisted?.tenants ?? [],
  tenantContextRequired: persisted?.tenantContextRequired ?? false,
  isAuthenticated: !!persisted?.accessToken,
};

const persist = (state: AuthState) => {
  if (!state.accessToken || !state.refreshToken || !state.sessionId) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const toStore: PersistedAuth = {
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    sessionId: state.sessionId,
    user: state.user,
    activeTenant: state.activeTenant,
    tenants: state.tenants,
    tenantContextRequired: state.tenantContextRequired,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Applied after login, switch-tenant, or token refresh — all three return the same
    // AuthResponse envelope from the backend (see AuthService.buildAuthResponse).
    setAuthResponse(state, action: PayloadAction<AuthResponse>) {
      const { access_token, refresh_token, session, active_tenant, tenants, user, tenant_context_required } =
        action.payload;
      state.accessToken = access_token;
      state.refreshToken = refresh_token;
      state.sessionId = session.id;
      state.activeTenant = active_tenant;
      state.tenants = tenants;
      state.tenantContextRequired = tenant_context_required;
      state.user = user;
      state.isAuthenticated = true;
      persist(state);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.sessionId = null;
      state.activeTenant = null;
      state.tenants = [];
      state.tenantContextRequired = false;
      state.isAuthenticated = false;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { setAuthResponse, logout } = authSlice.actions;
export default authSlice.reducer;
