package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
	"github.com/vibe-party/backend/internal/repository"
)

func newInvitation(status, email string, eventID uuid.UUID) *model.Invitation {
	return &model.Invitation{
		ID:        uuid.New(),
		EventID:   eventID,
		Email:     email,
		Token:     "some-token-value",
		Status:    status,
		InvitedBy: uuid.New(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// ---- SendInvitation ----

func TestInvitationService_SendInvitation(t *testing.T) {
	eventID := uuid.New()
	callerID := uuid.New()
	event := newEvent("Garden Party")
	event.ID = eventID

	t.Run("sends invitation when caller is a member", func(t *testing.T) {
		inv := newInvitation("pending", "guest@example.com", eventID)
		emailCh := make(chan struct{}, 1)

		svc := newTestInvitationService(
			&mockInvRepo{
				CreateFn: func(_ context.Context, _ uuid.UUID, _, _ string, _ uuid.UUID) (*model.Invitation, error) {
					return inv, nil
				},
			},
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "member", nil
				},
				GetByIDFn: func(_ context.Context, _ uuid.UUID) (*model.Event, error) {
					return event, nil
				},
			},
			&mockUserRepo{},
			&mockEmailSender{
				SendInvitationFn: func(_, _, _ string) error {
					emailCh <- struct{}{}
					return nil
				},
			},
		)

		got, err := svc.SendInvitation(context.Background(), eventID, callerID, "guest@example.com")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != inv.ID {
			t.Errorf("got invitation ID %v; want %v", got.ID, inv.ID)
		}

		// Email is sent asynchronously — wait for signal via channel (race-safe).
		select {
		case <-emailCh:
			// email was sent
		case <-time.After(100 * time.Millisecond):
			t.Error("expected email to be sent within 100ms")
		}
	})

	t.Run("returns ErrInvalidInput when email is empty", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{},
			&mockEventRepo{},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		_, err := svc.SendInvitation(context.Background(), eventID, callerID, "")
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("got %v; want ErrInvalidInput", err)
		}
	})

	t.Run("returns ErrForbidden when caller is not a member", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{},
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "", repository.ErrNotFound
				},
			},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		_, err := svc.SendInvitation(context.Background(), eventID, callerID, "guest@example.com")
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns ErrNotFound when event does not exist", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{},
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "member", nil
				},
				GetByIDFn: func(_ context.Context, _ uuid.UUID) (*model.Event, error) {
					return nil, repository.ErrNotFound
				},
			},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		_, err := svc.SendInvitation(context.Background(), eventID, callerID, "guest@example.com")
		if !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})
}

// ---- ListInvitations ----

func TestInvitationService_ListInvitations(t *testing.T) {
	eventID := uuid.New()
	userID := uuid.New()

	t.Run("returns invitations when user is member", func(t *testing.T) {
		want := []model.Invitation{*newInvitation("pending", "a@b.com", eventID)}
		svc := newTestInvitationService(
			&mockInvRepo{
				ListByEventIDFn: func(_ context.Context, id uuid.UUID) ([]model.Invitation, error) {
					if id != eventID {
						t.Errorf("wrong eventID %v", id)
					}
					return want, nil
				},
			},
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "member", nil
				},
			},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		got, err := svc.ListInvitations(context.Background(), eventID, userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(got) != 1 {
			t.Errorf("expected 1 invitation, got %d", len(got))
		}
	})

	t.Run("returns ErrForbidden when not a member", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{},
			nonMemberEventRepo(),
			&mockUserRepo{},
			&mockEmailSender{},
		)

		_, err := svc.ListInvitations(context.Background(), eventID, uuid.New())
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns empty slice when no invitations", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{
				ListByEventIDFn: func(_ context.Context, _ uuid.UUID) ([]model.Invitation, error) {
					return nil, nil
				},
			},
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "member", nil
				},
			},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		got, err := svc.ListInvitations(context.Background(), eventID, userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got == nil {
			t.Error("expected non-nil empty slice")
		}
	})
}

// ---- CancelInvitation ----

