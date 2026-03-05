import { useAuthStore } from '../stores/authStore';
import { useAuthContext } from './AuthProvider';

/**
 * Primary auth hook — combines store state with context actions.
 * Use this in components rather than accessing the store directly.
 */
export function useAuth() {
  const { login, logout, silentRenew, register, userManager } = useAuthContext();
  const { accessToken, oidcUser, isAuthenticated, isLoading } = useAuthStore();

  const profile = oidcUser?.profile;

  return {
    // State
    isAuthenticated,
    isLoading,
    accessToken,
    oidcUser,

    // Derived user info from OIDC profile
    userId: profile?.sub ?? null,
    email: (profile?.email as string | undefined) ?? null,
    name: (profile?.name as string | undefined) ?? (profile?.preferred_username as string | undefined) ?? null,
    roles: (profile?.roles as string[] | undefined) ?? [],

    // Actions
    login,
    logout,
    silentRenew,
    register,
    userManager,
  };
}
