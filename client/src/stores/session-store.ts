import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type User } from "@/types/models";
import { clearAccessTokenCookie, persistAccessTokenCookie } from "@/lib/token-storage";

type SessionState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (payload: { user: User; accessToken: string; refreshToken: string }) => void;
  setUser: (user: User | null) => void;
  updateTokens: (payload: { accessToken: string; refreshToken?: string | null }) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
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
    }),
    {
      name: "schoolhub.session",
    }
  )
);

export const getStoredAccessToken = () => useSessionStore.getState().accessToken;
export const getStoredRefreshToken = () => useSessionStore.getState().refreshToken;
