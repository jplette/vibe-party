
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          <i className="pi pi-question-circle" />
        </div>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Page not found</h2>
        <p className={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Button
            label="Back to Dashboard"
            icon="pi pi-home"
            onClick={() => navigate('/dashboard')}
            style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
          />
          <Button
            label="View Events"
            icon="pi pi-calendar"
            outlined
            onClick={() => navigate('/events')}
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          />
        </div>
      </div>
    </div>
  );
}
