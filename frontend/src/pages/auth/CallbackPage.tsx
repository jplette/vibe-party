import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { useAuthContext } from '../../auth/AuthProvider';
import { useAuthStore } from '../../stores/authStore';
import styles from './AuthPages.module.css';

/**
 * OIDC redirect callback page.
 * Processes the authorization code returned from Keycloak after login.
 * Redirects to the dashboard on success.
 */
export function CallbackPage() {
  const { userManager } = useAuthContext();
  const setOidcUser = useAuthStore((s) => s.setOidcUser);
  const navigate = useNavigate();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    userManager
      .signinRedirectCallback()
      .then((user) => {
        setOidcUser(user);
        navigate('/', { replace: true });
      })
      .catch((err: unknown) => {
        console.error('OIDC callback error:', err);
        setError('Authentication failed. Please try again.');
      });
  }, [userManager, setOidcUser, navigate]);

  if (error) {
    return (
      <div className={styles.page}>
        <Message severity="error" text={error} />
        <a href="/" className={styles.homeLink}>Go to home</a>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ProgressSpinner style={{ width: '56px', height: '56px' }} strokeWidth="4" />
      <p className={styles.text}>Signing you in…</p>
    </div>
  );
}
