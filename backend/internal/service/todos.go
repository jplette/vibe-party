package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
	"github.com/vibe-party/backend/internal/repository"
)

// TodoService handles business logic for todos.
type TodoService struct {
	todoRepo  todoRepository
	eventRepo eventRepository
	invRepo   invitationRepository
	userRepo  userRepository
	emailSvc  emailSender
}

// NewTodoService creates a new TodoService.
func NewTodoService(
	todoRepo *repository.TodoRepository,
	eventRepo *repository.EventRepository,
	invRepo *repository.InvitationRepository,
	userRepo *repository.UserRepository,
	emailSvc emailSender,
) *TodoService {
	return &TodoService{
		todoRepo:  todoRepo,
		eventRepo: eventRepo,
		invRepo:   invRepo,
		userRepo:  userRepo,
		emailSvc:  emailSvc,
	}
}

// ListTodos returns all todos for an event, requiring membership.
func (s *TodoService) ListTodos(ctx context.Context, eventID, userID uuid.UUID) ([]model.Todo, error) {
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return nil, err
	}
	todos, err := s.todoRepo.ListByEventID(ctx, eventID)
	if err != nil {
		return nil, fmt.Errorf("list todos: %w", err)
	}
	if todos == nil {
		todos = []model.Todo{}
	}
	return todos, nil
}

// CreateTodo creates a new todo, requiring membership.
func (s *TodoService) CreateTodo(ctx context.Context, eventID, userID uuid.UUID, title, description string) (*model.Todo, error) {
	if title == "" {
		return nil, fmt.Errorf("%w: title is required", ErrInvalidInput)
	}
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return nil, err
	}
	todo, err := s.todoRepo.Create(ctx, eventID, title, description)
	if err != nil {
		return nil, fmt.Errorf("create todo: %w", err)
	}
	return todo, nil
}

// UpdateTodo updates a todo, requiring membership.
func (s *TodoService) UpdateTodo(ctx context.Context, eventID, todoID, userID uuid.UUID, title, description string) (*model.Todo, error) {
	if title == "" {
		return nil, fmt.Errorf("%w: title is required", ErrInvalidInput)
	}
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return nil, err
	}
	todo, err := s.todoRepo.Update(ctx, todoID, eventID, title, description)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update todo: %w", err)
	}
	return todo, nil
}

// AssignTodoToUser assigns a todo to a user (or unassigns if assigneeID is nil), requiring membership.
func (s *TodoService) AssignTodoToUser(ctx context.Context, eventID, todoID, callerID uuid.UUID, assigneeID *uuid.UUID) (*model.Todo, error) {
	if err := s.requireMembership(ctx, eventID, callerID); err != nil {
		return nil, err
	}

	if assigneeID != nil {
		if err := s.requireMembership(ctx, eventID, *assigneeID); err != nil {
			return nil, fmt.Errorf("%w: assignee is not a member of this event", ErrInvalidInput)
		}
	}

	todo, err := s.todoRepo.Assign(ctx, todoID, eventID, assigneeID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("assign todo: %w", err)
	}

	if assigneeID != nil {
		assignee := *assigneeID
		event, eventErr := s.eventRepo.GetByID(ctx, eventID)
		if eventErr == nil {
			go func() {
				user, userErr := s.userRepo.GetByID(context.Background(), assignee)
				if userErr != nil {
					slog.Error("failed to get assignee for email", slog.String("error", userErr.Error()))
					return
				}
				if sendErr := s.emailSvc.SendTodoAssignment(user.Email, event.Name, todo.Title); sendErr != nil {
					slog.Error("failed to send todo assignment email", slog.String("error", sendErr.Error()), slog.String("recipient", user.Email))
				}
			}()
		}
	}

	return todo, nil
}

// AssignTodoToInvitation assigns a todo to a pending invitation, requiring membership.
func (s *TodoService) AssignTodoToInvitation(ctx context.Context, eventID, todoID, callerID, invitationID uuid.UUID) (*model.Todo, error) {
	if err := s.requireMembership(ctx, eventID, callerID); err != nil {
		return nil, err
	}

	inv, err := s.invRepo.GetByID(ctx, invitationID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, fmt.Errorf("%w: invitation not found", ErrInvalidInput)
		}
		return nil, fmt.Errorf("get invitation: %w", err)
	}

	if inv.EventID != eventID {
		return nil, fmt.Errorf("%w: invitation does not belong to this event", ErrInvalidInput)
	}

	if inv.Status != "pending" {
		return nil, fmt.Errorf("%w: invitation is not pending", ErrInvalidInput)
	}

	todo, err := s.todoRepo.AssignToInvitation(ctx, todoID, eventID, invitationID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("assign todo to invitation: %w", err)
	}

	event, eventErr := s.eventRepo.GetByID(ctx, eventID)
	if eventErr == nil {
		recipientEmail := inv.Email
		eventName := event.Name
		todoTitle := todo.Title
		go func() {
			if sendErr := s.emailSvc.SendTodoAssignment(recipientEmail, eventName, todoTitle); sendErr != nil {
				slog.Error("failed to send todo assignment email", slog.String("error", sendErr.Error()), slog.String("recipient", recipientEmail))
			}
		}()
	}

	return todo, nil
}

// SetTodoDueDate sets or clears the due date of a todo, requiring membership.
func (s *TodoService) SetTodoDueDate(ctx context.Context, eventID, todoID, callerID uuid.UUID, dueDate *time.Time) (*model.Todo, error) {
	if err := s.requireMembership(ctx, eventID, callerID); err != nil {
		return nil, err
	}

	todo, err := s.todoRepo.SetDueDate(ctx, todoID, eventID, dueDate)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("set due date: %w", err)
	}
	return todo, nil
}

// ToggleComplete toggles the completion status of a todo.
// Only the event admin or the todo's assigned user may toggle.
func (s *TodoService) ToggleComplete(ctx context.Context, eventID, todoID, userID uuid.UUID) (*model.Todo, error) {
	role, err := s.eventRepo.GetMemberRole(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrForbidden
		}
		return nil, fmt.Errorf("check membership: %w", err)
	}

	if role != "admin" {
		existing, err := s.todoRepo.GetByID(ctx, todoID, eventID)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				return nil, ErrNotFound
			}
			return nil, fmt.Errorf("get todo: %w", err)
		}
		if existing.AssignedTo == nil || *existing.AssignedTo != userID {
			return nil, ErrForbidden
		}
	}

	todo, err := s.todoRepo.ToggleComplete(ctx, todoID, eventID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("toggle todo: %w", err)
	}
	return todo, nil
}

// DeleteTodo deletes a todo, requiring membership.
func (s *TodoService) DeleteTodo(ctx context.Context, eventID, todoID, userID uuid.UUID) error {
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return err
	}
	if err := s.todoRepo.Delete(ctx, todoID, eventID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("delete todo: %w", err)
	}
	return nil
}

func (s *TodoService) requireMembership(ctx context.Context, eventID, userID uuid.UUID) error {
	_, err := s.eventRepo.GetMemberRole(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrForbidden
		}
		return fmt.Errorf("check membership: %w", err)
	}
	return nil
}
