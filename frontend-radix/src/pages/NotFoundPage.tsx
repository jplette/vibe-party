import { Flex, Heading, Text, Button } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { HomeIcon } from '@radix-ui/react-icons';

export function NotFoundPage() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="4"
      style={{ minHeight: '100vh', padding: '2rem', textAlign: 'center' }}
    >
      {/* Large 404 */}
      <Text
        as="p"
        weight="bold"
        style={{
          fontSize: 'clamp(5rem, 20vw, 9rem)',
          lineHeight: 1,
          color: '#ff6b35',
          fontFamily: "'Lato', system-ui, sans-serif",
          letterSpacing: '-0.04em',
          userSelect: 'none',
        }}
      >
        404
      </Text>

      <Flex direction="column" align="center" gap="2">
        <Heading
          as="h1"
          size="6"
          style={{
            fontFamily: "'Lato', system-ui, sans-serif",
            fontWeight: 800,
            color: '#1a1a2e',
            letterSpacing: '-0.02em',
          }}
        >
          Page not found
        </Heading>
        <Text size="3" color="gray" style={{ maxWidth: '380px', lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Check the URL or
          head back home.
        </Text>
      </Flex>

      <Button
        asChild
        size="3"
        style={{
          backgroundColor: '#ff6b35',
          color: '#fff',
          fontWeight: 700,
          padding: '0 1.75rem',
          height: '48px',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '0.5rem',
        }}
      >
        <Link to="/">
          <HomeIcon width="16" height="16" />
          Go Home
        </Link>
      </Button>
    </Flex>
  );
}
