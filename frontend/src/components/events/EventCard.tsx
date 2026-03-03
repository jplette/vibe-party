
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import type { Event } from '../../types';
import { formatDate, isFuture } from '../../utils/formatDate';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const upcoming = isFuture(event.date);

  return (
    <Card className={styles.card} onClick={() => navigate(`/events/${event.id}`)}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.iconWrap} aria-hidden="true">
            <i className="pi pi-calendar-plus" />
          </div>
          {event.date && (
            <Tag
              value={upcoming ? 'Upcoming' : 'Past'}
              severity={upcoming ? 'success' : 'secondary'}
              className={styles.tag}
            />
          )}
        </div>

        <div className={styles.body}>
          <h2 className={styles.name}>{event.name}</h2>

          {event.description && (
            <p className={styles.description}>{event.description}</p>
          )}

          <div className={styles.meta}>
            {event.date && (
              <span className={styles.metaItem}>
                <i className="pi pi-clock" aria-label="Date" />
                {formatDate(event.date)}
              </span>
            )}
            {event.location && (
              <span className={styles.metaItem}>
                <i className="pi pi-map-marker" aria-label="Location" />
                {event.location}
              </span>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            label="View Event"
            icon="pi pi-arrow-right"
            iconPos="right"
            text
            className={styles.viewBtn}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/events/${event.id}`);
            }}
          />
        </div>
      </div>
    </Card>
  );
}
