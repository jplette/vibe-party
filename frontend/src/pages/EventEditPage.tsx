import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { PageHeader } from '../components/layout/PageHeader';
import { EventForm } from '../components/events/EventForm';
import { useEvent, useUpdateEvent } from '../hooks/useEvents';
import type { EventFormValues } from '../types';
import styles from './EventEditPage.module.css';

export function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const { data: event, isLoading, isError } = useEvent(id!);
  const updateEvent = useUpdateEvent(id!);

  const handleSubmit = async (data: EventFormValues) => {
    try {
      await updateEvent.mutateAsync(data);
      toast.current?.show({
        severity: 'success',
        summary: 'Saved!',
        detail: 'Event updated successfully.',
        life: 3000,
      });
      navigate(`/events/${id}`);
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update event. Please try again.',
        life: 4000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.center}>
        <ProgressSpinner style={{ width: '48px', height: '48px' }} strokeWidth="4" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div>
        <PageHeader
          title="Edit Event"
          backTo={`/events/${id}`}
          backLabel="Back to Event"
        />
        <Message severity="error" text="Event not found or failed to load." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Toast ref={toast} />

      <PageHeader
        title="Edit Event"
        subtitle={event.name}
        backTo={`/events/${id}`}
        backLabel="Back to Event"
      />

      <Card className={styles.card}>
        <EventForm
          defaultValues={event}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          isLoading={updateEvent.isPending}
          errorMessage={
            updateEvent.isError
              ? 'Failed to save changes. Please try again.'
              : undefined
          }
        />
      </Card>
    </div>
  );
}
