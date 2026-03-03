import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from '../DashboardPage';
import { renderWithProviders, makeEvent } from '../../test/utils';

vi.mock('../../auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../hooks/useEvents', () => ({ useEvents: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { useAuth } from '../../auth/useAuth';
import { useEvents } from '../../hooks/useEvents';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      name: 'Alice Smith',
      email: 'alice@example.com',
      userId: 'user-alice',
      roles: ['user'],
      login: vi.fn(),
      logout: vi.fn(),
      silentRenew: vi.fn(),
      accessToken: 'tok',
      oidcUser: null,
      userManager: {} as never,
    });
  });

  it('shows personalized greeting with the user first name', () => {
    vi.mocked(useEvents).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows generic greeting when name is null', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      name: null,
      email: 'alice@example.com',
      userId: 'user-alice',
      roles: [],
      login: vi.fn(),
      logout: vi.fn(),
      silentRenew: vi.fn(),
      accessToken: null,
      oidcUser: null,
      userManager: {} as never,
    });
    vi.mocked(useEvents).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Welcome back!/i)).toBeInTheDocument();
  });

  it('shows a loading spinner while events load', () => {
    vi.mocked(useEvents).mockReturnValue({ data: undefined, isLoading: true, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    const spinner = document.querySelector('.p-progress-spinner');
    expect(spinner).toBeTruthy();
  });

  it('shows an error message when events fail to load', () => {
    vi.mocked(useEvents).mockReturnValue({ data: undefined, isLoading: false, isError: true } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/couldn't load events/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no events', () => {
    vi.mocked(useEvents).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
  });

  it('renders stats when events are present', () => {
    const events = [
      makeEvent({ date: '2099-01-01T00:00:00Z' }), // upcoming
      makeEvent({ date: '2000-01-01T00:00:00Z' }), // past
    ];
    vi.mocked(useEvents).mockReturnValue({ data: events, isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Total Events')).toBeInTheDocument();
    // "Upcoming" appears both in the stat label and as a PrimeReact Tag on the EventCard
    expect(screen.getAllByText('Upcoming').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Past Events')).toBeInTheDocument();
  });

  it('renders event cards for the most recent events', () => {
    const events = [makeEvent({ name: 'Garden Party' })];
    vi.mocked(useEvents).mockReturnValue({ data: events, isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Garden Party')).toBeInTheDocument();
  });

  it('limits shown events to the 4 most recent', () => {
    const events = Array.from({ length: 6 }, (_, i) => makeEvent({ name: `Event ${i + 1}` }));
    vi.mocked(useEvents).mockReturnValue({ data: events, isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    // Only 4 cards should be rendered
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 4')).toBeInTheDocument();
    expect(screen.queryByText('Event 5')).not.toBeInTheDocument();
  });

  it('navigates to /events/new when Create Event button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useEvents).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    // Multiple Create Event buttons may exist; click the first one
    await user.click(screen.getAllByRole('button', { name: /create event/i })[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/events/new');
  });

  it('navigates to /events when "View all events" is clicked', async () => {
    const user = userEvent.setup();
    const events = [makeEvent({ name: 'Test' })];
    vi.mocked(useEvents).mockReturnValue({ data: events, isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    await user.click(screen.getByRole('button', { name: /view all events/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('shows "See all" link when there are events', () => {
    const events = [makeEvent()];
    vi.mocked(useEvents).mockReturnValue({ data: events, isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('button', { name: /see all/i })).toBeInTheDocument();
  });

  it('shows tagline text', () => {
    vi.mocked(useEvents).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useEvents>);
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/ready to plan your next event/i)).toBeInTheDocument();
  });
});
