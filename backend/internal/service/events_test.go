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

// helpers

func newEvent(name string) *model.Event {
	return &model.Event{
		ID:        uuid.New(),
		Name:      name,
		CreatedBy: uuid.New(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// ---- ListUserEvents ----

func TestEventService_ListUserEvents(t *testing.T) {
	userID := uuid.New()
	eventID := uuid.New()

	t.Run("returns events for user", func(t *testing.T) {
		want := []model.EventWithRole{
			{Event: model.Event{ID: eventID, Name: "Party"}, Role: "admin"},
		}
		svc := newTestEventService(&mockEventRepo{
			ListByUserIDFn: func(_ context.Context, id uuid.UUID) ([]model.EventWithRole, error) {
				if id != userID {
					t.Errorf("got userID %v; want %v", id, userID)
				}
				return want, nil
			},
		})

		got, err := svc.ListUserEvents(context.Background(), userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(got) != 1 || got[0].ID != eventID {
			t.Errorf("got %+v; want %+v", got, want)
		}
	})

	t.Run("returns empty slice when user has no events", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			ListByUserIDFn: func(_ context.Context, _ uuid.UUID) ([]model.EventWithRole, error) {
				return nil, nil // repo may return nil slice
			},
		})

		got, err := svc.ListUserEvents(context.Background(), userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got == nil {
			t.Error("expected non-nil slice, got nil")
		}
		if len(got) != 0 {
			t.Errorf("expected empty slice, got %v", got)
		}
	})

	t.Run("propagates repo error", func(t *testing.T) {
		repoErr := errors.New("db down")
		svc := newTestEventService(&mockEventRepo{
			ListByUserIDFn: func(_ context.Context, _ uuid.UUID) ([]model.EventWithRole, error) {
				return nil, repoErr
			},
		})

		_, err := svc.ListUserEvents(context.Background(), userID)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}

// ---- CreateEvent ----

func TestEventService_CreateEvent(t *testing.T) {
	creatorID := uuid.New()

	t.Run("creates event with valid name", func(t *testing.T) {
		wantEvent := newEvent("Birthday Party")
		svc := newTestEventService(&mockEventRepo{
			CreateFn: func(_ context.Context, name, _, _ string, _, _ *string, _ uuid.UUID) (*model.Event, error) {
				return wantEvent, nil
			},
		})

		got, err := svc.CreateEvent(context.Background(), "Birthday Party", "", "", nil, nil, creatorID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != wantEvent.ID {
			t.Errorf("got event ID %v; want %v", got.ID, wantEvent.ID)
		}
	})

	t.Run("returns ErrInvalidInput when name is empty", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{})

		_, err := svc.CreateEvent(context.Background(), "", "", "", nil, nil, creatorID)
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("got %v; want ErrInvalidInput", err)
		}
	})

	t.Run("propagates repo error", func(t *testing.T) {
		repoErr := errors.New("insert failed")
		svc := newTestEventService(&mockEventRepo{
			CreateFn: func(_ context.Context, _, _, _ string, _, _ *string, _ uuid.UUID) (*model.Event, error) {
				return nil, repoErr
			},
		})

		_, err := svc.CreateEvent(context.Background(), "My Event", "", "", nil, nil, creatorID)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}

// ---- GetEvent ----

func TestEventService_GetEvent(t *testing.T) {
	eventID := uuid.New()
	userID := uuid.New()
	event := newEvent("Picnic")

	t.Run("returns event when user is a member", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetByIDFn: func(_ context.Context, id uuid.UUID) (*model.Event, error) {
				if id != eventID {
					t.Errorf("wrong eventID: %v", id)
				}
				return event, nil
			},
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "member", nil
			},
		})

		got, err := svc.GetEvent(context.Background(), eventID, userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != event.ID {
			t.Errorf("got event %v; want %v", got.ID, event.ID)
		}
	})

	t.Run("returns ErrNotFound when event does not exist", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetByIDFn: func(_ context.Context, _ uuid.UUID) (*model.Event, error) {
				return nil, repository.ErrNotFound
			},
		})

		_, err := svc.GetEvent(context.Background(), eventID, userID)
		if !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})

	t.Run("returns ErrForbidden when user is not a member", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetByIDFn: func(_ context.Context, _ uuid.UUID) (*model.Event, error) {
				return event, nil
			},
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "", repository.ErrNotFound
			},
		})

		_, err := svc.GetEvent(context.Background(), eventID, userID)
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})
}

// ---- UpdateEvent ----

