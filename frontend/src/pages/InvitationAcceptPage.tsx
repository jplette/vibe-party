import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Flex, Callout, Spinner, Button, Heading, Text, Box } from '@radix-ui/themes';
import { CheckCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { invitationsApi } from '../api/invitations';

type PageState = 'loading' | 'success' | 'error';

export function InvitationAcceptPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [state, setState] = useState<PageState>('loading');
  const [eventId, setEventId] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrMsg('Invalid invitation link — no token was found.');
      return;
    }

    invitationsApi
      .accept(token)
      .then((res) => {
        setEventId(res.eventId);
        setState('success');
      })
      .catch(() => {
        setState('error');
        setErrMsg('This invitation has expired or has already been used.');
      });
  }, [token]);

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <Box style={{ maxWidth: 440, width: '100%' }}>
        {state === 'loading' && (
          <Flex direction="column" align="center" gap="4">
            <Spinner size="3" />
            <Text size="2" color="gray">
              Processing your invitation…
            </Text>
          </Flex>
        )}

        {state === 'success' && (
          <Flex direction="column" gap="4">
            <Heading
              size="6"
              style={{
                fontFamily: "'Lato', system-ui, sans-serif",
                fontWeight: 800,
                color: '#1a1a2e',
              }}
            >
              You&apos;re in! 🎉
            </Heading>
            <Callout.Root color="green">
              <Callout.Icon>
                <CheckCircledIcon />
              </Callout.Icon>
              <Callout.Text>You&apos;ve successfully joined the event.</Callout.Text>
            </Callout.Root>
            {eventId ? (
              <Button
                asChild
                size="3"
                style={{
                  backgroundColor: '#ff6b35',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Link to={`/events/${eventId}`}>Go to Event</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="3"
                style={{
                  backgroundColor: '#ff6b35',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </Flex>
        )}

        {state === 'error' && (
          <Flex direction="column" gap="4">
            <Callout.Root color="red">
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>{errMsg}</Callout.Text>
            </Callout.Root>
            <Button
              asChild
              variant="outline"
              size="2"
              style={{ cursor: 'pointer', alignSelf: 'flex-start' }}
            >
              <Link to="/">Go Home</Link>
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
