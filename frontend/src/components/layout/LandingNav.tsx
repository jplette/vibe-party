import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useAuth } from '../../auth/useAuth';
import styles from './LandingNav.module.css';

export function LandingNav() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav} aria-label="Site navigation">
      <a href="/" className={styles.brand} aria-label="VibeParty home">
        <i className="pi pi-star-fill" aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
        <span>Vibe<strong>Party</strong></span>
      </a>

      <div className={styles.links}>
        <a href="#features" className={styles.anchorLink}>Features</a>
      </div>

      <div className={styles.actions}>
        {!isLoading && (
          isAuthenticated ? (
            <Button
              label="Open App"
              icon="pi pi-arrow-right"
              iconPos="right"
              onClick={() => navigate('/dashboard')}
              className={styles.btnPrimary}
              size="small"
            />
          ) : (
            <>
              <button className={styles.btnText} onClick={login}>Log in</button>
              <Button
                label="Sign up free"
                onClick={register}
                className={styles.btnPrimary}
                size="small"
              />
            </>
          )
        )}
      </div>
    </nav>
  );
}
