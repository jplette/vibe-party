import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Grid, TextField, Button } from '@radix-ui/themes';
import { MagnifyingGlassIcon, PlusIcon } from '@radix-ui/react-icons';
import { useEvents } from '../hooks/useEvents';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { EventCard } from '../components/events/EventCard';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function EventListPage() {
  const navigate = useNavigate();
  const { data: events = [], isLoading, isError } = useEvents();
  const { data: currentUser } = useCurrentUser();
  const [search, setSearch] = useState('');

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message="Failed to load events." />;

  const filtered = events.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      <PageHeader
        title="Events"
        subtitle={`${events.length} event${events.length !== 1 ? 's' : ''}`}
        actions={
          <Button
            style={{ backgroundColor: '#ff6b35', cursor: 'pointer' }}
            onClick={() => navigate('/events/new')}
          >
            <PlusIcon /> New Event
          </Button>
        }
      />

      {events.length > 0 && (
        <Flex mb="5">
          <TextField.Root
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360, width: '100%' }}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
        </Flex>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="🎉"
          title={search ? 'No events match your search' : 'No events yet'}
          description={
            search ? 'Try a different search term.' : 'Create your first event to get started.'
          }
          action={
            !search ? (
              <Button
                style={{ backgroundColor: '#ff6b35', cursor: 'pointer' }}
                onClick={() => navigate('/events/new')}
              >
                <PlusIcon /> Create Event
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => navigate(`/events/${event.id}`)}
              currentUserId={currentUser?.id}
            />
          ))}
        </Grid>
      )}
    </Box>
  );
}
