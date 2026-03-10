import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Switch,
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
  PersonIcon,
} from '@radix-ui/react-icons';
import * as PopoverPrimitive from '@radix-ui/react-popover';
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
  mode: 'light' | 'dark';
  onLogout: () => void;
  onToggleMode: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

function Sidebar({
  name,
  email,
  initials,
  mode,
  onLogout,
  onToggleMode,
  onClose,
  showCloseButton,
}: SidebarProps) {
  const isDark = mode === 'dark';

  // Color tokens derived from mode
  const bg = isDark ? '#1a1a1a' : '#ffffff';
  const separatorColor = isDark ? 'rgba(255,255,255,0.1)' : 'var(--gray-4)';
  const logoTextColor = isDark ? '#ffffff' : '#212529';
  const closeButtonColor = isDark ? 'rgba(255,255,255,0.6)' : 'var(--gray-10)';

  // Nav item colors
  const navIconColor = isDark ? 'rgba(255,255,255,0.7)' : '#6c757d';
  const navTextColor = isDark ? 'rgba(255,255,255,0.75)' : '#495057';
  const navActiveBg = isDark ? 'rgba(255,107,53,0.18)' : '#fff3ed';
  const navActiveIconColor = '#ff6b35';
  const navActiveTextColor = '#ff6b35';
  const navHoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'var(--gray-2)';

  // User section / popover colors
  const userNameColor = isDark ? '#ffffff' : '#212529';
  const userEmailColor = isDark ? 'rgba(255,255,255,0.5)' : '#6c757d';
  const popoverBg = isDark ? '#242424' : '#ffffff';
  const popoverBorder = isDark ? 'rgba(255,255,255,0.1)' : 'var(--gray-4)';
  const popoverRowHoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'var(--gray-2)';
  const popoverLabelColor = isDark ? 'rgba(255,255,255,0.55)' : '#6c757d';
  const popoverValueColor = isDark ? 'rgba(255,255,255,0.9)' : '#212529';
  const popoverLogoutHoverBg = isDark ? 'rgba(229,92,20,0.15)' : '#fff1ec';

  return (
    <Box
      style={{
        width: 220,
        minHeight: '100vh',
        backgroundColor: bg,
        borderRight: `1px solid ${separatorColor}`,
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
              color: logoTextColor,
              letterSpacing: '-0.02em',
              fontFamily: "'Lato', system-ui, sans-serif",
            }}
          >
            Vibe <span style={{ color: '#ff6b35' }}>Party</span>
          </Text>
        </Flex>

        {/* Mobile close button */}
        {showCloseButton && (
          <IconButton
            variant="ghost"
            size="2"
            onClick={onClose}
            aria-label="Close sidebar"
            style={{ color: closeButtonColor }}
          >
            <Cross1Icon />
          </IconButton>
        )}
      </Flex>

      <Separator style={{ backgroundColor: separatorColor }} />

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
                  backgroundColor: isActive ? navActiveBg : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.backgroundColor = navHoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <Icon
                  style={{
                    color: isActive ? navActiveIconColor : navIconColor,
                    width: 16,
                    height: 16,
                  }}
                />
                <Text
                  size="2"
                  style={{
                    color: isActive ? navActiveTextColor : navTextColor,
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

      {/* User section — Popover trigger */}
      <Box p="3">
        <Separator mb="3" style={{ backgroundColor: separatorColor }} />

        <PopoverPrimitive.Root>
          <PopoverPrimitive.Trigger asChild>
            {/*
             * The trigger must be a single focusable element.
             * We wrap the avatar row in a plain <button> so Radix can
             * attach its click / keyboard handlers without nesting issues.
             */}
            <button
              style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                cursor: 'pointer',
                borderRadius: 'var(--radius-3)',
                padding: '6px 8px',
                boxSizing: 'border-box',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = navHoverBg;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
              aria-label="Open user menu"
            >
              <Avatar
                size="2"
                radius="full"
                fallback={initials}
                style={{
                  backgroundColor: isDark ? '#ffffff' : '#ff6b35',
                  color: isDark ? '#212529' : '#ffffff',
                  flexShrink: 0,
                }}
              />
              <Box style={{ minWidth: 0, flex: 1 }}>
                <Text
                  size="1"
                  weight="bold"
                  style={{
                    color: userNameColor,
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
                      color: userEmailColor,
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
              {/* Chevron hint — subtle upward arrow */}
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
                style={{ flexShrink: 0, color: isDark ? 'rgba(255,255,255,0.35)' : 'var(--gray-8)' }}
              >
                <path
                  d="M2 7L5 3.5L8 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </PopoverPrimitive.Trigger>

          {/*
           * side="top" → opens above the trigger so it never clips behind the
           * viewport bottom. align="start" → left-aligned with the trigger.
           * sideOffset=8 → breathing room between trigger and card.
           *
           * overflow: 'visible' on Content so the Arrow SVG is not clipped.
           * The inner wrapper carries overflow: 'hidden' + border-radius so
           * content corners are clipped without affecting the arrow.
           */}
          <PopoverPrimitive.Content
            side="top"
            align="start"
            sideOffset={8}
            style={{
              width: 240,
              padding: 0,
              overflow: 'visible',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              zIndex: 9999,
            }}
          >
            <PopoverPrimitive.Arrow
              style={{ fill: popoverBg, display: 'block' }}
              width={12}
              height={6}
            />

            {/* Inner card — carries all visual styling; overflow hidden prevents scrollbars */}
            <Box
              style={{
                backgroundColor: popoverBg,
                border: `1px solid ${popoverBorder}`,
                borderRadius: 'var(--radius-4)',
                boxShadow: isDark
                  ? '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)'
                  : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              {/* ── Theme toggle row ───────────────────────────────────────── */}
              <Box style={{ padding: '4px 0' }}>
                <Flex
                  align="center"
                  justify="between"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 0,
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = popoverRowHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <Flex align="center" gap="2">
                    {isDark ? (
                      <MoonIcon
                        style={{ color: popoverLabelColor, width: 14, height: 14 }}
                      />
                    ) : (
                      <SunIcon
                        style={{ color: popoverLabelColor, width: 14, height: 14 }}
                      />
                    )}
                    <Text size="2" style={{ color: popoverValueColor }}>
                      {isDark ? 'Dark mode' : 'Light mode'}
                    </Text>
                  </Flex>
                  <Switch
                    size="1"
                    checked={isDark}
                    onCheckedChange={onToggleMode}
                    aria-label="Toggle dark mode"
                    color="orange"
                  />
                </Flex>
              </Box>

              {/* ── Divider ────────────────────────────────────────────────── */}
              <Box style={{ padding: '0 12px' }}>
                <Separator style={{ backgroundColor: popoverBorder, width: '100%' }} />
              </Box>

              {/* ── Logout button ──────────────────────────────────────────── */}
              <Box style={{ padding: '4px 0 4px' }}>
                <button
                  onClick={onLogout}
                  style={{
                    all: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 16px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    borderRadius: 0,
                    transition: 'background-color 0.15s',
                    color: '#e55a24',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = popoverLogoutHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <ExitIcon style={{ width: 14, height: 14 }} />
                  <Text size="2" weight="medium" style={{ color: 'inherit' }}>
                    Log out
                  </Text>
                </button>
              </Box>
            </Box>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Root>
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
    mode,
    onLogout: handleLogout,
    onToggleMode: toggleMode,
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

            {/* Right: theme toggle + user icon (mobile only) */}
            <Flex align="center" gap="2">
              <IconButton
                variant="ghost"
                onClick={toggleMode}
                aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
              </IconButton>
              {/* Mobile user menu — visible when sidebar is hidden */}
              <PopoverPrimitive.Root>
                <PopoverPrimitive.Trigger asChild>
                  <IconButton
                    className="vp-hamburger"
                    variant="ghost"
                    aria-label="Open user menu"
                  >
                    <PersonIcon />
                  </IconButton>
                </PopoverPrimitive.Trigger>
                {/*
                 * overflow: 'visible' on Content keeps the Arrow from being clipped.
                 * The inner card box carries overflow: 'hidden' to prevent scrollbars.
                 */}
                <PopoverPrimitive.Content
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  style={{
                    width: 240,
                    padding: 0,
                    overflow: 'visible',
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    zIndex: 9999,
                  }}
                >
                  <PopoverPrimitive.Arrow
                    style={{ fill: mode === 'dark' ? '#242424' : '#ffffff', display: 'block' }}
                    width={12}
                    height={6}
                  />
                  {/* Inner card */}
                  <Box
                    style={{
                      backgroundColor: mode === 'dark' ? '#242424' : '#ffffff',
                      border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'var(--gray-4)'}`,
                      borderRadius: 'var(--radius-4)',
                      boxShadow:
                        mode === 'dark'
                          ? '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)'
                          : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <MobileUserMenuContent
                      mode={mode}
                      onToggleMode={toggleMode}
                      onLogout={handleLogout}
                    />
                  </Box>
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Root>
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

// ─── Mobile user menu content ─────────────────────────────────────────────────
// Shared popover body used in the mobile top-header user button.
// The sidebar version is inlined directly into the Sidebar component above.

interface MobileUserMenuContentProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
  onLogout: () => void;
}

function MobileUserMenuContent({
  mode,
  onToggleMode,
  onLogout,
}: MobileUserMenuContentProps) {
  const isDark = mode === 'dark';
  const popoverBorder = isDark ? 'rgba(255,255,255,0.1)' : 'var(--gray-4)';
  const popoverRowHoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'var(--gray-2)';
  const popoverLabelColor = isDark ? 'rgba(255,255,255,0.55)' : '#6c757d';
  const popoverValueColor = isDark ? 'rgba(255,255,255,0.9)' : '#212529';
  const popoverLogoutHoverBg = isDark ? 'rgba(229,92,20,0.15)' : '#fff1ec';

  return (
    <>
      {/* Theme toggle */}
      <Box style={{ padding: '4px 0' }}>
        <Flex
          align="center"
          justify="between"
          style={{ padding: '8px 16px', transition: 'background-color 0.15s' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = popoverRowHoverBg;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          <Flex align="center" gap="2">
            {isDark ? (
              <MoonIcon style={{ color: popoverLabelColor, width: 14, height: 14 }} />
            ) : (
              <SunIcon style={{ color: popoverLabelColor, width: 14, height: 14 }} />
            )}
            <Text size="2" style={{ color: popoverValueColor }}>
              {isDark ? 'Dark mode' : 'Light mode'}
            </Text>
          </Flex>
          <Switch
            size="1"
            checked={isDark}
            onCheckedChange={onToggleMode}
            aria-label="Toggle dark mode"
            color="orange"
          />
        </Flex>
      </Box>

      {/* Divider */}
      <Box style={{ padding: '0 12px' }}>
        <Separator style={{ backgroundColor: popoverBorder, width: '100%' }} />
      </Box>

      {/* Logout */}
      <Box style={{ padding: '4px 0 4px' }}>
        <button
          onClick={onLogout}
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '8px 16px',
            boxSizing: 'border-box',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
            color: '#e55a24',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = popoverLogoutHoverBg;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          <ExitIcon style={{ width: 14, height: 14 }} />
          <Text size="2" weight="medium" style={{ color: 'inherit' }}>
            Log out
          </Text>
        </button>
      </Box>
    </>
  );
}
