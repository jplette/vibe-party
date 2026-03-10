import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Spinner, Callout, Text } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useAuthContext } from '../../auth/AuthProvider';

export function CallbackPage() {
  const { userManager } = useAuthContext();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then((user) => {
        // Restore the original deep-link URL that was passed as OIDC state before
        // the redirect to Keycloak. Fall back to /dashboard if nothing was stored.
        const returnTo =
          typeof user.state === 'string' && user.state.startsWith('/')
            ? user.state
            : '/dashboard';
        navigate(returnTo, { replace: true });
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Authentication failed')
      );
  }, [userManager, navigate]);

  if (error) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: '1rem' }}>
        <Callout.Root color="red" style={{ maxWidth: 480 }}>
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>
            <Text weight="bold" as="span" style={{ display: 'block', marginBottom: '4px' }}>
              Authentication error
            </Text>
            {error}
          </Callout.Text>
        </Callout.Root>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="4"
      style={{ minHeight: '100vh' }}
    >
      <Spinner size="3" />
      <Text size="2" color="gray">
        Signing you in…
      </Text>
    </Flex>
  );
}
