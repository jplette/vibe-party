import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from '../AppLayout';
import { renderWithProviders, mockUseAuth } from '../../../test/utils';

// Mock useAuth so AppLayout gets a predictable user
vi.mock('../../../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useAuth } from '../../../auth/useAuth';

describe('AppLayout', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(mockUseAuth({ name: 'Alice Smith', email: 'alice@example.com' }) as ReturnType<typeof useAuth>);
  });

  it('renders the VibeParty logo text in the sidebar', () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    // The logo appears twice (sidebar + header brand) — check at least one
    expect(screen.getAllByText(/VibeParty|Vibe/)[0]).toBeInTheDocument();
  });

  it('renders children inside the main content area', () => {
    renderWithProviders(
      <AppLayout>
        <p>Hello world</p>
      </AppLayout>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders the Dashboard navigation link', () => {
    renderWithProviders(<AppLayout><div /></AppLayout>);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders the My Events navigation link', () => {
    renderWithProviders(<AppLayout><div /></AppLayout>);
    expect(screen.getByRole('link', { name: /my events/i })).toBeInTheDocument();
  });

  it('renders the user initials in the avatar', () => {
    renderWithProviders(<AppLayout><div /></AppLayout>);
    // "Alice Smith" → "AS"
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('renders user name or email in the header', () => {
    renderWithProviders(<AppLayout><div /></AppLayout>);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('falls back to "?" initials when no name is provided', () => {
    vi.mocked(useAuth).mockReturnValue(
      mockUseAuth({ name: null, email: 'noname@example.com' }) as ReturnType<typeof useAuth>
    );
    renderWithProviders(<AppLayout><div /></AppLayout>);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders the Create Event button in the sidebar footer', () => {
    renderWithProviders(<AppLayout><div /></AppLayout>);
    // The sidebar has a "Create Event" button
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
  });

  it('navigates to /events/new when Create Event button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppLayout><div /></AppLayout>);
    await user.click(screen.getByRole('button', { name: /create event/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/events/new');
  });

  it('renders the hamburger menu button', () => {
    renderWithProviders(<AppLayout><div /></AppLayout>);
    expect(screen.getByRole('button', { name: /open sidebar/i })).toBeInTheDocument();
  });

  it('opens the sidebar overlay when hamburger is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<AppLayout><div /></AppLayout>);
    await user.click(screen.getByRole('button', { name: /open sidebar/i }));
    // An overlay div should appear when sidebar is open
    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
  });
});
