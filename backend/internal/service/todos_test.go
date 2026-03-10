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

func newTodo(title string, eventID uuid.UUID) *model.Todo {
	return &model.Todo{
		ID:        uuid.New(),
		EventID:   eventID,
		Title:     title,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func memberEventRepo() *mockEventRepo {
	return &mockEventRepo{
		GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
			return "member", nil
		},
	}
}

func nonMemberEventRepo() *mockEventRepo {
	return &mockEventRepo{
		GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
			return "", repository.ErrNotFound
		},
	}
}

// ---- ListTodos ----

func TestTodoService_ListTodos(t *testing.T) {
	eventID := uuid.New()
	userID := uuid.New()

	t.Run("returns todos when user is member", func(t *testing.T) {
		want := []model.Todo{*newTodo("Buy drinks", eventID)}
		svc := newTestTodoService(
			&mockTodoRepo{
				ListByEventIDFn: func(_ context.Context, id uuid.UUID) ([]model.Todo, error) {
					if id != eventID {
						t.Errorf("wrong eventID %v", id)
					}
					return want, nil
				},
			},
			memberEventRepo(),
		)

		got, err := svc.ListTodos(context.Background(), eventID, userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(got) != 1 || got[0].Title != "Buy drinks" {
			t.Errorf("got %+v; want %+v", got, want)
		}
	})

	t.Run("returns ErrForbidden when not a member", func(t *testing.T) {
		svc := newTestTodoService(&mockTodoRepo{}, nonMemberEventRepo())

		_, err := svc.ListTodos(context.Background(), eventID, uuid.New())
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns empty slice when no todos", func(t *testing.T) {
		svc := newTestTodoService(
			&mockTodoRepo{
				ListByEventIDFn: func(_ context.Context, _ uuid.UUID) ([]model.Todo, error) {
					return nil, nil
				},
			},
			memberEventRepo(),
		)

		got, err := svc.ListTodos(context.Background(), eventID, userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got == nil {
			t.Error("expected non-nil empty slice")
		}
	})
}

// ---- CreateTodo ----

func TestTodoService_CreateTodo(t *testing.T) {
	eventID := uuid.New()
	userID := uuid.New()

	t.Run("creates todo with valid title", func(t *testing.T) {
		want := newTodo("Set up tables", eventID)
		svc := newTestTodoService(
			&mockTodoRepo{
				CreateFn: func(_ context.Context, id uuid.UUID, title, _ string) (*model.Todo, error) {
					if id != eventID {
						t.Errorf("wrong eventID")
					}
					if title != "Set up tables" {
						t.Errorf("wrong title %q", title)
					}
					return want, nil
				},
			},
			memberEventRepo(),
		)

		got, err := svc.CreateTodo(context.Background(), eventID, userID, "Set up tables", "")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != want.ID {
			t.Errorf("got ID %v; want %v", got.ID, want.ID)
		}
	})

	t.Run("returns ErrInvalidInput when title is empty", func(t *testing.T) {
		svc := newTestTodoService(&mockTodoRepo{}, memberEventRepo())

		_, err := svc.CreateTodo(context.Background(), eventID, userID, "", "")
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("got %v; want ErrInvalidInput", err)
		}
	})

	t.Run("returns ErrForbidden when not a member", func(t *testing.T) {
		svc := newTestTodoService(&mockTodoRepo{}, nonMemberEventRepo())

		_, err := svc.CreateTodo(context.Background(), eventID, uuid.New(), "Task", "")
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})
}

// ---- UpdateTodo ----

func TestTodoService_UpdateTodo(t *testing.T) {
	eventID := uuid.New()
	todoID := uuid.New()
	userID := uuid.New()

	t.Run("updates todo when user is member", func(t *testing.T) {
		want := newTodo("Updated title", eventID)
		svc := newTestTodoService(
			&mockTodoRepo{
				UpdateFn: func(_ context.Context, tid, eid uuid.UUID, title, _ string) (*model.Todo, error) {
					if tid != todoID || eid != eventID {
						t.Error("wrong IDs")
					}
					want.Title = title
					return want, nil
				},
			},
			memberEventRepo(),
		)

		got, err := svc.UpdateTodo(context.Background(), eventID, todoID, userID, "Updated title", "")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.Title != "Updated title" {
			t.Errorf("got title %q; want %q", got.Title, "Updated title")
		}
	})

	t.Run("returns ErrInvalidInput for empty title", func(t *testing.T) {
		svc := newTestTodoService(&mockTodoRepo{}, memberEventRepo())

		_, err := svc.UpdateTodo(context.Background(), eventID, todoID, userID, "", "")
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("got %v; want ErrInvalidInput", err)
		}
	})

	t.Run("returns ErrNotFound when todo does not exist", func(t *testing.T) {
		svc := newTestTodoService(
			&mockTodoRepo{
				UpdateFn: func(_ context.Context, _, _ uuid.UUID, _, _ string) (*model.Todo, error) {
					return nil, repository.ErrNotFound
				},
			},
			memberEventRepo(),
		)

		_, err := svc.UpdateTodo(context.Background(), eventID, todoID, userID, "Title", "")
		if !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})
}