func TestInvitationService_CancelInvitation(t *testing.T) {
	eventID := uuid.New()
	invID := uuid.New()
	adminID := uuid.New()

	t.Run("cancels invitation when caller is admin", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{
				DeleteFn: func(_ context.Context, iID, eID uuid.UUID) error {
					if iID != invID || eID != eventID {
						t.Error("wrong IDs passed to Delete")
					}
					return nil
				},
			},
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "admin", nil
				},
			},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		if err := svc.CancelInvitation(context.Background(), eventID, invID, adminID); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("returns ErrForbidden when caller is member not admin", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{},
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "member", nil
				},
			},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		if err := svc.CancelInvitation(context.Background(), eventID, invID, uuid.New()); !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns ErrForbidden when caller is not a member", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{},
			nonMemberEventRepo(),
			&mockUserRepo{},
			&mockEmailSender{},
		)

		if err := svc.CancelInvitation(context.Background(), eventID, invID, uuid.New()); !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns ErrNotFound when invitation does not exist", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{
				DeleteFn: func(_ context.Context, _, _ uuid.UUID) error {
					return repository.ErrNotFound
				},
			},
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "admin", nil
				},
			},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		if err := svc.CancelInvitation(context.Background(), eventID, invID, adminID); !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})
}

// ---- AcceptInvitation ----

func TestInvitationService_AcceptInvitation(t *testing.T) {
	eventID := uuid.New()
	userID := uuid.New()

	t.Run("accepts pending invitation and adds member", func(t *testing.T) {
		inv := newInvitation("pending", "invitee@example.com", eventID)
		addMemberCalled := false

		svc := newTestInvitationService(
			&mockInvRepo{
				GetByTokenFn: func(_ context.Context, token string) (*model.Invitation, error) {
					if token != inv.Token {
						t.Errorf("wrong token %q", token)
					}
					return inv, nil
				},
				UpdateStatusFn: func(_ context.Context, id uuid.UUID, status string) error {
					if id != inv.ID {
						t.Errorf("wrong inv ID")
					}
					if status != "accepted" {
						t.Errorf("wrong status %q; want accepted", status)
					}
					return nil
				},
			},
			&mockEventRepo{
				AddMemberFn: func(_ context.Context, _, _ uuid.UUID, role string) error {
					addMemberCalled = true
					if role != "member" {
						t.Errorf("wrong role %q; want member", role)
					}
					return nil
				},
			},
			&mockUserRepo{
				GetByEmailFn: func(_ context.Context, email string) (*model.User, error) {
					return &model.User{ID: userID, Email: email}, nil
				},
			},
			&mockEmailSender{},
		)

		got, err := svc.AcceptInvitation(context.Background(), inv.Token)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != inv.ID {
			t.Errorf("got invitation ID %v; want %v", got.ID, inv.ID)
		}
		if !addMemberCalled {
			t.Error("expected AddMember to be called")
		}
	})

	t.Run("returns ErrNotFound for invalid token", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{
				GetByTokenFn: func(_ context.Context, _ string) (*model.Invitation, error) {
					return nil, repository.ErrNotFound
				},
			},
			&mockEventRepo{},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		_, err := svc.AcceptInvitation(context.Background(), "bad-token")
		if !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})

	t.Run("returns ErrInvalidInput when invitation is already accepted", func(t *testing.T) {
		inv := newInvitation("accepted", "guest@example.com", eventID)
		svc := newTestInvitationService(
			&mockInvRepo{
				GetByTokenFn: func(_ context.Context, _ string) (*model.Invitation, error) {
					return inv, nil
				},
			},
			&mockEventRepo{},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		_, err := svc.AcceptInvitation(context.Background(), inv.Token)
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("got %v; want ErrInvalidInput", err)
		}
	})

	t.Run("returns ErrInvalidInput when invitation is already declined", func(t *testing.T) {
		inv := newInvitation("declined", "guest@example.com", eventID)
		svc := newTestInvitationService(
			&mockInvRepo{
				GetByTokenFn: func(_ context.Context, _ string) (*model.Invitation, error) {
					return inv, nil
				},
			},
			&mockEventRepo{},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		_, err := svc.AcceptInvitation(context.Background(), inv.Token)
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("got %v; want ErrInvalidInput", err)
		}
	})

	t.Run("still succeeds when user account does not exist yet", func(t *testing.T) {
		inv := newInvitation("pending", "newuser@example.com", eventID)
		svc := newTestInvitationService(
			&mockInvRepo{
				GetByTokenFn: func(_ context.Context, _ string) (*model.Invitation, error) {
					return inv, nil
				},
				UpdateStatusFn: func(_ context.Context, _ uuid.UUID, _ string) error {
					return nil
				},
			},
			&mockEventRepo{},
			&mockUserRepo{
				GetByEmailFn: func(_ context.Context, _ string) (*model.User, error) {
					return nil, repository.ErrNotFound
				},
			},
			&mockEmailSender{},
		)

		got, err := svc.AcceptInvitation(context.Background(), inv.Token)
		if err != nil {
			t.Fatalf("unexpected error when user does not exist: %v", err)
		}
		if got == nil {
			t.Error("expected invitation back, got nil")
		}
	})
}

