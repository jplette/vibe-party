import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Flex, Spinner } from '@radix-ui/themes';
import { useAuth } from './useAuth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Capture the full path + search string so it survives the OIDC round-trip.
      const returnTo = location.pathname + location.search;
      login(returnTo).catch(console.error);
    }
  }, [isLoading, isAuthenticated, login, location.pathname, location.search]);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spinner size="3" />
      </Flex>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
