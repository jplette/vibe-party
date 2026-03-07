import { useNavigate } from 'react-router-dom';
import { Box, Flex, Grid, Card, Heading, Text, Button } from '@radix-ui/themes';
import { PlusIcon, CalendarIcon, CheckCircledIcon, PersonIcon } from '@radix-ui/react-icons';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import { EmptyState } from '../components/ui/EmptyState';
import { isFuture } from '../utils/formatDate';

export function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: events = [], isLoading } = useEvents();
  const navigate = useNavigate();

  const upcoming = events.filter((e) => isFuture(e.date, e.endDate));
  const recent = [...events]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <Box>
      {/* ── Greeting ── */}
      <Flex align="center" justify="between" mb="6" wrap="wrap" gap="3">
        <Box>
          <Heading size="7" style={{ fontFamily: 'var(--font-display)' }}>
            Hey, {firstName} 👋
          </Heading>
          <Text color="gray" size="3" as="p" mt="1">
            Here's what's going on.
          </Text>
        </Box>
        <Button
          size="3"
          style={{ backgroundColor: '#ff6b35', cursor: 'pointer' }}
          onClick={() => navigate('/events/new')}
        >
          <PlusIcon />
          New Event
        </Button>
      </Flex>

      {/* ── Stat cards ── */}
      <Grid columns={{ initial: '1', sm: '3' }} gap="4" mb="8">
        {/* Total events */}
        <Card>
          <Flex align="center" gap="3">
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-3)',
                backgroundColor: 'var(--orange-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CalendarIcon style={{ color: '#ff6b35', width: 20, height: 20 }} />
            </Box>
            <Box>
              <Text size="6" weight="bold" style={{ display: 'block', lineHeight: 1 }}>
                {events.length}
              </Text>
              <Text size="1" color="gray" style={{ display: 'block' }}>
                Total Events
              </Text>
            </Box>
          </Flex>
        </Card>

        {/* Upcoming */}
        <Card>
          <Flex align="center" gap="3">
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-3)',
                backgroundColor: 'var(--green-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircledIcon style={{ color: 'var(--green-9)', width: 20, height: 20 }} />
            </Box>
            <Box>
              <Text size="6" weight="bold" style={{ display: 'block', lineHeight: 1 }}>
                {upcoming.length}
              </Text>
              <Text size="1" color="gray" style={{ display: 'block' }}>
                Upcoming
              </Text>
            </Box>
          </Flex>
        </Card>

        {/* Past */}
        <Card>
          <Flex align="center" gap="3">
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-3)',
                backgroundColor: 'var(--blue-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PersonIcon style={{ color: 'var(--blue-9)', width: 20, height: 20 }} />
            </Box>
            <Box>
              <Text size="6" weight="bold" style={{ display: 'block', lineHeight: 1 }}>
                {events.length - upcoming.length}
              </Text>
              <Text size="1" color="gray" style={{ display: 'block' }}>
                Past Events
              </Text>
            </Box>
          </Flex>
        </Card>
      </Grid>

      {/* ── Recent events ── */}
      <Heading size="5" mb="4">
        Recent Events
      </Heading>

      {isLoading ? (
        <Text color="gray">Loading...</Text>
      ) : recent.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="No events yet"
          description="Create your first event to get started."
          action={
            <Button
              style={{ backgroundColor: '#ff6b35', cursor: 'pointer' }}
              onClick={() => navigate('/events/new')}
            >
              <PlusIcon /> Create Event
            </Button>
          }
        />
      ) : (
        <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
          {recent.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => navigate(`/events/${event.id}`)}
            />
          ))}
        </Grid>
      )}
    </Box>
  );
}
