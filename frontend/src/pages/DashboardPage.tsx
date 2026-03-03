
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { useAuth } from '../auth/useAuth';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import { isFuture } from '../utils/formatDate';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { name } = useAuth();
  const navigate = useNavigate();
  const { data: events, isLoading, isError } = useEvents();

  const upcoming = (events ?? []).filter((e) => isFuture(e.date));
  const recent = (events ?? []).slice(0, 4);

  return (
    <div className={styles.page}>
      {/* Welcome banner */}
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <h1 className={styles.greeting}>
            Welcome back{name ? `, ${name.split(' ')[0]}` : ''}!
          </h1>
          <p className={styles.tagline}>Ready to plan your next event?</p>
          <Button
            label="Create Event"
            icon="pi pi-plus"
            onClick={() => navigate('/events/new')}
            style={{
              backgroundColor: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
              marginTop: '1rem',
            }}
          />
        </div>
        <div className={styles.bannerIllo} aria-hidden="true">
          <i className="pi pi-calendar" />
        </div>
      </div>

      {/* Stats */}
      {!isLoading && !isError && events && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{events.length}</span>
            <span className={styles.statLabel}>Total Events</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{upcoming.length}</span>
            <span className={styles.statLabel}>Upcoming</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{events.length - upcoming.length}</span>
            <span className={styles.statLabel}>Past Events</span>
          </div>
        </div>
      )}

      {/* Recent events */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Events</h2>
          {(events ?? []).length > 0 && (
            <Button
              label="See all"
              link
              onClick={() => navigate('/events')}
              style={{ color: 'var(--color-primary)' }}
            />
          )}
        </div>

        {isLoading && (
          <div className={styles.center}>
            <ProgressSpinner style={{ width: '48px', height: '48px' }} strokeWidth="4" />
          </div>
        )}

        {isError && (
          <Message
            severity="error"
            text="Couldn't load events. Check your connection and try again."
          />
        )}

        {!isLoading && !isError && recent.length === 0 && (
          <div className={styles.emptyState}>
            <i className="pi pi-calendar-plus" aria-hidden="true" />
            <h3>No events yet</h3>
            <p>Create your first event to get the party started.</p>
            <Button
              label="Create Event"
              icon="pi pi-plus"
              onClick={() => navigate('/events/new')}
              style={{
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
              }}
            />
          </div>
        )}

        {!isLoading && !isError && recent.length > 0 && (
          <div className={styles.grid}>
            {recent.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
