
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { PageHeader } from '../components/layout/PageHeader';
import { EventCard } from '../components/events/EventCard';
import { useEvents } from '../hooks/useEvents';
import styles from './EventListPage.module.css';

export function EventListPage() {
  const navigate = useNavigate();
  const { data: events, isLoading, isError, refetch } = useEvents();

  return (
    <div>
      <PageHeader
        title="My Events"
        subtitle="All events you're part of"
        actions={
          <Button
            label="Create Event"
            icon="pi pi-plus"
            onClick={() => navigate('/events/new')}
            style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
          />
        }
      />

      {isLoading && (
        <div className={styles.center}>
          <ProgressSpinner style={{ width: '48px', height: '48px' }} strokeWidth="4" />
        </div>
      )}

      {isError && (
        <div className={styles.center}>
          <div className={styles.errorBlock}>
            <Message
              severity="error"
              text="Couldn't load your events."
            />
            <Button
              label="Retry"
              icon="pi pi-refresh"
              outlined
              onClick={() => refetch()}
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            />
          </div>
        </div>
      )}

      {!isLoading && !isError && (events ?? []).length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <i className="pi pi-calendar-plus" />
          </div>
          <h2>No events yet</h2>
          <p>Create your first event and invite friends to join!</p>
          <Button
            label="Create Your First Event"
            icon="pi pi-plus"
            onClick={() => navigate('/events/new')}
            style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
          />
        </div>
      )}

      {!isLoading && !isError && (events ?? []).length > 0 && (
        <div className={styles.grid}>
          {(events ?? []).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
