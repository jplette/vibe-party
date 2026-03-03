import { create } from 'zustand';
import type { User as OidcUser } from 'oidc-client-ts';

interface AuthState {
  // Token lives only in memory — never persisted
  accessToken: string | null;
  oidcUser: OidcUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setOidcUser: (user: OidcUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  oidcUser: null,
  isAuthenticated: false,
  isLoading: true,

  setOidcUser: (user) =>
    set({
      oidcUser: user,
      accessToken: user?.access_token ?? null,
      isAuthenticated: !!user && !user.expired,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearAuth: () =>
    set({
      oidcUser: null,
      accessToken: null,
      isAuthenticated: false,
    }),
}));
