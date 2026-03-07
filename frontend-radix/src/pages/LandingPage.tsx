import { Box, Container, Flex, Grid, Text, Heading, Button, Card } from '@radix-ui/themes';
import {
  CheckCircledIcon,
  RocketIcon,
  EnvelopeClosedIcon,
  UpdateIcon,
  ArrowRightIcon,
} from '@radix-ui/react-icons';
import { LandingNav } from '../components/layout/LandingNav';
import { useAuthContext } from '../auth/AuthProvider';

// ─── CSS animations injected as a style tag ──────────────────────────────────
const ANIMATION_CSS = `
  @keyframes float-up-1 {
    0%   { transform: translateY(0)    rotate(-5deg);  opacity: 0.9; }
    80%  { opacity: 0.6; }
    100% { transform: translateY(-140px) rotate(12deg); opacity: 0; }
  }
  @keyframes float-up-2 {
    0%   { transform: translateY(0)    rotate(8deg);   opacity: 0.85; }
    80%  { opacity: 0.5; }
    100% { transform: translateY(-110px) rotate(-15deg); opacity: 0; }
  }
  @keyframes float-up-3 {
    0%   { transform: translateY(0)    rotate(-3deg);  opacity: 0.9; }
    80%  { opacity: 0.55; }
    100% { transform: translateY(-160px) rotate(20deg); opacity: 0; }
  }
  @keyframes float-up-4 {
    0%   { transform: translateY(0)    rotate(12deg);  opacity: 0.8; }
    80%  { opacity: 0.4; }
    100% { transform: translateY(-120px) rotate(-8deg); opacity: 0; }
  }
  @keyframes float-up-5 {
    0%   { transform: translateY(0)    rotate(-10deg); opacity: 0.9; }
    80%  { opacity: 0.6; }
    100% { transform: translateY(-150px) rotate(18deg); opacity: 0; }
  }

  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes badge-pop {
    0%   { opacity: 0; transform: scale(0.8) translateY(8px); }
    60%  { transform: scale(1.05) translateY(-2px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(255,107,53,0.35); }
    70%  { box-shadow: 0 0 0 14px rgba(255,107,53,0); }
    100% { box-shadow: 0 0 0 0 rgba(255,107,53,0); }
  }

  .landing-hero-badge {
    animation: badge-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
  }
  .landing-hero-heading {
    animation: fade-in-up 0.7s ease 0.25s both;
  }
  .landing-hero-sub {
    animation: fade-in-up 0.7s ease 0.45s both;
  }
  .landing-hero-ctas {
    animation: fade-in-up 0.7s ease 0.6s both;
  }
  .landing-hero-social {
    animation: fade-in-up 0.6s ease 0.75s both;
  }

  .landing-cta-btn {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .landing-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255,107,53,0.45) !important;
  }
  .landing-cta-btn:active {
    transform: translateY(0);
  }

  .landing-ghost-btn {
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .landing-ghost-btn:hover {
    background: rgba(0,78,137,0.08) !important;
  }

  .feature-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.18) !important;
  }

  .emoji-float-1 { animation: float-up-1 4.2s ease-in-out 0.0s infinite; }
  .emoji-float-2 { animation: float-up-2 3.8s ease-in-out 0.9s infinite; }
  .emoji-float-3 { animation: float-up-3 5.0s ease-in-out 0.4s infinite; }
  .emoji-float-4 { animation: float-up-4 4.5s ease-in-out 1.5s infinite; }
  .emoji-float-5 { animation: float-up-5 3.6s ease-in-out 2.1s infinite; }

  .landing-section-label {
    animation: fade-in-up 0.5s ease 0.1s both;
  }

  .cta-band-btn {
    animation: pulse-ring 2.4s ease 1.2s infinite;
    transition: transform 0.15s ease;
  }
  .cta-band-btn:hover {
    transform: translateY(-2px);
  }

  @media (prefers-reduced-motion: reduce) {
    .emoji-float-1, .emoji-float-2, .emoji-float-3, .emoji-float-4, .emoji-float-5,
    .landing-hero-badge, .landing-hero-heading, .landing-hero-sub, .landing-hero-ctas,
    .landing-hero-social, .cta-band-btn {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <CheckCircledIcon width="28" height="28" />,
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.12)',
    title: 'Smart Todos',
    description:
      'Assign tasks, set deadlines, and track completion. Everyone knows exactly what needs doing before the big day.',
    tag: 'Task Management',
  },
  {
    icon: <RocketIcon width="28" height="28" />,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    title: 'Bring Lists',
    description:
      'Coordinate who brings what with zero overlap. Food, drinks, decorations — covered and claimed in seconds.',
    tag: 'Coordination',
  },
  {
    icon: <EnvelopeClosedIcon width="28" height="28" />,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    title: 'Email Invites',
    description:
      'One-click invitations with beautiful links. Guests accept, decline, and join the event automatically.',
    tag: 'Invitations',
  },
  {
    icon: <UpdateIcon width="28" height="28" />,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    title: 'Real-time Sync',
    description:
      'Every update — a task checked, an item claimed — shows up instantly for everyone in the event.',
    tag: 'Live Updates',
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingPage() {
  const { login, register } = useAuthContext();

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{ANIMATION_CSS}</style>

      <Box style={{ minHeight: '100vh', overflowX: 'hidden' }}>
        {/* ── Sticky Nav ──────────────────────────────────────────────────── */}
        <LandingNav />

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <Box
          style={{
            backgroundColor: '#efefd0',
            position: 'relative',
            overflow: 'hidden',
            paddingTop: '5rem',
            paddingBottom: '0',
          }}
        >
          {/* Decorative radial blobs */}
          <Box
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '480px',
              height: '480px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,107,53,0.18) 0%, rgba(255,107,53,0) 70%)',
              pointerEvents: 'none',
            }}
          />
          <Box
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '-60px',
              width: '340px',
              height: '340px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(0,78,137,0.1) 0%, rgba(0,78,137,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Floating emoji */}
          <Box
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
          >
            {[
              { emoji: '🎉', top: '55%', left: '8%', size: '2.4rem', cls: 'emoji-float-1' },
              { emoji: '🎈', top: '30%', left: '82%', size: '2.0rem', cls: 'emoji-float-2' },
              { emoji: '🥳', top: '65%', left: '72%', size: '2.6rem', cls: 'emoji-float-3' },
              { emoji: '🍕', top: '40%', left: '14%', size: '1.8rem', cls: 'emoji-float-4' },
              { emoji: '🎶', top: '20%', left: '55%', size: '2.2rem', cls: 'emoji-float-5' },
            ].map(({ emoji, top, left, size, cls }) => (
              <span
                key={emoji}
                className={cls}
                style={{
                  position: 'absolute',
                  top,
                  left,
                  fontSize: size,
                  display: 'block',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                {emoji}
              </span>
            ))}
          </Box>

          <Container size="3" style={{ position: 'relative', zIndex: 1 }}>
            <Flex direction="column" align="center" style={{ textAlign: 'center', paddingBottom: '4rem' }}>
              {/* Badge */}
              <Box
                className="landing-hero-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  background: 'rgba(255,107,53,0.12)',
                  border: '1px solid rgba(255,107,53,0.3)',
                  marginBottom: '1.75rem',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#ff6b35',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <Text
                  size="1"
                  weight="medium"
                  style={{ color: '#c44b1c', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                >
                  Event Planning, Reimagined
                </Text>
              </Box>

              {/* Heading */}
              <Heading
                className="landing-hero-heading"
                as="h1"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: '#1a1a2e',
                  marginBottom: '1.5rem',
                  maxWidth: '720px',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Plan parties.{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #ff6b35 0%, #e55a24 60%, #c44b1c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Vibe
                </span>{' '}
                together.
              </Heading>

              {/* Sub */}
              <Text
                className="landing-hero-sub"
                as="p"
                size="4"
                style={{
                  color: '#4a4a5a',
                  maxWidth: '520px',
                  lineHeight: 1.65,
                  marginBottom: '2.5rem',
                  fontFamily: "'Lato', system-ui, sans-serif",
                }}
              >
                Coordinate events, todos, and bring-lists — all in one place. From the first invite
                to the last slice of pizza.
              </Text>

              {/* CTAs */}
              <Flex className="landing-hero-ctas" gap="3" wrap="wrap" justify="center">
                <Button
                  size="3"
                  className="landing-cta-btn"
                  style={{
                    backgroundColor: '#ff6b35',
                    color: '#fff',
                    fontWeight: 700,
                    padding: '0 2rem',
                    height: '52px',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(255,107,53,0.35)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={register}
                >
                  Get Started — it&apos;s free
                  <ArrowRightIcon width="16" height="16" />
                </Button>
                <Button
                  size="3"
                  variant="outline"
                  className="landing-ghost-btn"
                  style={{
                    color: '#1a1a2e',
                    borderColor: 'rgba(26,26,46,0.25)',
                    fontWeight: 600,
                    padding: '0 2rem',
                    height: '52px',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.5)',
                  }}
                  onClick={scrollToFeatures}
                >
                  See how it works
                </Button>
              </Flex>

              {/* Social proof */}
              <Flex
                className="landing-hero-social"
                align="center"
                gap="3"
                mt="6"
                style={{ opacity: 0.65 }}
              >
                <Flex>
                  {['#ff6b35', '#004e89', '#4ade80', '#a78bfa'].map((color, i) => (
                    <Box
                      key={color}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: '2px solid #efefd0',
                        marginLeft: i === 0 ? 0 : '-8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }}
                    />
                  ))}
                </Flex>
                <Text size="2" style={{ color: '#4a4a5a' }}>
                  Hundreds of events planned this month
                </Text>
              </Flex>
            </Flex>
          </Container>

          {/* Wave SVG divider */}
          <svg
            viewBox="0 0 1440 90"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '90px', backgroundColor: '#efefd0' }}
            aria-hidden="true"
          >
            <path
              d="M0,45 C360,90 1080,0 1440,45 L1440,90 L0,90 Z"
              fill="#ff6b35"
              opacity="0.15"
            />
            <path
              d="M0,65 C480,22 960,88 1440,32 L1440,90 L0,90 Z"
              fill="#ff6b35"
              opacity="0.28"
            />
            <path
              d="M0,90 L1440,90 L1440,75 C900,52 480,85 0,75 Z"
              fill="#1a1a2e"
            />
          </svg>
        </Box>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <Box
          id="features"
          style={{
            backgroundColor: '#1a1a2e',
            paddingTop: '5rem',
            paddingBottom: '5rem',
          }}
        >
          <Container size="4">
            {/* Section label */}
            <Flex direction="column" align="center" mb="6" style={{ textAlign: 'center' }}>
              <Text
                className="landing-section-label"
                size="1"
                weight="medium"
                style={{
                  color: '#ff6b35',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.75rem',
                }}
              >
                Everything you need
              </Text>
              <Heading
                as="h2"
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  fontWeight: 400,
                  color: '#f0ede6',
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-display)',
                }}
              >
                One app. Zero coordination chaos.
              </Heading>
              <Text
                size="3"
                mt="3"
                style={{
                  color: 'rgba(240,237,230,0.55)',
                  maxWidth: '440px',
                  lineHeight: 1.6,
                }}
              >
                Vibe Party brings your whole crew together so planning feels less like work and more
                like pre-gaming.
              </Text>
            </Flex>

            {/* Bento grid */}
            <Grid
              columns={{ initial: '1', sm: '2', md: '4' }}
              gap="4"
            >
              {FEATURES.map((f) => (
                <Card
                  key={f.title}
                  className="feature-card"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '1.75rem 1.5rem',
                    cursor: 'default',
                  }}
                >
                  {/* Icon */}
                  <Box
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '12px',
                      backgroundColor: f.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: f.color,
                      marginBottom: '1.25rem',
                    }}
                  >
                    {f.icon}
                  </Box>

                  {/* Tag */}
                  <Text
                    size="1"
                    weight="medium"
                    style={{
                      color: f.color,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '0.4rem',
                      opacity: 0.85,
                    }}
                  >
                    {f.tag}
                  </Text>

                  <Heading
                    as="h3"
                    size="4"
                    style={{
                      color: '#f0ede6',
                      fontWeight: 400,
                      marginBottom: '0.6rem',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {f.title}
                  </Heading>
                  <Text
                    size="2"
                    style={{
                      color: 'rgba(240,237,230,0.55)',
                      lineHeight: 1.65,
                    }}
                  >
                    {f.description}
                  </Text>
                </Card>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ── Wave up from dark to CTA band ───────────────────────────────── */}
        <Box style={{ backgroundColor: '#004e89', lineHeight: 0 }} aria-hidden="true">
          <svg
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '60px', backgroundColor: '#1a1a2e' }}
          >
            <path d="M0,0 C480,60 960,0 1440,40 L1440,60 L0,60 Z" fill="#004e89" />
          </svg>
        </Box>

        {/* ── CTA Band ────────────────────────────────────────────────────── */}
        <Box
          style={{
            backgroundColor: '#004e89',
            paddingTop: '4.5rem',
            paddingBottom: '4.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle orb decoration */}
          <Box
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-100px',
              right: '10%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,107,53,0.15) 0%, rgba(255,107,53,0) 65%)',
              pointerEvents: 'none',
            }}
          />
          <Box
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '-80px',
              left: '5%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(247,197,159,0.1) 0%, rgba(247,197,159,0) 65%)',
              pointerEvents: 'none',
            }}
          />

          <Container size="3" style={{ position: 'relative', zIndex: 1 }}>
            <Flex direction="column" align="center" style={{ textAlign: 'center' }} gap="5">
              <Box>
                <Heading
                  as="h2"
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    fontWeight: 400,
                    color: '#fff',
                    lineHeight: 1.15,
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Ready to{' '}
                  <span style={{ color: '#f7c59f' }}>vibe</span>?
                </Heading>
                <Text
                  size="4"
                  style={{
                    color: 'rgba(255,255,255,0.72)',
                    lineHeight: 1.6,
                    maxWidth: '480px',
                    display: 'block',
                  }}
                >
                  Join your friends on Vibe Party today. Free to start, no credit card required.
                </Text>
              </Box>

              <Flex gap="3" wrap="wrap" justify="center">
                <Button
                  size="3"
                  className="cta-band-btn"
                  style={{
                    backgroundColor: '#ff6b35',
                    color: '#fff',
                    fontWeight: 700,
                    padding: '0 2.25rem',
                    height: '52px',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={register}
                >
                  Get Started
                  <ArrowRightIcon width="16" height="16" />
                </Button>
                <Button
                  size="3"
                  variant="outline"
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    borderColor: 'rgba(255,255,255,0.25)',
                    fontWeight: 600,
                    padding: '0 2rem',
                    height: '52px',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.06)',
                    transition: 'background 0.15s ease',
                  }}
                  onClick={login}
                >
                  Log In
                </Button>
              </Flex>
            </Flex>
          </Container>
        </Box>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer
          style={{
            backgroundColor: '#12122a',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '2rem',
            paddingBottom: '2rem',
          }}
        >
          <Container size="4">
            <Flex align="center" justify="between" wrap="wrap" gap="3">
              <Flex align="center" gap="2">
                <Box
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7c59f 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  <span role="img" aria-hidden="true">🎉</span>
                </Box>
                <Text size="2" weight="medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Vibe Party
                </Text>
              </Flex>
              <Text size="1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                &copy; {new Date().getFullYear()} Vibe Party. Built for the party people.
              </Text>
            </Flex>
          </Container>
        </footer>
      </Box>
    </>
  );
}
