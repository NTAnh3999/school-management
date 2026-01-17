import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type User } from "@/types/models";

type SessionState = {
  user: User | null;
  token: string | null;
  setSession: (payload: { user: User; token: string }) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: ({ user, token }) => set({ user, token }),
      clearSession: () => set({ user: null, token: null }),
    }),
    {
      name: "schoolhub.session",
    }
  )
);

export const getSessionToken = () => useSessionStore.getState().token;
