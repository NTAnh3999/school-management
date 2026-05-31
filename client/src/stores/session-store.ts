import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type User } from "@/types/models";
import {
  clearAccessTokenCookie,
  getAccessTokenFromCookie,
  persistAccessTokenCookie,
} from "@/lib/token-storage";

type SessionState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  setSession: (payload: { user: User; accessToken: string; refreshToken: string }) => void;
  setUser: (user: User | null) => void;
  updateTokens: (payload: { accessToken: string; refreshToken?: string | null }) => void;
  clearSession: () => void;
  markHydrated: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: getAccessTokenFromCookie(),
      refreshToken: null,
      hasHydrated: false,
      setSession: ({ user, accessToken, refreshToken }) => {
        persistAccessTokenCookie(accessToken);
        set({ user, accessToken, refreshToken });
      },
      setUser: (user) => set({ user }),
      updateTokens: ({ accessToken, refreshToken }) => {
        persistAccessTokenCookie(accessToken);
        set((state) => ({
          accessToken,
          refreshToken: typeof refreshToken === "undefined" ? state.refreshToken : refreshToken,
        }));
      },
      clearSession: () => {
        clearAccessTokenCookie();
        set({ user: null, accessToken: null, refreshToken: null });
      },
      markHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "schoolhub.session",
      partialize: ({ user, accessToken, refreshToken }) => ({
        user,
        accessToken,
        refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        const cookieAccessToken = getAccessTokenFromCookie();
        if (cookieAccessToken && cookieAccessToken !== state?.accessToken) {
          state?.updateTokens({ accessToken: cookieAccessToken });
        }
        state?.markHydrated();
      },
    }
  )
);

export const getStoredAccessToken = () => useSessionStore.getState().accessToken;
export const getStoredRefreshToken = () => useSessionStore.getState().refreshToken;
