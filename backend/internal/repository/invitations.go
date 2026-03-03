package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/vibe-party/backend/internal/model"
)

// InvitationRepository handles all DB operations for invitations.
type InvitationRepository struct {
	db *pgxpool.Pool
}

// NewInvitationRepository creates a new InvitationRepository.
func NewInvitationRepository(db *pgxpool.Pool) *InvitationRepository {
	return &InvitationRepository{db: db}
}

// Create inserts a new invitation record.
func (r *InvitationRepository) Create(ctx context.Context, eventID uuid.UUID, email, token string, invitedBy uuid.UUID) (*model.Invitation, error) {
	const q = `
		INSERT INTO invitations (event_id, email, token, invited_by)
		VALUES ($1, $2, $3, $4)
		RETURNING id, event_id, email, token, status, invited_by, created_at, updated_at
	`
	row := r.db.QueryRow(ctx, q, eventID, email, token, invitedBy)
	inv, err := scanInvitation(row)
	if err != nil {
		return nil, fmt.Errorf("create invitation: %w", err)
	}
	return inv, nil
}

// ListByEventID returns all invitations for an event.
func (r *InvitationRepository) ListByEventID(ctx context.Context, eventID uuid.UUID) ([]model.Invitation, error) {
	const q = `
		SELECT id, event_id, email, token, status, invited_by, created_at, updated_at
		FROM invitations
		WHERE event_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, q, eventID)
	if err != nil {
		return nil, fmt.Errorf("list invitations: %w", err)
	}
	defer rows.Close()

	var invs []model.Invitation
	for rows.Next() {
		inv, err := scanInvitation(rows)
		if err != nil {
			return nil, fmt.Errorf("scan invitation: %w", err)
		}
		invs = append(invs, *inv)
	}
	return invs, rows.Err()
}

// GetByToken fetches an invitation by its unique token.
func (r *InvitationRepository) GetByToken(ctx context.Context, token string) (*model.Invitation, error) {
	const q = `
		SELECT id, event_id, email, token, status, invited_by, created_at, updated_at
		FROM invitations
		WHERE token = $1
	`
	row := r.db.QueryRow(ctx, q, token)
	inv, err := scanInvitation(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get invitation by token: %w", err)
	}
	return inv, nil
}

// GetByID fetches an invitation by its ID.
func (r *InvitationRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Invitation, error) {
	const q = `
		SELECT id, event_id, email, token, status, invited_by, created_at, updated_at
		FROM invitations
		WHERE id = $1
	`
	row := r.db.QueryRow(ctx, q, id)
	inv, err := scanInvitation(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get invitation by id: %w", err)
	}
	return inv, nil
}

// ListAcceptedByEmail returns all accepted invitations for a given email address.
// Used to claim memberships when a user logs in for the first time after accepting.
func (r *InvitationRepository) ListAcceptedByEmail(ctx context.Context, email string) ([]model.Invitation, error) {
	const q = `
		SELECT id, event_id, email, token, status, invited_by, created_at, updated_at
		FROM invitations
		WHERE email = $1 AND status = 'accepted'
	`
	rows, err := r.db.Query(ctx, q, email)
	if err != nil {
		return nil, fmt.Errorf("list accepted invitations by email: %w", err)
	}
	defer rows.Close()

	var invs []model.Invitation
	for rows.Next() {
		inv, err := scanInvitation(rows)
		if err != nil {
			return nil, fmt.Errorf("scan invitation: %w", err)
		}
		invs = append(invs, *inv)
	}
	return invs, rows.Err()
}

// UpdateStatus changes the status of an invitation.
func (r *InvitationRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	const q = `
		UPDATE invitations
		SET status     = $2,
		    updated_at = NOW()
		WHERE id = $1
	`
	tag, err := r.db.Exec(ctx, q, id, status)
	if err != nil {
		return fmt.Errorf("update invitation status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// Delete removes an invitation.
func (r *InvitationRepository) Delete(ctx context.Context, id, eventID uuid.UUID) error {
	const q = `DELETE FROM invitations WHERE id = $1 AND event_id = $2`
	tag, err := r.db.Exec(ctx, q, id, eventID)
	if err != nil {
		return fmt.Errorf("delete invitation: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func scanInvitation(row interface {
	Scan(dest ...any) error
}) (*model.Invitation, error) {
	inv := &model.Invitation{}
	err := row.Scan(
		&inv.ID,
		&inv.EventID,
		&inv.Email,
		&inv.Token,
		&inv.Status,
		&inv.InvitedBy,
		&inv.CreatedAt,
		&inv.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return inv, nil
}
