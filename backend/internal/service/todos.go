package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
	"github.com/vibe-party/backend/internal/repository"
)

// TodoService handles business logic for todos.
type TodoService struct {
	todoRepo  todoRepository
	eventRepo eventRepository
}

// NewTodoService creates a new TodoService.
func NewTodoService(todoRepo *repository.TodoRepository, eventRepo *repository.EventRepository) *TodoService {
	return &TodoService{todoRepo: todoRepo, eventRepo: eventRepo}
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

// AssignTodo assigns a todo to a user (or unassigns if userID is nil), requiring membership.
func (s *TodoService) AssignTodo(ctx context.Context, eventID, todoID, callerID uuid.UUID, assigneeID *uuid.UUID) (*model.Todo, error) {
	if err := s.requireMembership(ctx, eventID, callerID); err != nil {
		return nil, err
	}
	todo, err := s.todoRepo.Assign(ctx, todoID, eventID, assigneeID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("assign todo: %w", err)
	}
	return todo, nil
}

// ToggleComplete toggles the completion status of a todo, requiring membership.
func (s *TodoService) ToggleComplete(ctx context.Context, eventID, todoID, userID uuid.UUID) (*model.Todo, error) {
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return nil, err
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
