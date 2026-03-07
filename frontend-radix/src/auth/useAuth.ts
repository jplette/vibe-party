import { useAuthStore } from '../stores/authStore';
import { useAuthContext } from './AuthProvider';

export function useAuth() {
  const { login, logout, silentRenew, register, userManager } = useAuthContext();
  const { accessToken, oidcUser, isAuthenticated, isLoading } = useAuthStore();
  const profile = oidcUser?.profile;
  return {
    isAuthenticated,
    isLoading,
    accessToken,
    oidcUser,
    userId: profile?.sub ?? null,
    email: (profile?.email as string | undefined) ?? null,
    name:
      (profile?.name as string | undefined) ??
      (profile?.preferred_username as string | undefined) ??
      null,
    roles: (profile?.roles as string[] | undefined) ?? [],
    login,
    logout,
    silentRenew,
    register,
    userManager,
  };
}
