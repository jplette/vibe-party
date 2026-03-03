import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { PageHeader } from '../components/layout/PageHeader';
import { EventForm } from '../components/events/EventForm';
import { useCreateEvent } from '../hooks/useEvents';
import type { EventFormValues } from '../types';
import styles from './EventCreatePage.module.css';

export function EventCreatePage() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();
  const toast = useRef<Toast>(null);

  const handleSubmit = async (data: EventFormValues) => {
    try {
      const created = await createEvent.mutateAsync(data);
      toast.current?.show({
        severity: 'success',
        summary: 'Event created!',
        detail: `"${created.name}" is ready.`,
        life: 3000,
      });
      navigate(`/events/${created.id}`);
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create event. Please try again.',
        life: 4000,
      });
    }
  };

  return (
    <div className={styles.page}>
      <Toast ref={toast} />

      <PageHeader
        title="Create Event"
        subtitle="Fill in the details for your new event"
        backTo="/events"
        backLabel="Back to Events"
      />

      <Card className={styles.card}>
        <EventForm
          onSubmit={handleSubmit}
          submitLabel="Create Event"
          isLoading={createEvent.isPending}
          errorMessage={
            createEvent.isError
              ? 'Failed to create event. Please check your input and try again.'
              : undefined
          }
        />
      </Card>
    </div>
  );
}
