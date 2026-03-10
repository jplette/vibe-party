package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/vibe-party/backend/internal/model"
)

// TodoRepository handles all DB operations for todos.
type TodoRepository struct {
	db *pgxpool.Pool
}

// NewTodoRepository creates a new TodoRepository.
func NewTodoRepository(db *pgxpool.Pool) *TodoRepository {
	return &TodoRepository{db: db}
}

// ListByEventID returns all todos for an event, ordered by creation time.
func (r *TodoRepository) ListByEventID(ctx context.Context, eventID uuid.UUID) ([]model.Todo, error) {
	const q = `
		SELECT id, event_id, title, description, assigned_to, assigned_invitation_id, due_date, completed_at, created_at, updated_at
		FROM todos
		WHERE event_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, q, eventID)
	if err != nil {
		return nil, fmt.Errorf("list todos: %w", err)
	}
	defer rows.Close()

	var todos []model.Todo
	for rows.Next() {
		t, err := scanTodo(rows)
		if err != nil {
			return nil, fmt.Errorf("scan todo: %w", err)
		}
		todos = append(todos, *t)
	}
	return todos, rows.Err()
}

// Create inserts a new todo.
func (r *TodoRepository) Create(ctx context.Context, eventID uuid.UUID, title, description string) (*model.Todo, error) {
	const q = `
		INSERT INTO todos (event_id, title, description)
		VALUES ($1, $2, $3)
		RETURNING id, event_id, title, description, assigned_to, assigned_invitation_id, due_date, completed_at, created_at, updated_at
	`
	var descPtr *string
	if description != "" {
		descPtr = &description
	}
	row := r.db.QueryRow(ctx, q, eventID, title, descPtr)
	t, err := scanTodo(row)
	if err != nil {
		return nil, fmt.Errorf("create todo: %w", err)
	}
	return t, nil
}

// GetByID fetches a todo by its ID, ensuring it belongs to the given event.
func (r *TodoRepository) GetByID(ctx context.Context, id, eventID uuid.UUID) (*model.Todo, error) {
	const q = `
		SELECT id, event_id, title, description, assigned_to, assigned_invitation_id, due_date, completed_at, created_at, updated_at
		FROM todos
		WHERE id = $1 AND event_id = $2
	`
	row := r.db.QueryRow(ctx, q, id, eventID)
	t, err := scanTodo(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get todo: %w", err)
	}
	return t, nil
}

// Update modifies an existing todo's title and description.
func (r *TodoRepository) Update(ctx context.Context, id, eventID uuid.UUID, title, description string) (*model.Todo, error) {
	const q = `
		UPDATE todos
		SET title       = $3,
		    description = $4,
		    updated_at  = NOW()
		WHERE id = $1 AND event_id = $2
		RETURNING id, event_id, title, description, assigned_to, assigned_invitation_id, due_date, completed_at, created_at, updated_at
	`
	var descPtr *string
	if description != "" {
		descPtr = &description
	}
	row := r.db.QueryRow(ctx, q, id, eventID, title, descPtr)
	t, err := scanTodo(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update todo: %w", err)
	}
	return t, nil
}

// Assign sets the assigned_to field and clears assigned_invitation_id. Pass nil to unassign.
func (r *TodoRepository) Assign(ctx context.Context, id, eventID uuid.UUID, assignedTo *uuid.UUID) (*model.Todo, error) {
	const q = `
		UPDATE todos
		SET assigned_to           = $3,
		    assigned_invitation_id = NULL,
		    updated_at             = NOW()
		WHERE id = $1 AND event_id = $2
		RETURNING id, event_id, title, description, assigned_to, assigned_invitation_id, due_date, completed_at, created_at, updated_at
	`
	row := r.db.QueryRow(ctx, q, id, eventID, assignedTo)
	t, err := scanTodo(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("assign todo: %w", err)
	}
	return t, nil
}

// AssignToInvitation sets the assigned_invitation_id and clears assigned_to.
func (r *TodoRepository) AssignToInvitation(ctx context.Context, id, eventID, invitationID uuid.UUID) (*model.Todo, error) {
	const q = `
		UPDATE todos
		SET assigned_invitation_id = $3,
		    assigned_to             = NULL,
		    updated_at              = NOW()
		WHERE id = $1 AND event_id = $2
		RETURNING id, event_id, title, description, assigned_to, assigned_invitation_id, due_date, completed_at, created_at, updated_at
	`
	row := r.db.QueryRow(ctx, q, id, eventID, invitationID)
	t, err := scanTodo(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("assign todo to invitation: %w", err)
	}
	return t, nil
}

// SetDueDate updates the due_date field of a todo.
func (r *TodoRepository) SetDueDate(ctx context.Context, id, eventID uuid.UUID, dueDate *time.Time) (*model.Todo, error) {
	const q = `
		UPDATE todos
		SET due_date   = $3,
		    updated_at = NOW()
		WHERE id = $1 AND event_id = $2
		RETURNING id, event_id, title, description, assigned_to, assigned_invitation_id, due_date, completed_at, created_at, updated_at
	`
	row := r.db.QueryRow(ctx, q, id, eventID, dueDate)
	t, err := scanTodo(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("set due date: %w", err)
	}
	return t, nil
}

// TransferInvitationAssignment bulk-updates todos assigned to an invitation,
// setting assigned_to = userID and clearing assigned_invitation_id.
func (r *TodoRepository) TransferInvitationAssignment(ctx context.Context, invitationID, userID uuid.UUID) error {
	const q = `
		UPDATE todos
		SET assigned_to             = $2,
		    assigned_invitation_id  = NULL,
		    updated_at              = NOW()
		WHERE assigned_invitation_id = $1
	`
	_, err := r.db.Exec(ctx, q, invitationID, userID)
	if err != nil {
		return fmt.Errorf("transfer invitation assignment: %w", err)
	}
	return nil
}

// ToggleComplete sets completed_at to now if nil, or clears it if already set.
func (r *TodoRepository) ToggleComplete(ctx context.Context, id, eventID uuid.UUID) (*model.Todo, error) {
	const q = `
		UPDATE todos
		SET completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE NULL END,
		    updated_at   = NOW()
		WHERE id = $1 AND event_id = $2
		RETURNING id, event_id, title, description, assigned_to, assigned_invitation_id, due_date, completed_at, created_at, updated_at
	`
	row := r.db.QueryRow(ctx, q, id, eventID)
	t, err := scanTodo(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("toggle todo complete: %w", err)
	}
	return t, nil
}

// Delete removes a todo.
func (r *TodoRepository) Delete(ctx context.Context, id, eventID uuid.UUID) error {
	const q = `DELETE FROM todos WHERE id = $1 AND event_id = $2`
	tag, err := r.db.Exec(ctx, q, id, eventID)
	if err != nil {
		return fmt.Errorf("delete todo: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func scanTodo(row interface {
	Scan(dest ...any) error
}) (*model.Todo, error) {
	t := &model.Todo{}
	err := row.Scan(
		&t.ID,
		&t.EventID,
		&t.Title,
		&t.Description,
		&t.AssignedTo,
		&t.AssignedInvitationID,
		&t.DueDate,
		&t.CompletedAt,
		&t.CreatedAt,
		&t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return t, nil
}
