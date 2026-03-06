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

// EventRepository handles all DB operations for events and event_members.
type EventRepository struct {
	db *pgxpool.Pool
}

// NewEventRepository creates a new EventRepository.
func NewEventRepository(db *pgxpool.Pool) *EventRepository {
	return &EventRepository{db: db}
}

// ListByUserID returns all events where the user is a member, along with their role.
func (r *EventRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]model.EventWithRole, error) {
	const q = `
		SELECT e.id, e.name, e.description, e.date, e.end_date,
		       e.location_name, e.location_street, e.location_city, e.location_zip, e.location_country,
		       e.created_by, e.created_at, e.updated_at, em.role
		FROM events e
		JOIN event_members em ON em.event_id = e.id
		WHERE em.user_id = $1
		ORDER BY e.created_at DESC
	`
	rows, err := r.db.Query(ctx, q, userID)
	if err != nil {
		return nil, fmt.Errorf("list events by user: %w", err)
	}
	defer rows.Close()

	var events []model.EventWithRole
	for rows.Next() {
		var e model.EventWithRole
		if err := scanEventWithRole(rows, &e); err != nil {
			return nil, fmt.Errorf("scan event: %w", err)
		}
		events = append(events, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return events, nil
}

// Create inserts a new event and adds the creator as an admin member in a transaction.
func (r *EventRepository) Create(ctx context.Context, name, description, locationName, locationStreet, locationCity, locationZip, locationCountry string, date, endDate *string, createdBy uuid.UUID) (*model.Event, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	const insertEvent = `
		INSERT INTO events (name, description, date, end_date, location_name, location_street, location_city, location_zip, location_country, created_by)
		VALUES ($1, $2, $3::TIMESTAMPTZ, $4::TIMESTAMPTZ, $5, $6, $7, $8, $9, $10)
		RETURNING id, name, description, date, end_date, location_name, location_street, location_city, location_zip, location_country, created_by, created_at, updated_at
	`

	var descPtr *string
	if description != "" {
		descPtr = &description
	}

	row := tx.QueryRow(ctx, insertEvent, name, descPtr, nilIfEmpty(date), nilIfEmpty(endDate),
		nilIfEmptyStr(locationName), nilIfEmptyStr(locationStreet), nilIfEmptyStr(locationCity),
		nilIfEmptyStr(locationZip), nilIfEmptyStr(locationCountry), createdBy)
	e, err := scanEvent(row)
	if err != nil {
		return nil, fmt.Errorf("insert event: %w", err)
	}

	const insertMember = `
		INSERT INTO event_members (event_id, user_id, role)
		VALUES ($1, $2, 'admin')
	`
	if _, err := tx.Exec(ctx, insertMember, e.ID, createdBy); err != nil {
		return nil, fmt.Errorf("insert event member: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return e, nil
}

// GetByID fetches an event by ID.
func (r *EventRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Event, error) {
	const q = `
		SELECT id, name, description, date, end_date, location_name, location_street, location_city, location_zip, location_country, created_by, created_at, updated_at
		FROM events
		WHERE id = $1
	`
	row := r.db.QueryRow(ctx, q, id)
	e, err := scanEvent(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get event by id: %w", err)
	}
	return e, nil
}

// Update modifies an existing event's fields.
func (r *EventRepository) Update(ctx context.Context, id uuid.UUID, name, description, locationName, locationStreet, locationCity, locationZip, locationCountry string, date, endDate *string) (*model.Event, error) {
	const q = `
		UPDATE events
		SET name             = $2,
		    description      = $3,
		    date             = $4::TIMESTAMPTZ,
		    end_date         = $5::TIMESTAMPTZ,
		    location_name    = $6,
		    location_street  = $7,
		    location_city    = $8,
		    location_zip     = $9,
		    location_country = $10,
		    updated_at       = NOW()
		WHERE id = $1
		RETURNING id, name, description, date, end_date, location_name, location_street, location_city, location_zip, location_country, created_by, created_at, updated_at
	`
	var descPtr *string
	if description != "" {
		descPtr = &description
	}

	row := r.db.QueryRow(ctx, q, id, name, descPtr, nilIfEmpty(date), nilIfEmpty(endDate),
		nilIfEmptyStr(locationName), nilIfEmptyStr(locationStreet), nilIfEmptyStr(locationCity),
		nilIfEmptyStr(locationZip), nilIfEmptyStr(locationCountry))
	e, err := scanEvent(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update event: %w", err)
	}
	return e, nil
}

// Delete removes an event by ID.
func (r *EventRepository) Delete(ctx context.Context, id uuid.UUID) error {
	const q = `DELETE FROM events WHERE id = $1`
	tag, err := r.db.Exec(ctx, q, id)
	if err != nil {
		return fmt.Errorf("delete event: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// GetMemberRole returns the role of a user in an event, or ErrNotFound if not a member.
func (r *EventRepository) GetMemberRole(ctx context.Context, eventID, userID uuid.UUID) (string, error) {
	const q = `SELECT role FROM event_members WHERE event_id = $1 AND user_id = $2`
	var role string
	err := r.db.QueryRow(ctx, q, eventID, userID).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrNotFound
		}
		return "", fmt.Errorf("get member role: %w", err)
	}
	return role, nil
}

// AddMember adds a user as a member of an event. Used when accepting an invitation.
func (r *EventRepository) AddMember(ctx context.Context, eventID, userID uuid.UUID, role string) error {
	const q = `
		INSERT INTO event_members (event_id, user_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (event_id, user_id) DO NOTHING
	`
	_, err := r.db.Exec(ctx, q, eventID, userID, role)
	if err != nil {
		return fmt.Errorf("add event member: %w", err)
	}
	return nil
}

// ListMembers returns all members of an event with their user details.
func (r *EventRepository) ListMembers(ctx context.Context, eventID uuid.UUID) ([]model.EventMemberWithUser, error) {
	const q = `
		SELECT em.event_id, em.user_id, em.role, u.id, u.email, u.name
		FROM event_members em
		JOIN users u ON u.id = em.user_id
		WHERE em.event_id = $1
		ORDER BY em.created_at ASC
	`
	rows, err := r.db.Query(ctx, q, eventID)
	if err != nil {
		return nil, fmt.Errorf("list event members: %w", err)
	}
	defer rows.Close()

	var members []model.EventMemberWithUser
	for rows.Next() {
		var m model.EventMemberWithUser
		u := &model.UserBrief{}
		if err := rows.Scan(&m.EventID, &m.UserID, &m.Role, &u.ID, &u.Email, &u.Name); err != nil {
			return nil, fmt.Errorf("scan member: %w", err)
		}
		m.User = u
		members = append(members, m)
	}
	return members, rows.Err()
}

// SharesEventMembership reports whether userA and userB are both members of at least one common event.
func (r *EventRepository) SharesEventMembership(ctx context.Context, userAID, userBID uuid.UUID) (bool, error) {
	const q = `
		SELECT EXISTS (
			SELECT 1
			FROM event_members a
			JOIN event_members b ON b.event_id = a.event_id
			WHERE a.user_id = $1 AND b.user_id = $2
		)
	`
	var exists bool
	if err := r.db.QueryRow(ctx, q, userAID, userBID).Scan(&exists); err != nil {
		return false, fmt.Errorf("shares event membership: %w", err)
	}
	return exists, nil
}

func scanEvent(row pgx.Row) (*model.Event, error) {
	e := &model.Event{}
	err := row.Scan(
		&e.ID,
		&e.Name,
		&e.Description,
		&e.Date,
		&e.EndDate,
		&e.LocationName,
		&e.LocationStreet,
		&e.LocationCity,
		&e.LocationZip,
		&e.LocationCountry,
		&e.CreatedBy,
		&e.CreatedAt,
		&e.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return e, nil
}

func scanEventWithRole(rows pgx.Rows, e *model.EventWithRole) error {
	return rows.Scan(
		&e.ID,
		&e.Name,
		&e.Description,
		&e.Date,
		&e.EndDate,
		&e.LocationName,
		&e.LocationStreet,
		&e.LocationCity,
		&e.LocationZip,
		&e.LocationCountry,
		&e.CreatedBy,
		&e.CreatedAt,
		&e.UpdatedAt,
		&e.Role,
	)
}

// nilIfEmptyStr returns nil for an empty string, allowing SQL NULL insertion.
func nilIfEmptyStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// nilIfEmpty returns nil for a pointer to an empty string, allowing SQL NULL insertion.
func nilIfEmpty(s *string) *string {
	if s == nil || *s == "" {
		return nil
	}
	return s
}