// ---- AssignTodo ----

func TestTodoService_AssignTodo(t *testing.T) {
	eventID := uuid.New()
	todoID := uuid.New()
	callerID := uuid.New()
	assigneeID := uuid.New()

	t.Run("assigns todo to user", func(t *testing.T) {
		want := newTodo("Clean up", eventID)
		want.AssignedTo = &assigneeID
		svc := newTestTodoService(
			&mockTodoRepo{
				AssignFn: func(_ context.Context, tid, eid uuid.UUID, aID *uuid.UUID) (*model.Todo, error) {
					if *aID != assigneeID {
						t.Errorf("wrong assignee %v", aID)
					}
					return want, nil
				},
			},
			memberEventRepo(),
		)

		got, err := svc.AssignTodoToUser(context.Background(), eventID, todoID, callerID, &assigneeID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if *got.AssignedTo != assigneeID {
			t.Errorf("got assignedTo %v; want %v", got.AssignedTo, assigneeID)
		}
	})

	t.Run("unassigns todo when assigneeID is nil", func(t *testing.T) {
		want := newTodo("Clean up", eventID)
		svc := newTestTodoService(
			&mockTodoRepo{
				AssignFn: func(_ context.Context, _, _ uuid.UUID, aID *uuid.UUID) (*model.Todo, error) {
					if aID != nil {
						t.Errorf("expected nil assigneeID, got %v", aID)
					}
					return want, nil
				},
			},
			memberEventRepo(),
		)

		got, err := svc.AssignTodoToUser(context.Background(), eventID, todoID, callerID, nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.AssignedTo != nil {
			t.Errorf("expected nil AssignedTo, got %v", got.AssignedTo)
		}
	})

	t.Run("returns ErrForbidden when not a member", func(t *testing.T) {
		svc := newTestTodoService(&mockTodoRepo{}, nonMemberEventRepo())

		_, err := svc.AssignTodoToUser(context.Background(), eventID, todoID, uuid.New(), &assigneeID)
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})
}

// ---- ToggleComplete ----

func TestTodoService_ToggleComplete(t *testing.T) {
	eventID := uuid.New()
	todoID := uuid.New()
	userID := uuid.New()
	now := time.Now()

	t.Run("toggles todo to complete when caller is admin", func(t *testing.T) {
		want := newTodo("Decorate", eventID)
		want.CompletedAt = &now
		svc := newTestTodoService(
			&mockTodoRepo{
				ToggleCompleteFn: func(_ context.Context, tid, eid uuid.UUID) (*model.Todo, error) {
					if tid != todoID || eid != eventID {
						t.Error("wrong IDs")
					}
					return want, nil
				},
			},
			// admin bypasses the assignee check, so no GetByID stub needed
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "admin", nil
				},
			},
		)

		got, err := svc.ToggleComplete(context.Background(), eventID, todoID, userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.CompletedAt == nil {
			t.Error("expected CompletedAt to be set")
		}
	})

	t.Run("toggles todo to complete when caller is the assigned member", func(t *testing.T) {
		want := newTodo("Decorate", eventID)
		want.AssignedTo = &userID
		want.CompletedAt = &now
		svc := newTestTodoService(
			&mockTodoRepo{
				GetByIDFn: func(_ context.Context, _, _ uuid.UUID) (*model.Todo, error) {
					existing := newTodo("Decorate", eventID)
					existing.AssignedTo = &userID
					return existing, nil
				},
				ToggleCompleteFn: func(_ context.Context, _, _ uuid.UUID) (*model.Todo, error) {
					return want, nil
				},
			},
			memberEventRepo(),
		)

		got, err := svc.ToggleComplete(context.Background(), eventID, todoID, userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.CompletedAt == nil {
			t.Error("expected CompletedAt to be set")
		}
	})

	t.Run("returns ErrForbidden when member is not the assignee", func(t *testing.T) {
		otherUserID := uuid.New()
		svc := newTestTodoService(
			&mockTodoRepo{
				GetByIDFn: func(_ context.Context, _, _ uuid.UUID) (*model.Todo, error) {
					existing := newTodo("Decorate", eventID)
					existing.AssignedTo = &otherUserID
					return existing, nil
				},
			},
			memberEventRepo(),
		)

		_, err := svc.ToggleComplete(context.Background(), eventID, todoID, userID)
		if !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns ErrNotFound when todo does not exist", func(t *testing.T) {
		svc := newTestTodoService(
			&mockTodoRepo{
				ToggleCompleteFn: func(_ context.Context, _, _ uuid.UUID) (*model.Todo, error) {
					return nil, repository.ErrNotFound
				},
			},
			// use admin so we skip the GetByID check and go straight to ToggleComplete
			&mockEventRepo{
				GetMemberRoleFn: func(_ context.Context, _, _ uuid.UUID) (string, error) {
					return "admin", nil
				},
			},
		)

		_, err := svc.ToggleComplete(context.Background(), eventID, todoID, userID)
		if !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})
}

// ---- DeleteTodo ----

func TestTodoService_DeleteTodo(t *testing.T) {
	eventID := uuid.New()
	todoID := uuid.New()
	userID := uuid.New()

	t.Run("deletes todo when user is member", func(t *testing.T) {
		svc := newTestTodoService(
			&mockTodoRepo{
				DeleteFn: func(_ context.Context, tid, eid uuid.UUID) error {
					if tid != todoID || eid != eventID {
						t.Error("wrong IDs")
					}
					return nil
				},
			},
			memberEventRepo(),
		)

		if err := svc.DeleteTodo(context.Background(), eventID, todoID, userID); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("returns ErrForbidden when not a member", func(t *testing.T) {
		svc := newTestTodoService(&mockTodoRepo{}, nonMemberEventRepo())

		if err := svc.DeleteTodo(context.Background(), eventID, todoID, uuid.New()); !errors.Is(err, ErrForbidden) {
			t.Errorf("got %v; want ErrForbidden", err)
		}
	})

	t.Run("returns ErrNotFound when todo does not exist", func(t *testing.T) {
		svc := newTestTodoService(
			&mockTodoRepo{
				DeleteFn: func(_ context.Context, _, _ uuid.UUID) error {
					return repository.ErrNotFound
				},
			},
			memberEventRepo(),
		)

		if err := svc.DeleteTodo(context.Background(), eventID, todoID, userID); !errors.Is(err, ErrNotFound) {
			t.Errorf("got %v; want ErrNotFound", err)
		}
	})
}
