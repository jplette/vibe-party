package model

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered user synced from Keycloak.
type User struct {
	ID         uuid.UUID `json:"id"`
	KeycloakID string    `json:"keycloak_id"`
	Email      string    `json:"email"`
	Name       string    `json:"name"`
	GlobalRole string    `json:"global_role"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Event represents a party or gathering.
type Event struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	Date        *time.Time `json:"date,omitempty"`
	Location    *string    `json:"location,omitempty"`
	CreatedBy   uuid.UUID  `json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// EventMember represents a user's membership in an event.
type EventMember struct {
	EventID   uuid.UUID `json:"event_id"`
	UserID    uuid.UUID `json:"user_id"`
	Role      string    `json:"role"` // "admin" or "member"
	CreatedAt time.Time `json:"created_at"`
}

// EventWithRole combines an event with the current user's role.
type EventWithRole struct {
	Event
	Role string `json:"role"`
}

// Todo represents a task within an event.
type Todo struct {
	ID          uuid.UUID  `json:"id"`
	EventID     uuid.UUID  `json:"event_id"`
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	AssignedTo  *uuid.UUID `json:"assigned_to,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// BringItem represents something a member should bring to the event.
type BringItem struct {
	ID          uuid.UUID  `json:"id"`
	EventID     uuid.UUID  `json:"event_id"`
	Name        string     `json:"name"`
	Quantity    *string    `json:"quantity,omitempty"`
	AssignedTo  *uuid.UUID `json:"assigned_to,omitempty"`
	FulfilledAt *time.Time `json:"fulfilled_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Invitation represents an email invitation to join an event.
type Invitation struct {
	ID        uuid.UUID `json:"id"`
	EventID   uuid.UUID `json:"event_id"`
	Email     string    `json:"email"`
	Token     string    `json:"token"`
	Status    string    `json:"status"` // "pending", "accepted", "declined"
	InvitedBy uuid.UUID `json:"invited_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ContextKey is a typed key for context values to avoid collisions.
type ContextKey string

const (
	ContextKeyUser      ContextKey = "user"
	ContextKeyRequestID ContextKey = "request_id"
)

// ClaimsUser holds parsed JWT claims for the authenticated user.
type ClaimsUser struct {
	KeycloakID string
	Email      string
	Name       string
	Roles      []string
}
