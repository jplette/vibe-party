import { useEffect } from 'react';
import { Flex, Spinner } from '@radix-ui/themes';
import { useAuth } from './useAuth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login().catch(console.error);
    }
  }, [isLoading, isAuthenticated, login]);

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
