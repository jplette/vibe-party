import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { UserManager, WebStorageStateStore, InMemoryWebStorage } from 'oidc-client-ts';
import { oidcConfig } from './oidc-config';
import { useAuthStore } from '../stores/authStore';

interface AuthContextValue {
  userManager: UserManager;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  silentRenew: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setOidcUser = useAuthStore((s) => s.setOidcUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Use in-memory store so tokens never touch localStorage
  const userManager = useMemo(
    () =>
      new UserManager({
        ...oidcConfig,
        userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
      }),
    []
  );

  // Prevent double-initialization in StrictMode
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load existing session from memory store
    userManager
      .getUser()
      .then((user) => {
        setOidcUser(user);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Subscribe to OIDC events
    userManager.events.addUserLoaded((user) => {
      setOidcUser(user);
    });

    userManager.events.addUserUnloaded(() => {
      clearAuth();
    });

    userManager.events.addAccessTokenExpired(() => {
      userManager.signinSilent().catch(() => clearAuth());
    });

    userManager.events.addSilentRenewError(() => {
      clearAuth();
    });

    return () => {
      userManager.events.removeUserLoaded(() => {});
      userManager.events.removeUserUnloaded(() => {});
    };
  }, [userManager, setOidcUser, setLoading, clearAuth]);

  const login = async () => {
    await userManager.signinRedirect();
  };

  const logout = async () => {
    clearAuth();
    await userManager.signoutRedirect();
  };

  const silentRenew = async () => {
    const user = await userManager.signinSilent();
    setOidcUser(user);
  };

  return (
    <AuthContext.Provider value={{ userManager, login, logout, silentRenew }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
