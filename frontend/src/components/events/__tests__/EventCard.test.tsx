import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from '../EventCard';
import { renderWithProviders, makeEvent } from '../../../test/utils';

// useNavigate is used inside EventCard — mock it so we can assert navigation calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('EventCard', () => {
  it('renders the event name', () => {
    renderWithProviders(<EventCard event={makeEvent({ name: 'Summer BBQ' })} />);
    expect(screen.getByText('Summer BBQ')).toBeInTheDocument();
  });

  it('renders the event description when provided', () => {
    renderWithProviders(
      <EventCard event={makeEvent({ description: 'Bring sunscreen!' })} />
    );
    expect(screen.getByText('Bring sunscreen!')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    renderWithProviders(<EventCard event={makeEvent({ description: undefined })} />);
    // No description paragraph should exist
    expect(screen.queryByText(/bring/i)).not.toBeInTheDocument();
  });

  it('renders the location when provided', () => {
    renderWithProviders(
      <EventCard event={makeEvent({ locationName: 'Central Park' })} />
    );
    expect(screen.getByText('Central Park')).toBeInTheDocument();
  });

  it('does not render location when absent', () => {
    renderWithProviders(<EventCard event={makeEvent({ locationName: undefined, locationCity: undefined })} />);
    // No map-marker text
    expect(screen.queryByText('Central Park')).not.toBeInTheDocument();
  });

  it('shows "Upcoming" tag for a future event date', () => {
    renderWithProviders(
      <EventCard event={makeEvent({ date: '2099-01-01T18:00:00Z' })} />
    );
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('shows "Past" tag for a past event date', () => {
    renderWithProviders(
      <EventCard event={makeEvent({ date: '2000-01-01T18:00:00Z' })} />
    );
    expect(screen.getByText('Past')).toBeInTheDocument();
  });

  it('does not render a date tag when date is absent', () => {
    renderWithProviders(<EventCard event={makeEvent({ date: undefined })} />);
    expect(screen.queryByText('Upcoming')).not.toBeInTheDocument();
    expect(screen.queryByText('Past')).not.toBeInTheDocument();
  });

  it('navigates to event detail when "View Event" button is clicked', async () => {
    const user = userEvent.setup();
    const event = makeEvent({ id: 'evt-42' });
    renderWithProviders(<EventCard event={event} />);

    await user.click(screen.getByRole('button', { name: /view event/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/events/evt-42');
  });

  it('navigates to event detail when the card itself is clicked', async () => {
    const user = userEvent.setup();
    const event = makeEvent({ id: 'evt-99' });
    const { container } = renderWithProviders(<EventCard event={event} />);

    // The Card root is a div wrapping the PrimeReact Card — click the card surface
    const cardEl = container.querySelector('.p-card') as HTMLElement;
    if (cardEl) {
      await user.click(cardEl);
    }
    expect(mockNavigate).toHaveBeenCalledWith('/events/evt-99');
  });

  it('renders formatted date', () => {
    renderWithProviders(
      <EventCard event={makeEvent({ date: '2025-06-15T18:00:00Z' })} />
    );
    // formatDate produces something like "Jun 15, 2025"
    expect(screen.getByText(/Jun 15, 2025/i)).toBeInTheDocument();
  });
});
