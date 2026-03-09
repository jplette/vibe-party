import { Box, Container, Flex, Text, Button, IconButton } from '@radix-ui/themes';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';
import { useAuthContext } from '../../auth/AuthProvider';
import { useThemeStore } from '../../stores/themeStore';

export function LandingNav() {
  const { login, register } = useAuthContext();
  const { mode, toggleMode } = useThemeStore();

  return (
    <Box
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#004e89',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Container size="4">
        <Flex align="center" justify="between" py="3" px="2">
          {/* Logo */}
          <Flex align="center" gap="2">
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7c59f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(255,107,53,0.4)',
              }}
            >
              {/* Party popper emoji as SVG-like text — emoji is content not decoration */}
              <span role="img" aria-hidden="true" style={{ lineHeight: 1 }}>
                🎉
              </span>
            </Box>
            <Text
              weight="bold"
              size="4"
              style={{
                color: '#fff',
                letterSpacing: '-0.02em',
                fontFamily: "'Lato', system-ui, sans-serif",
              }}
            >
              Vibe{' '}
              <span style={{ color: '#f7c59f' }}>Party</span>
            </Text>
          </Flex>

          {/* Actions */}
          <Flex align="center" gap="2">
            <IconButton
              variant="ghost"
              size="2"
              style={{ color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}
              onClick={toggleMode}
              aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {mode === 'dark' ? <SunIcon width="16" height="16" /> : <MoonIcon width="16" height="16" />}
            </IconButton>
            <Button
              variant="ghost"
              size="2"
              style={{ color: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}
              onClick={login}
            >
              Log In
            </Button>
            <Button
              size="2"
              style={{
                backgroundColor: '#ff6b35',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255,107,53,0.35)',
                fontWeight: 600,
              }}
              onClick={register}
            >
              Sign Up
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
