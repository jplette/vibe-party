import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventListPage } from '../EventListPage';
import { renderWithProviders, makeEvent } from '../../test/utils';

vi.mock('../../hooks/useEvents', () => ({ useEvents: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { useEvents } from '../../hooks/useEvents';

describe('EventListPage', () => {
  it('renders the page heading', () => {
    vi.mocked(useEvents).mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    expect(screen.getByText('My Events')).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    vi.mocked(useEvents).mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    expect(screen.getByText(/all events you're part of/i)).toBeInTheDocument();
  });

  it('shows loading spinner when events are loading', () => {
    vi.mocked(useEvents).mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    const spinner = document.querySelector('.p-progress-spinner');
    expect(spinner).toBeTruthy();
  });

  it('shows error message and Retry button on error', () => {
    vi.mocked(useEvents).mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    expect(screen.getByText(/couldn't load your events/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls refetch when Retry button is clicked', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    vi.mocked(useEvents).mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('shows empty state when no events exist', () => {
    vi.mocked(useEvents).mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first event/i })).toBeInTheDocument();
  });

  it('renders event cards when events exist', () => {
    vi.mocked(useEvents).mockReturnValue({
      data: [makeEvent({ name: 'Rooftop Party' })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    expect(screen.getByText('Rooftop Party')).toBeInTheDocument();
  });

  it('renders multiple event cards', () => {
    vi.mocked(useEvents).mockReturnValue({
      data: [
        makeEvent({ name: 'Birthday Bash' }),
        makeEvent({ name: 'Game Night' }),
        makeEvent({ name: 'Farewell Party' }),
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    expect(screen.getByText('Birthday Bash')).toBeInTheDocument();
    expect(screen.getByText('Game Night')).toBeInTheDocument();
    expect(screen.getByText('Farewell Party')).toBeInTheDocument();
  });

  it('navigates to /events/new from the header Create Event button', async () => {
    const user = userEvent.setup();
    vi.mocked(useEvents).mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    // Header action button
    await user.click(screen.getAllByRole('button', { name: /create event/i })[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/events/new');
  });

  it('does not show error state when loading is in progress', () => {
    vi.mocked(useEvents).mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as ReturnType<typeof useEvents>);
    renderWithProviders(<EventListPage />);
    expect(screen.queryByText(/couldn't load/i)).not.toBeInTheDocument();
  });
});
