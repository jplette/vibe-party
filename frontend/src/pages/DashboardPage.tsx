
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
  const firstName = name?.split(' ')[0];

  return (
    <div className={styles.page}>
      {/* Welcome banner */}
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <h1 className={styles.greeting}>
            {firstName ? (
              <>Welcome back, <span className={styles.greetingName}>{firstName}</span>!</>
            ) : (
              'Welcome back!'
            )}
          </h1>
          <p className={styles.tagline}>Ready to plan your next event?</p>
          <div className={styles.bannerActions}>
            <Button
              label="Create Event"
              icon="pi pi-plus"
              onClick={() => navigate('/events/new')}
            />
            <Button
              label="View all events"
              icon="pi pi-calendar"
              text
              onClick={() => navigate('/events')}
              style={{ color: 'var(--color-text-muted)' }}
            />
          </div>
        </div>
        <div className={styles.bannerIllo} aria-hidden="true">
          <i className="pi pi-star-fill" />
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
              style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600 }}
            />
          )}
        </div>

        {isLoading && (
          <div className={styles.center}>
            <ProgressSpinner style={{ width: '44px', height: '44px' }} strokeWidth="3" />
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
            <div className={styles.emptyIcon} aria-hidden="true">
              <i className="pi pi-calendar-plus" />
            </div>
            <h3>No events yet</h3>
            <p>Create your first event to get the party started.</p>
            <Button
              label="Create Event"
              icon="pi pi-plus"
              onClick={() => navigate('/events/new')}
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
