package model

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered user synced from Keycloak.
type User struct {
	ID         uuid.UUID `json:"id"`
	KeycloakID string    `json:"keycloakId"`
	Email      string    `json:"email"`
	Name       string    `json:"name"`
	GlobalRole string    `json:"globalRole"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// Event represents a party or gathering.
type Event struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	Date        *time.Time `json:"date,omitempty"`
	EndDate     *time.Time `json:"endDate,omitempty"`
	LocationName    *string `json:"locationName,omitempty"`
	LocationStreet  *string `json:"locationStreet,omitempty"`
	LocationCity    *string `json:"locationCity,omitempty"`
	LocationZip     *string `json:"locationZip,omitempty"`
	LocationCountry *string `json:"locationCountry,omitempty"`
	CreatedBy   uuid.UUID  `json:"createdBy"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// EventMember represents a user's membership in an event.
type EventMember struct {
	EventID   uuid.UUID `json:"eventId"`
	UserID    uuid.UUID `json:"userId"`
	Role      string    `json:"role"` // "admin" or "member"
	CreatedAt time.Time `json:"createdAt"`
}

// EventMemberWithUser embeds EventMember and includes the member's user details.
type EventMemberWithUser struct {
	EventID uuid.UUID  `json:"eventId"`
	UserID  uuid.UUID  `json:"userId"`
	Role    string     `json:"role"`
	User    *UserBrief `json:"user,omitempty"`
}

// UserBrief is the subset of user fields returned inside member lists.
type UserBrief struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
	Name  string    `json:"name"`
}

// EventWithRole combines an event with the current user's role.
type EventWithRole struct {
	Event
	Role string `json:"role"`
}

// Todo represents a task within an event.
type Todo struct {
	ID          uuid.UUID  `json:"id"`
	EventID     uuid.UUID  `json:"eventId"`
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	AssignedTo  *uuid.UUID `json:"assignedTo,omitempty"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// BringItem represents something a member should bring to the event.
type BringItem struct {
	ID          uuid.UUID  `json:"id"`
	EventID     uuid.UUID  `json:"eventId"`
	Name        string     `json:"name"`
	Quantity    *string    `json:"quantity,omitempty"`
	AssignedTo  *uuid.UUID `json:"assignedTo,omitempty"`
	FulfilledAt *time.Time `json:"fulfilledAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// Invitation represents an email invitation to join an event.
type Invitation struct {
	ID        uuid.UUID `json:"id"`
	EventID   uuid.UUID `json:"eventId"`
	Email     string    `json:"email"`
	Token     string    `json:"token"`
	Status    string    `json:"status"` // "pending", "accepted", "declined"
	InvitedBy uuid.UUID `json:"invitedBy"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// InvitationResponse is the API-safe view of an Invitation — the Token field is omitted.
type InvitationResponse struct {
	ID        uuid.UUID `json:"id"`
	EventID   uuid.UUID `json:"eventId"`
	Email     string    `json:"email"`
	Status    string    `json:"status"`
	InvitedBy uuid.UUID `json:"invitedBy"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// ToResponse converts an Invitation to its API-safe representation.
func (inv *Invitation) ToResponse() InvitationResponse {
	return InvitationResponse{
		ID:        inv.ID,
		EventID:   inv.EventID,
		Email:     inv.Email,
		Status:    inv.Status,
		InvitedBy: inv.InvitedBy,
		CreatedAt: inv.CreatedAt,
		UpdatedAt: inv.UpdatedAt,
	}
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
