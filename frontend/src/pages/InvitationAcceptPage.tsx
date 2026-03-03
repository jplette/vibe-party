import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { invitationsApi } from '../api/invitations';
import styles from './InvitationResponsePage.module.css';

type Status = 'loading' | 'success' | 'error' | 'missing-token';

export function InvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing-token');
  const [message, setMessage] = useState('');
  const [eventId, setEventId] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    invitationsApi
      .accept(token)
      .then((res) => {
        setEventId(res.eventId ?? null);
        setMessage('Invitation accepted! You can now view the event.');
        setStatus('success');
      })
      .catch(() => {
        setMessage('This invitation link is invalid or has already been used.');
        setStatus('error');
      });
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <i className="pi pi-star-fill" style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }} />
          <span className={styles.logoText}>Vibe Party</span>
        </div>

        {status === 'loading' && (
          <>
            <ProgressSpinner style={{ width: '48px', height: '48px' }} strokeWidth="4" />
            <p className={styles.bodyText}>Accepting your invitation…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.successIcon} aria-hidden="true">
              <i className="pi pi-check-circle" />
            </div>
            <h1 className={styles.heading}>You're in!</h1>
            <p className={styles.bodyText}>{message}</p>
            <Button
              label="View Event"
              icon="pi pi-arrow-right"
              onClick={() => {
                const target = eventId ? `/events/${eventId}` : '/';
                sessionStorage.setItem('vibe_post_login_redirect', target);
                navigate(target);
              }}
              style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            />
          </>
        )}

        {(status === 'error' || status === 'missing-token') && (
          <>
            <div className={styles.errorIcon} aria-hidden="true">
              <i className="pi pi-times-circle" />
            </div>
            <h1 className={styles.heading}>Link Invalid</h1>
            <p className={styles.bodyText}>
              {status === 'missing-token'
                ? 'No invitation token provided.'
                : message}
            </p>
            <Button
              label="Go to Home"
              icon="pi pi-home"
              outlined
              onClick={() => navigate('/')}
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            />
          </>
        )}
      </div>
    </div>
  );
}
