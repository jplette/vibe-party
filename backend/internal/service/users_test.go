package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
	"github.com/vibe-party/backend/internal/repository"
)

// ---- SyncUser ----

func TestUserService_SyncUser(t *testing.T) {
	t.Run("upserts and returns user", func(t *testing.T) {
		want := &model.User{
			ID:         uuid.New(),
			KeycloakID: "kc-123",
			Email:      "alice@example.com",
			Name:       "Alice",
		}
		svc := newTestUserService(
			&mockUserRepo{
				UpsertByKeycloakIDFn: func(_ context.Context, keycloakID, email, name string) (*model.User, error) {
					if keycloakID != "kc-123" {
						t.Errorf("wrong keycloakID %q", keycloakID)
					}
					if email != "alice@example.com" {
						t.Errorf("wrong email %q", email)
					}
					return want, nil
				},
			},
			&mockEventRepo{},
		)

		got, err := svc.SyncUser(context.Background(), "kc-123", "alice@example.com", "Alice")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != want.ID {
			t.Errorf("got ID %v; want %v", got.ID, want.ID)
		}
	})

	t.Run("propagates repo error", func(t *testing.T) {
		repoErr := errors.New("upsert failed")
		svc := newTestUserService(
			&mockUserRepo{
				UpsertByKeycloakIDFn: func(_ context.Context, _, _, _ string) (*model.User, error) {
					return nil, repoErr
				},
			},
			&mockEventRepo{},
		)

		_, err := svc.SyncUser(context.Background(), "kc-id", "u@e.com", "User")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}

// ---- GetByID ----

func TestUserService_GetByID(t *testing.T) {
	userID := uuid.New()
	want := &model.User{ID: userID, Email: "bob@example.com", Name: "Bob"}

	t.Run("returns user when found", func(t *testing.T) {
		svc := newTestUserService(
			&mockUserRepo{
				GetByIDFn: func(_ context.Context, id uuid.UUID) (*model.User, error) {
					if id != userID {
						t.Errorf("wrong userID %v", id)
					}
					return want, nil
				},
			},
			&mockEventRepo{},
		)

		got, err := svc.GetByID(context.Background(), userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != userID {
			t.Errorf("got ID %v; want %v", got.ID, userID)
		}
	})

	t.Run("returns ErrNotFound when user does not exist", func(t *testing.T) {
		svc := newTestUserService(
			&mockUserRepo{
				GetByIDFn: func(_ context.Context, _ uuid.UUID) (*model.User, error) {
					return nil, repository.ErrNotFound
				},
			},
			&mockEventRepo{},
		)

		_, err := svc.GetByID(context.Background(), uuid.New())
		if !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})
}

// ---- SharesEventMembership ----

func TestUserService_SharesEventMembership(t *testing.T) {
	callerID := uuid.New()
	targetID := uuid.New()

	tests := []struct {
		name    string
		repoVal bool
		repoErr error
		want    bool
		wantErr bool
	}{
		{
			name:    "returns true when they share an event",
			repoVal: true,
			want:    true,
		},
		{
			name:    "returns false when they share no events",
			repoVal: false,
			want:    false,
		},
		{
			name:    "propagates repo error",
			repoErr: errors.New("db error"),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := newTestUserService(
				&mockUserRepo{},
				&mockEventRepo{
					SharesEventMembershipFn: func(_ context.Context, _, _ uuid.UUID) (bool, error) {
						return tt.repoVal, tt.repoErr
					},
				},
			)

			got, err := svc.SharesEventMembership(context.Background(), callerID, targetID)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Errorf("got %v; want %v", got, tt.want)
			}
		})
	}
}

// ---- GetMe ----

func TestUserService_GetMe(t *testing.T) {
	user := &model.User{ID: uuid.New(), Email: "me@example.com", Name: "Me"}

	t.Run("returns user from context", func(t *testing.T) {
		svc := newTestUserService(&mockUserRepo{}, &mockEventRepo{})

		ctx := context.WithValue(context.Background(), model.ContextKeyUser, user)
		got, err := svc.GetMe(ctx)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != user.ID {
			t.Errorf("got ID %v; want %v", got.ID, user.ID)
		}
	})

	t.Run("returns ErrUnauthorized when user not in context", func(t *testing.T) {
		svc := newTestUserService(&mockUserRepo{}, &mockEventRepo{})

		_, err := svc.GetMe(context.Background())
		if !errors.Is(err, ErrUnauthorized) {
			t.Errorf("got %v; want ErrUnauthorized", err)
		}
	})
}
