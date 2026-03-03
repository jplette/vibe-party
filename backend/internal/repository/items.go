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

// ItemRepository handles all DB operations for bring_items.
type ItemRepository struct {
	db *pgxpool.Pool
}

// NewItemRepository creates a new ItemRepository.
func NewItemRepository(db *pgxpool.Pool) *ItemRepository {
	return &ItemRepository{db: db}
}

// ListByEventID returns all bring items for an event.
func (r *ItemRepository) ListByEventID(ctx context.Context, eventID uuid.UUID) ([]model.BringItem, error) {
	const q = `
		SELECT id, event_id, name, quantity, assigned_to, fulfilled_at, created_at, updated_at
		FROM bring_items
		WHERE event_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, q, eventID)
	if err != nil {
		return nil, fmt.Errorf("list bring items: %w", err)
	}
	defer rows.Close()

	var items []model.BringItem
	for rows.Next() {
		item, err := scanItem(rows)
		if err != nil {
			return nil, fmt.Errorf("scan item: %w", err)
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

// Create inserts a new bring item.
func (r *ItemRepository) Create(ctx context.Context, eventID uuid.UUID, name, quantity string) (*model.BringItem, error) {
	const q = `
		INSERT INTO bring_items (event_id, name, quantity)
		VALUES ($1, $2, $3)
		RETURNING id, event_id, name, quantity, assigned_to, fulfilled_at, created_at, updated_at
	`
	var qtyPtr *string
	if quantity != "" {
		qtyPtr = &quantity
	}
	row := r.db.QueryRow(ctx, q, eventID, name, qtyPtr)
	item, err := scanItem(row)
	if err != nil {
		return nil, fmt.Errorf("create bring item: %w", err)
	}
	return item, nil
}

// GetByID fetches a bring item by its ID, scoped to an event.
func (r *ItemRepository) GetByID(ctx context.Context, id, eventID uuid.UUID) (*model.BringItem, error) {
	const q = `
		SELECT id, event_id, name, quantity, assigned_to, fulfilled_at, created_at, updated_at
		FROM bring_items
		WHERE id = $1 AND event_id = $2
	`
	row := r.db.QueryRow(ctx, q, id, eventID)
	item, err := scanItem(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get bring item: %w", err)
	}
	return item, nil
}

// Update modifies an existing bring item's name and quantity.
func (r *ItemRepository) Update(ctx context.Context, id, eventID uuid.UUID, name, quantity string) (*model.BringItem, error) {
	const q = `
		UPDATE bring_items
		SET name       = $3,
		    quantity   = $4,
		    updated_at = NOW()
		WHERE id = $1 AND event_id = $2
		RETURNING id, event_id, name, quantity, assigned_to, fulfilled_at, created_at, updated_at
	`
	var qtyPtr *string
	if quantity != "" {
		qtyPtr = &quantity
	}
	row := r.db.QueryRow(ctx, q, id, eventID, name, qtyPtr)
	item, err := scanItem(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update bring item: %w", err)
	}
	return item, nil
}

// Assign sets the assigned_to field. Pass nil to unassign.
func (r *ItemRepository) Assign(ctx context.Context, id, eventID uuid.UUID, assignedTo *uuid.UUID) (*model.BringItem, error) {
	const q = `
		UPDATE bring_items
		SET assigned_to = $3,
		    updated_at  = NOW()
		WHERE id = $1 AND event_id = $2
		RETURNING id, event_id, name, quantity, assigned_to, fulfilled_at, created_at, updated_at
	`
	row := r.db.QueryRow(ctx, q, id, eventID, assignedTo)
	item, err := scanItem(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("assign bring item: %w", err)
	}
	return item, nil
}

// ToggleFulfill sets fulfilled_at to now if nil, or clears it if already set.
func (r *ItemRepository) ToggleFulfill(ctx context.Context, id, eventID uuid.UUID) (*model.BringItem, error) {
	const q = `
		UPDATE bring_items
		SET fulfilled_at = CASE WHEN fulfilled_at IS NULL THEN NOW() ELSE NULL END,
		    updated_at   = NOW()
		WHERE id = $1 AND event_id = $2
		RETURNING id, event_id, name, quantity, assigned_to, fulfilled_at, created_at, updated_at
	`
	row := r.db.QueryRow(ctx, q, id, eventID)
	item, err := scanItem(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("toggle bring item fulfill: %w", err)
	}
	return item, nil
}

// Delete removes a bring item.
func (r *ItemRepository) Delete(ctx context.Context, id, eventID uuid.UUID) error {
	const q = `DELETE FROM bring_items WHERE id = $1 AND event_id = $2`
	tag, err := r.db.Exec(ctx, q, id, eventID)
	if err != nil {
		return fmt.Errorf("delete bring item: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func scanItem(row interface {
	Scan(dest ...any) error
}) (*model.BringItem, error) {
	item := &model.BringItem{}
	var fulfilledAt *time.Time
	err := row.Scan(
		&item.ID,
		&item.EventID,
		&item.Name,
		&item.Quantity,
		&item.AssignedTo,
		&fulfilledAt,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	item.FulfilledAt = fulfilledAt
	return item, nil
}
