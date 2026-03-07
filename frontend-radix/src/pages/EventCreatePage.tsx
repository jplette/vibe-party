import { useNavigate } from 'react-router-dom';
import { Box } from '@radix-ui/themes';
import { useCreateEvent } from '../hooks/useEvents';
import { EventForm } from '../components/events/EventForm';
import { PageHeader } from '../components/layout/PageHeader';
import { toast } from '../components/ui/ToastProvider';
import type { EventFormValues } from '../types';

export function EventCreatePage() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateEvent();

  const handleSubmit = async (data: EventFormValues) => {
    try {
      const event = await mutateAsync(data);
      toast.success('Event created!', event.name);
      navigate(`/events/${event.id}`);
    } catch {
      toast.error('Failed to create event', 'Please try again.');
    }
  };

  return (
    <Box style={{ maxWidth: 640 }}>
      <PageHeader title="Create Event" backTo="/events" backLabel="Back to Events" />
      <EventForm onSubmit={handleSubmit} isLoading={isPending} submitLabel="Create Event" />
    </Box>
  );
}
