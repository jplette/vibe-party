import { useParams, useNavigate } from 'react-router-dom';
import { Box } from '@radix-ui/themes';
import { useEvent, useUpdateEvent } from '../hooks/useEvents';
import { EventForm } from '../components/events/EventForm';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { toast } from '../components/ui/ToastProvider';
import type { EventFormValues } from '../types';

export function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, isError } = useEvent(id!);
  const { mutateAsync, isPending } = useUpdateEvent(id!);

  const handleSubmit = async (data: EventFormValues) => {
    try {
      await mutateAsync(data);
      toast.success('Event updated!');
      navigate(`/events/${id}`);
    } catch {
      toast.error('Failed to update event', 'Please try again.');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <ErrorMessage message="Event not found." />;

  return (
    <Box style={{ maxWidth: 640 }}>
      <PageHeader title="Edit Event" backTo={`/events/${id}`} backLabel="Back to Event" />
      <EventForm
        defaultValues={{
          name: event.name,
          description: event.description,
          date: event.date,
          endDate: event.endDate,
          locationName: event.locationName,
          locationStreet: event.locationStreet,
          locationCity: event.locationCity,
          locationZip: event.locationZip,
          locationCountry: event.locationCountry,
        }}
        onSubmit={handleSubmit}
        isLoading={isPending}
        submitLabel="Save Changes"
      />
    </Box>
  );
}
