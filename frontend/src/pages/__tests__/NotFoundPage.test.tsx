import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotFoundPage } from '../NotFoundPage';
import { renderWithProviders } from '../../test/utils';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('NotFoundPage', () => {
  it('renders the 404 code', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders "Page not found" heading', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });

  it('renders a descriptive message', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByText(/doesn't exist or has been moved/i)).toBeInTheDocument();
  });

  it('renders "Back to Dashboard" button', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
  });

  it('renders "View Events" button', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByRole('button', { name: /view events/i })).toBeInTheDocument();
  });

  it('navigates to / when "Back to Dashboard" is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotFoundPage />);
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to /events when "View Events" is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotFoundPage />);
    await user.click(screen.getByRole('button', { name: /view events/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });
});
