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

// UserRepository handles all DB operations for users.
type UserRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository creates a new UserRepository.
func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

// UpsertByKeycloakID creates or updates a user record by their Keycloak subject ID.
// This is called on every authenticated request to keep the local record in sync.
func (r *UserRepository) UpsertByKeycloakID(ctx context.Context, keycloakID, email, name string) (*model.User, error) {
	const q = `
		INSERT INTO users (keycloak_id, email, name, global_role)
		VALUES ($1, $2, $3, 'user')
		ON CONFLICT (keycloak_id) DO UPDATE
			SET email      = EXCLUDED.email,
			    name       = EXCLUDED.name,
			    updated_at = NOW()
		RETURNING id, keycloak_id, email, name, global_role, created_at, updated_at
	`
	row := r.db.QueryRow(ctx, q, keycloakID, email, name)
	return scanUser(row)
}

// GetByID fetches a user by their internal UUID.
func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	const q = `
		SELECT id, keycloak_id, email, name, global_role, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	row := r.db.QueryRow(ctx, q, id)
	u, err := scanUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return u, nil
}

// GetByKeycloakID fetches a user by their Keycloak subject ID.
func (r *UserRepository) GetByKeycloakID(ctx context.Context, keycloakID string) (*model.User, error) {
	const q = `
		SELECT id, keycloak_id, email, name, global_role, created_at, updated_at
		FROM users
		WHERE keycloak_id = $1
	`
	row := r.db.QueryRow(ctx, q, keycloakID)
	u, err := scanUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get user by keycloak id: %w", err)
	}
	return u, nil
}

func scanUser(row pgx.Row) (*model.User, error) {
	u := &model.User{}
	var updatedAt time.Time
	err := row.Scan(
		&u.ID,
		&u.KeycloakID,
		&u.Email,
		&u.Name,
		&u.GlobalRole,
		&u.CreatedAt,
		&updatedAt,
	)
	if err != nil {
		return nil, err
	}
	u.UpdatedAt = updatedAt
	return u, nil
}
