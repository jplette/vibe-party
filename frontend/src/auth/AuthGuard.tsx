import { useEffect } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from './useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps protected routes.
 * - While loading: show spinner
 * - If unauthenticated: redirect to Keycloak login
 * - If authenticated: render children
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login();
    }
  }, [isLoading, isAuthenticated, login]);

  if (isLoading) {
    return (
      <div className="page-loading">
        <ProgressSpinner
          style={{ width: '60px', height: '60px' }}
          strokeWidth="4"
          animationDuration=".8s"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecting to login — show spinner while redirect happens
    return (
      <div className="page-loading">
        <ProgressSpinner
          style={{ width: '60px', height: '60px' }}
          strokeWidth="4"
          animationDuration=".8s"
        />
      </div>
    );
  }

  return <>{children}</>;
}
