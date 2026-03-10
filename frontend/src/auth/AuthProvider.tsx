import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { UserManager, WebStorageStateStore, InMemoryWebStorage } from 'oidc-client-ts';
import { Callout, Flex, Code, Text, Heading, Box } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { oidcConfig } from './oidc-config';
import { useAuthStore } from '../stores/authStore';

interface AuthContextValue {
  userManager: UserManager;
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  silentRenew: () => Promise<void>;
  register: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Guard: render a clear error when env vars are missing rather than crashing the
// entire app tree. This happens during local development when .env is not set up.
const isMissingEnvConfig =
  !import.meta.env.VITE_OIDC_AUTHORITY || !import.meta.env.VITE_OIDC_CLIENT_ID;

function MissingEnvBanner() {
  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <Box style={{ maxWidth: '520px', width: '100%' }}>
        <Heading size="4" mb="3">
          Missing environment config
        </Heading>
        <Callout.Root color="amber" variant="surface" mb="4">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            The OIDC environment variables are not configured. Copy{' '}
            <Code variant="ghost">.env.example</Code> to <Code variant="ghost">.env</Code> and fill
            in your Keycloak settings before running the dev server.
          </Callout.Text>
        </Callout.Root>
        <Text as="p" size="2" color="gray">
          Run: <Code variant="soft">cp frontend-radix/.env.example frontend-radix/.env</Code>
        </Text>
      </Box>
    </Flex>
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

  const login = async (returnTo?: string) => {
    // Pass the intended destination through the OIDC state so CallbackPage can
    // redirect the user back to the original URL after authentication.
    await userManager.signinRedirect({ state: returnTo ?? '/' });
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
