import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitationAcceptPage } from '../InvitationAcceptPage';
import { renderWithProviders } from '../../test/utils';

// Mock the invitationsApi
vi.mock('../../api/invitations', () => ({
  invitationsApi: {
    accept: vi.fn(),
    decline: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { invitationsApi } from '../../api/invitations';

describe('InvitationAcceptPage', () => {
  it('shows "missing-token" error when no token is in the URL', () => {
    // No ?token= in search params
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept'] },
    });
    expect(screen.getByText(/link invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/no invitation token provided/i)).toBeInTheDocument();
  });

  it('shows loading state while accepting the invitation', () => {
    // Never-resolving promise keeps it in loading state
    vi.mocked(invitationsApi.accept).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept?token=abc123'] },
    });
    expect(screen.getByText(/accepting your invitation/i)).toBeInTheDocument();
  });

  it('shows success state after a successful accept', async () => {
    vi.mocked(invitationsApi.accept).mockResolvedValue({
      eventId: 'evt-999',
      status: 'accepted',
    });
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept?token=valid-token'] },
    });
    await waitFor(() => {
      expect(screen.getByText(/you're in!/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/invitation accepted/i)).toBeInTheDocument();
  });

  it('shows "View Event" button on success', async () => {
    vi.mocked(invitationsApi.accept).mockResolvedValue({ eventId: 'evt-1', status: 'accepted' });
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept?token=tok'] },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view event/i })).toBeInTheDocument();
    });
  });

  it('navigates to the event when "View Event" is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.accept).mockResolvedValue({ eventId: 'evt-42', status: 'accepted' });
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept?token=tok'] },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view event/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /view event/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/events/evt-42');
  });

  it('navigates to / when eventId is null on success', async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.accept).mockResolvedValue({ eventId: null as unknown as string, status: 'accepted' });
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept?token=tok'] },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view event/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /view event/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows error state when the API call fails', async () => {
    vi.mocked(invitationsApi.accept).mockRejectedValue(new Error('expired'));
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept?token=bad-token'] },
    });
    await waitFor(() => {
      expect(screen.getByText(/link invalid/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid or has already been used/i)).toBeInTheDocument();
  });

  it('shows a "Go to Home" button in the error state', async () => {
    vi.mocked(invitationsApi.accept).mockRejectedValue(new Error('expired'));
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept?token=bad'] },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    });
  });

  it('navigates to / when "Go to Home" is clicked from error state', async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.accept).mockRejectedValue(new Error('expired'));
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept?token=bad'] },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /go to home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders the VibeParty logo on the page', () => {
    renderWithProviders(<InvitationAcceptPage />, {
      routerProps: { initialEntries: ['/invitation/accept'] },
    });
    expect(screen.getByText(/vibe/i)).toBeInTheDocument();
  });
});
