import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitationDeclinePage } from '../InvitationDeclinePage';
import { renderWithProviders } from '../../test/utils';

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

describe('InvitationDeclinePage', () => {
  it('shows "Link Invalid" when no token is present', () => {
    renderWithProviders(<InvitationDeclinePage />, {
      routerProps: { initialEntries: ['/invitation/decline'] },
    });
    expect(screen.getByText(/link invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/no invitation token provided/i)).toBeInTheDocument();
  });

  it('shows loading state while declining', () => {
    vi.mocked(invitationsApi.decline).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<InvitationDeclinePage />, {
      routerProps: { initialEntries: ['/invitation/decline?token=abc'] },
    });
    expect(screen.getByText(/processing your response/i)).toBeInTheDocument();
  });

  it('shows success state after declining', async () => {
    vi.mocked(invitationsApi.decline).mockResolvedValue({ message: 'Invitation declined.' });
    renderWithProviders(<InvitationDeclinePage />, {
      routerProps: { initialEntries: ['/invitation/decline?token=valid-tok'] },
    });
    await waitFor(() => {
      // "Invitation Declined" appears in the heading AND as part of the message body text
      expect(screen.getAllByText(/invitation declined/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "Back to Home" button on success', async () => {
    vi.mocked(invitationsApi.decline).mockResolvedValue({ message: 'ok' });
    renderWithProviders(<InvitationDeclinePage />, {
      routerProps: { initialEntries: ['/invitation/decline?token=tok'] },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument();
    });
  });

  it('shows error state when the API call fails', async () => {
    vi.mocked(invitationsApi.decline).mockRejectedValue(new Error('expired'));
    renderWithProviders(<InvitationDeclinePage />, {
      routerProps: { initialEntries: ['/invitation/decline?token=bad'] },
    });
    await waitFor(() => {
      expect(screen.getByText(/link invalid/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid or has already been used/i)).toBeInTheDocument();
  });

  it('navigates to / when "Go to Home" is clicked from the error state', async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.decline).mockRejectedValue(new Error('expired'));
    renderWithProviders(<InvitationDeclinePage />, {
      routerProps: { initialEntries: ['/invitation/decline?token=bad'] },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /go to home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to / when "Go to Home" is clicked from the missing-token state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InvitationDeclinePage />, {
      routerProps: { initialEntries: ['/invitation/decline'] },
    });
    await user.click(screen.getByRole('button', { name: /go to home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