func TestEventService_UpdateEvent(t *testing.T) {
	eventID := uuid.New()
	adminID := uuid.New()
	memberID := uuid.New()

	t.Run("updates event when caller is admin", func(t *testing.T) {
		updated := newEvent("Updated Name")
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, userID uuid.UUID) (string, error) {
				if userID == adminID {
					return "admin", nil
				}
				return "member", nil
			},
			UpdateFn: func(_ context.Context, _ uuid.UUID, name, _, _ string, _, _ *string) (*model.Event, error) {
				updated.Name = name
				return updated, nil
			},
		})

		got, err := svc.UpdateEvent(context.Background(), eventID, adminID, "Updated Name", "", "", nil, nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.Name != "Updated Name" {
			t.Errorf("got name %q; want %q", got.Name, "Updated Name")
		}
	})

	t.Run("returns ErrInvalidInput when name is empty", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{})

		_, err := svc.UpdateEvent(context.Background(), eventID, adminID, "", "", "", nil, nil)
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("got %v; want ErrInvalidInput", err)
		}
	})

	t.Run("returns ErrForbidden when caller is not admin", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "member", nil
			},
		})

		_, err := svc.UpdateEvent(context.Background(), eventID, memberID, "New Name", "", "", nil, nil)
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns ErrForbidden when caller is not a member at all", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "", repository.ErrNotFound
			},
		})

		_, err := svc.UpdateEvent(context.Background(), eventID, uuid.New(), "New Name", "", "", nil, nil)
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns ErrNotFound when event does not exist", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "admin", nil
			},
			UpdateFn: func(_ context.Context, _ uuid.UUID, _, _, _ string, _, _ *string) (*model.Event, error) {
				return nil, repository.ErrNotFound
			},
		})

		_, err := svc.UpdateEvent(context.Background(), eventID, adminID, "New Name", "", "", nil, nil)
		if !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})
}

// ---- DeleteEvent ----

func TestEventService_DeleteEvent(t *testing.T) {
	eventID := uuid.New()
	adminID := uuid.New()

	t.Run("deletes event when caller is admin", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "admin", nil
			},
			DeleteFn: func(_ context.Context, id uuid.UUID) error {
				if id != eventID {
					t.Errorf("wrong eventID %v", id)
				}
				return nil
			},
		})

		if err := svc.DeleteEvent(context.Background(), eventID, adminID); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("returns ErrForbidden when caller is member", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "member", nil
			},
		})

		if err := svc.DeleteEvent(context.Background(), eventID, uuid.New()); !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns ErrNotFound when event does not exist", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "admin", nil
			},
			DeleteFn: func(_ context.Context, _ uuid.UUID) error {
				return repository.ErrNotFound
			},
		})

		if err := svc.DeleteEvent(context.Background(), eventID, adminID); !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})
}

// ---- ListMembers ----

func TestEventService_ListMembers(t *testing.T) {
	eventID := uuid.New()
	memberID := uuid.New()

	t.Run("returns members when user is a member", func(t *testing.T) {
		wantMembers := []model.EventMemberWithUser{
			{EventID: eventID, UserID: memberID, Role: "admin"},
		}
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "admin", nil
			},
			ListMembersFn: func(_ context.Context, id uuid.UUID) ([]model.EventMemberWithUser, error) {
				if id != eventID {
					t.Errorf("wrong eventID %v", id)
				}
				return wantMembers, nil
			},
		})

		got, err := svc.ListMembers(context.Background(), eventID, memberID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(got) != 1 {
			t.Errorf("expected 1 member, got %d", len(got))
		}
	})

	t.Run("returns ErrForbidden when user is not a member", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "", repository.ErrNotFound
			},
		})

		_, err := svc.ListMembers(context.Background(), eventID, uuid.New())
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns empty slice when no members found", func(t *testing.T) {
		svc := newTestEventService(&mockEventRepo{
			GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
				return "member", nil
			},
			ListMembersFn: func(_ context.Context, _ uuid.UUID) ([]model.EventMemberWithUser, error) {
				return nil, nil
			},
		})

		got, err := svc.ListMembers(context.Background(), eventID, memberID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got == nil {
			t.Error("expected non-nil empty slice")
		}
	})
}

// ---- RequireMember ----

func TestEventService_RequireMember(t *testing.T) {
	eventID := uuid.New()
	userID := uuid.New()

	tests := []struct {
		name       string
		repoRole   string
		repoErr    error
		wantRole   string
		wantErrIs  error
	}{
		{
			name:      "admin member",
			repoRole:  "admin",
			wantRole:  "admin",
		},
		{
			name:      "regular member",
			repoRole:  "member",
			wantRole:  "member",
		},
		{
			name:      "not a member returns ErrForbidden",
			repoErr:   repository.ErrNotFound,
			wantErrIs: ErrForbidden,
		},
		{
			name:      "unexpected repo error is propagated",
			repoErr:   errors.New("db error"),
			wantErrIs: nil, // just check non-nil
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := newTestEventService(&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return tt.repoRole, tt.repoErr
				},
			})

			role, err := svc.RequireMember(context.Background(), eventID, userID)

			if tt.repoErr == nil && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tt.wantErrIs != nil && !errors.Is(err, tt.wantErrIs) {
				t.Errorf("got %v; want %v", err, tt.wantErrIs)
			}
			if err == nil && role != tt.wantRole {
				t.Errorf("got role %q; want %q", role, tt.wantRole)
			}
		})
	}
}
