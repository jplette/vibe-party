import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { UserManager, WebStorageStateStore, InMemoryWebStorage } from 'oidc-client-ts';
import { oidcConfig } from './oidc-config';
import { useAuthStore } from '../stores/authStore';

interface AuthContextValue {
  userManager: UserManager;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  silentRenew: () => Promise<void>;
  register: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Guard: render a clear error when env vars are missing rather than crashing the
// entire app tree. This happens during local development when .env is not set up.
const isMissingEnvConfig = !import.meta.env.VITE_OIDC_AUTHORITY || !import.meta.env.VITE_OIDC_CLIENT_ID;

function MissingEnvBanner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      background: '#f8f9fa',
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        padding: '2rem 2.5rem',
        maxWidth: '520px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚙️</div>
        <h2 style={{ margin: '0 0 0.5rem', color: '#212529' }}>Missing environment config</h2>
        <p style={{ margin: '0 0 1rem', color: '#6c757d', lineHeight: 1.6 }}>
          The OIDC environment variables are not configured. Copy{' '}
          <code style={{ background: '#f8f9fa', padding: '0.1em 0.35em', borderRadius: '4px' }}>.env.example</code>{' '}
          to{' '}
          <code style={{ background: '#f8f9fa', padding: '0.1em 0.35em', borderRadius: '4px' }}>.env</code>{' '}
          and fill in your Keycloak settings before running the dev server.
        </p>
        <pre style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          fontSize: '0.8rem',
          textAlign: 'left',
          color: '#495057',
          margin: 0,
        }}>
          {`cp frontend/.env.example frontend/.env`}
        </pre>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isMissingEnvConfig) {
    return <MissingEnvBanner />;
  }

  return <AuthProviderInner>{children}</AuthProviderInner>;
}

function AuthProviderInner({ children }: { children: React.ReactNode }) {
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

  const register = async () => {
    await userManager.signinRedirect({ extraQueryParams: { prompt: 'create' } });
  };

  return (
    <AuthContext.Provider value={{ userManager, login, logout, silentRenew, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
