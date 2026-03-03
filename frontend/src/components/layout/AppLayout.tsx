import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import { useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { name, email, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<Menu>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userMenuItems: MenuItem[] = [
    {
      label: name ?? email ?? 'Account',
      items: [
        {
          label: 'Sign out',
          icon: 'pi pi-sign-out',
          command: () => logout(),
        },
      ],
    },
  ];

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: 'pi pi-home', end: true },
    { to: '/events', label: 'My Events', icon: 'pi pi-calendar' },
  ];

  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
        aria-label="Main navigation"
      >
        <div className={styles.sidebarHeader}>
          <span className={styles.logo}>
            <i className="pi pi-star-fill" aria-hidden="true" />
            Vibe Party
          </span>
          <button
            className={styles.closeSidebar}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <i className="pi pi-times" />
          </button>
        </div>

        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`${link.icon} ${styles.navIcon}`} aria-hidden="true" />
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <Button
            label="Create Event"
            icon="pi pi-plus"
            className={styles.createBtn}
            onClick={() => {
              navigate('/events/new');
              setSidebarOpen(false);
            }}
          />
        </div>
      </nav>

      {/* Main area */}
      <div className={styles.main}>
        {/* Top header */}
        <header className={styles.header}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <i className="pi pi-bars" />
          </button>

          <span className={styles.headerBrand}>Vibe Party</span>

          <div className={styles.headerRight}>
            <Menu
              ref={menuRef}
              model={userMenuItems}
              popup
              id="user-menu"
              aria-label="User menu"
            />
            <button
              className={styles.avatarBtn}
              onClick={(e) => menuRef.current?.toggle(e)}
              aria-haspopup
              aria-controls="user-menu"
              aria-label={`User menu for ${name ?? email}`}
            >
              <Avatar
                label={initials}
                shape="circle"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              />
              <span className={styles.userName}>{name ?? email ?? 'Me'}</span>
              <i className="pi pi-chevron-down" style={{ fontSize: '0.75rem' }} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
