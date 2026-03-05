import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useAuth } from '../auth/useAuth';
import { LandingNav } from '../components/layout/LandingNav';
import styles from './LandingPage.module.css';

const FEATURES = [
  {
    icon: '📅',
    title: 'Smart scheduling',
    body: 'Pick a date that works for everyone with built-in availability polls — no back-and-forth needed.',
  },
  {
    icon: '📋',
    title: 'Shared to-do lists',
    body: 'Assign tasks, track progress, and make sure nothing falls through the cracks before the big day.',
  },
  {
    icon: '🛒',
    title: 'Bring-item tracker',
    body: "Who's bringing the cooler? Who's on drinks? Claim items and keep the party supply list drama-free.",
  },
  {
    icon: '💌',
    title: 'One-click invites',
    body: 'Share a link or send email invites instantly. Guests RSVP in seconds — no account required.',
  },
];

const EMOJI_BUBBLES = [
  { emoji: '🎉', top: '12%', left: '8%', delay: '0s' },
  { emoji: '🥳', top: '55%', left: '3%', delay: '0.4s' },
  { emoji: '🎊', top: '20%', right: '6%', delay: '0.8s' },
  { emoji: '🎈', top: '65%', right: '10%', delay: '1.2s' },
  { emoji: '🎶', top: '40%', left: '15%', delay: '0.6s' },
  { emoji: '🍕', top: '78%', left: '28%', delay: '1s' },
];

export function LandingPage() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className={styles.page}>
      <LandingNav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Plan parties. Not spreadsheets.</p>
          <h1 id="hero-heading" className={styles.heroHeading}>
            Every great party{' '}
            <span className={styles.heroAccent}>starts here.</span>
          </h1>
          <p className={styles.heroSub}>
            Invites, to-dos, what-to-bring lists — all in one place.{' '}
            No more WhatsApp chaos.
          </p>
          <div className={styles.heroCtas}>
            <Button
              label="Start for free"
              icon="pi pi-arrow-right"
              iconPos="right"
              onClick={register}
              className={styles.ctaPrimary}
              size="large"
            />
            <button className={styles.ctaSecondary} onClick={login}>
              I already have an account
            </button>
          </div>
        </div>

        <div className={styles.heroIllo} aria-hidden="true">
          {EMOJI_BUBBLES.map(({ emoji, delay, ...pos }) => (
            <span
              key={emoji}
              className={styles.emojiBubble}
              style={{ animationDelay: delay, ...pos } as React.CSSProperties}
            >
              {emoji}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className={styles.features} aria-labelledby="features-heading">
        <div className={styles.featuresHeader}>
          <h2 id="features-heading" className={styles.featuresHeading}>
            Everything you need to throw a banger
          </h2>
          <p className={styles.featuresSub}>No PhD required. Just vibes.</p>
        </div>

        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureBody}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ──────────────────────────────────────────────────── */}
      <section className={styles.ctaSection} aria-labelledby="cta-heading">
        <div className={styles.ctaCard}>
          <div className={styles.ctaEmojis} aria-hidden="true">🎊 🎉 🥳</div>
          <h2 id="cta-heading" className={styles.ctaHeading}>
            Your next party is one click away
          </h2>
          <p className={styles.ctaBody}>
            Join thousands of hosts who ditched the group chat chaos.
            VibeParty keeps everyone on the same page — before, during, and after.
          </p>
          <div className={styles.ctaActions}>
            <Button
              label="Sign up — it's free"
              icon="pi pi-arrow-right"
              iconPos="right"
              onClick={register}
              className={styles.ctaCardBtn}
              size="large"
            />
            <button className={styles.ctaCardBtnText} onClick={login}>
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>
          <i className="pi pi-star-fill" aria-hidden="true" />
          VibeParty
        </span>
        <p className={styles.footerCopy}>
          &copy; {new Date().getFullYear()} VibeParty. Made with love for party people everywhere.
        </p>
      </footer>
    </div>
  );
}
