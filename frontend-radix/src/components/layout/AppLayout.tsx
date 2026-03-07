import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Avatar,
  DropdownMenu,
  IconButton,
  Separator,
} from '@radix-ui/themes';
import {
  DashboardIcon,
  CalendarIcon,
  SunIcon,
  MoonIcon,
  HamburgerMenuIcon,
  Cross1Icon,
  ExitIcon,
} from '@radix-ui/react-icons';
import { useAuth } from '../../auth/useAuth';
import { useThemeStore } from '../../stores/themeStore';

// ─── Nav links config ─────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/events', label: 'Events', Icon: CalendarIcon },
] as const;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  name: string | null;
  email: string | null;
  initials: string;
  onLogout: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

function Sidebar({ name, email, initials, onLogout, onClose, showCloseButton }: SidebarProps) {
  return (
    <Box
      style={{
        width: 220,
        minHeight: '100vh',
        backgroundColor: '#004e89',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo row */}
      <Flex align="center" justify="between" p="4" pb="3">
        <Flex align="center" gap="2">
          <Box
            style={{
              width: 32,
              height: 32,
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
            Vibe <span style={{ color: '#f7c59f' }}>Party</span>
          </Text>
        </Flex>

        {/* Mobile close button */}
        {showCloseButton && (
          <IconButton
            variant="ghost"
            size="2"
            onClick={onClose}
            aria-label="Close sidebar"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <Cross1Icon />
          </IconButton>
        )}
      </Flex>

      <Separator style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

      {/* Nav links */}
      <Flex direction="column" gap="1" p="3" style={{ flex: 1 }}>
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <Flex
                align="center"
                gap="2"
                px="3"
                py="2"
                style={{
                  borderRadius: 'var(--radius-3)',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <Icon style={{ color: 'rgba(255,255,255,0.8)', width: 16, height: 16 }} />
                <Text
                  size="2"
                  style={{
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.8)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </Text>
              </Flex>
            )}
          </NavLink>
        ))}
      </Flex>

      {/* User section */}
      <Box p="3">
        <Separator mb="3" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Flex
              align="center"
              gap="2"
              style={{ cursor: 'pointer' }}
              aria-label="User menu"
            >
              <Avatar
                size="2"
                fallback={initials}
                style={{ backgroundColor: '#ff6b35', color: '#fff', flexShrink: 0 }}
              />
              <Box style={{ minWidth: 0 }}>
                <Text
                  size="1"
                  weight="bold"
                  style={{
                    color: '#fff',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name ?? 'User'}
                </Text>
                {email && (
                  <Text
                    size="1"
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {email}
                  </Text>
                )}
              </Box>
            </Flex>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item color="red" onClick={onLogout}>
              <ExitIcon /> Log Out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Box>
    </Box>
  );
}

// ─── Injected responsive styles ───────────────────────────────────────────────
// Using a style tag avoids CSS Modules while keeping media queries clean.
// The desktop-sidebar is hidden by default (mobile-first), shown at >= 768px.
// The hamburger button is shown by default, hidden at >= 768px.

const LAYOUT_CSS = `
  .vp-desktop-sidebar {
    display: none;
  }
  .vp-hamburger {
    display: flex;
  }
  @media (min-width: 768px) {
    .vp-desktop-sidebar {
      display: flex !important;
    }
    .vp-hamburger {
      display: none !important;
    }
  }
`;

// ─── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { name, email, logout } = useAuth();
  const { mode, toggleMode } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebarProps: SidebarProps = {
    name,
    email,
    initials,
    onLogout: handleLogout,
  };

  return (
    <>
      <style>{LAYOUT_CSS}</style>

      <Flex style={{ minHeight: '100vh' }}>
        {/* Desktop sidebar — always mounted, shown/hidden via CSS */}
        <Box className="vp-desktop-sidebar">
          <Sidebar {...sidebarProps} />
        </Box>

        {/* Mobile overlay sidebar */}
        {sidebarOpen && (
          <Box
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              display: 'flex',
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}
            onClick={() => setSidebarOpen(false)}
          >
            {/* Stop click propagation so clicking inside doesn't close */}
            <Box onClick={(e) => e.stopPropagation()}>
              <Sidebar
                {...sidebarProps}
                showCloseButton
                onClose={() => setSidebarOpen(false)}
              />
            </Box>
          </Box>
        )}

        {/* Main column */}
        <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
          {/* Top header */}
          <Flex
            align="center"
            justify="between"
            px="4"
            py="3"
            style={{
              borderBottom: '1px solid var(--gray-4)',
              backgroundColor: 'var(--color-background)',
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
          >
            {/* Left: hamburger (mobile only) */}
            <Flex align="center" gap="3">
              <IconButton
                className="vp-hamburger"
                variant="ghost"
                onClick={() => setSidebarOpen((s) => !s)}
                aria-label="Open sidebar"
              >
                <HamburgerMenuIcon />
              </IconButton>
            </Flex>

            {/* Right: theme toggle */}
            <Flex align="center" gap="2">
              <IconButton
                variant="ghost"
                onClick={toggleMode}
                aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
              </IconButton>
            </Flex>
          </Flex>

          {/* Page content */}
          <Box p="5" style={{ flex: 1 }}>
            {children}
          </Box>
        </Flex>
      </Flex>
    </>
  );
}