// ---- DeclineInvitation ----

func TestInvitationService_DeclineInvitation(t *testing.T) {
	eventID := uuid.New()

	t.Run("declines pending invitation", func(t *testing.T) {
		inv := newInvitation("pending", "guest@example.com", eventID)
		svc := newTestInvitationService(
			&mockInvRepo{
				GetByTokenFn: func(_ context.Context, _ string) (*model.Invitation, error) {
					return inv, nil
				},
				UpdateStatusFn: func(_ context.Context, id uuid.UUID, status string) error {
					if status != "declined" {
						t.Errorf("wrong status %q; want declined", status)
					}
					return nil
				},
			},
			&mockEventRepo{},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		if err := svc.DeclineInvitation(context.Background(), inv.Token); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("returns ErrNotFound for unknown token", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{
				GetByTokenFn: func(_ context.Context, _ string) (*model.Invitation, error) {
					return nil, repository.ErrNotFound
				},
			},
			&mockEventRepo{},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		if err := svc.DeclineInvitation(context.Background(), "bad-token"); !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})

	t.Run("returns ErrInvalidInput when invitation is already processed", func(t *testing.T) {
		inv := newInvitation("accepted", "guest@example.com", eventID)
		svc := newTestInvitationService(
			&mockInvRepo{
				GetByTokenFn: func(_ context.Context, _ string) (*model.Invitation, error) {
					return inv, nil
				},
			},
			&mockEventRepo{},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		if err := svc.DeclineInvitation(context.Background(), inv.Token); !errors.Is(err, ErrInvalidInput) {
			t.Errorf("got %v; want ErrInvalidInput", err)
		}
	})
}

// ---- ClaimForUser ----

func TestInvitationService_ClaimForUser(t *testing.T) {
	userID := uuid.New()

	t.Run("adds user to events for accepted invitations", func(t *testing.T) {
		eventID1 := uuid.New()
		eventID2 := uuid.New()
		addedEvents := make(map[uuid.UUID]bool)

		svc := newTestInvitationService(
			&mockInvRepo{
				ListAcceptedByEmailFn: func(_ context.Context, email string) ([]model.Invitation, error) {
					return []model.Invitation{
						*newInvitation("accepted", email, eventID1),
						*newInvitation("accepted", email, eventID2),
					}, nil
				},
			},
			&mockEventRepo{
				AddMemberFn: func(_ context.Context, eID, _ uuid.UUID, _ string) error {
					addedEvents[eID] = true
					return nil
				},
			},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		if err := svc.ClaimForUser(context.Background(), userID, "user@example.com"); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !addedEvents[eventID1] {
			t.Error("expected user to be added to event 1")
		}
		if !addedEvents[eventID2] {
			t.Error("expected user to be added to event 2")
		}
	})

	t.Run("no-op when no accepted invitations", func(t *testing.T) {
		svc := newTestInvitationService(
			&mockInvRepo{
				ListAcceptedByEmailFn: func(_ context.Context, _ string) ([]model.Invitation, error) {
					return []model.Invitation{}, nil
				},
			},
			&mockEventRepo{},
			&mockUserRepo{},
			&mockEmailSender{},
		)

		if err := svc.ClaimForUser(context.Background(), userID, "new@example.com"); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})
}
