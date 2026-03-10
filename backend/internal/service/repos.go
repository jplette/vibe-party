package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
)

// eventRepository is the subset of repository.EventRepository used by services.
// Defining the interface here (consumer side) keeps the repository package free
// of import cycles and allows test doubles to be injected.
type eventRepository interface {
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]model.EventWithRole, error)
	Create(ctx context.Context, name, description, locationName, locationStreet, locationCity, locationZip, locationCountry string, date, endDate *string, createdBy uuid.UUID) (*model.Event, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.Event, error)
	Update(ctx context.Context, id uuid.UUID, name, description, locationName, locationStreet, locationCity, locationZip, locationCountry string, date, endDate *string) (*model.Event, error)
	Delete(ctx context.Context, id uuid.UUID) error
	GetMemberRole(ctx context.Context, eventID, userID uuid.UUID) (string, error)
	AddMember(ctx context.Context, eventID, userID uuid.UUID, role string) error
	ListMembers(ctx context.Context, eventID uuid.UUID) ([]model.EventMemberWithUser, error)
	SharesEventMembership(ctx context.Context, userAID, userBID uuid.UUID) (bool, error)
}

// todoRepository is the subset of repository.TodoRepository used by TodoService.
type todoRepository interface {
	ListByEventID(ctx context.Context, eventID uuid.UUID) ([]model.Todo, error)
	Create(ctx context.Context, eventID uuid.UUID, title, description string) (*model.Todo, error)
	GetByID(ctx context.Context, todoID, eventID uuid.UUID) (*model.Todo, error)
	Update(ctx context.Context, todoID, eventID uuid.UUID, title, description string) (*model.Todo, error)
	Assign(ctx context.Context, todoID, eventID uuid.UUID, assigneeID *uuid.UUID) (*model.Todo, error)
	AssignToInvitation(ctx context.Context, todoID, eventID, invitationID uuid.UUID) (*model.Todo, error)
	SetDueDate(ctx context.Context, todoID, eventID uuid.UUID, dueDate *time.Time) (*model.Todo, error)
	TransferInvitationAssignment(ctx context.Context, invitationID, userID uuid.UUID) error
	ToggleComplete(ctx context.Context, todoID, eventID uuid.UUID) (*model.Todo, error)
	Delete(ctx context.Context, todoID, eventID uuid.UUID) error
}

// itemRepository is the subset of repository.ItemRepository used by ItemService.
type itemRepository interface {
	ListByEventID(ctx context.Context, eventID uuid.UUID) ([]model.BringItem, error)
	Create(ctx context.Context, eventID uuid.UUID, name, quantity string) (*model.BringItem, error)
	Update(ctx context.Context, itemID, eventID uuid.UUID, name, quantity string) (*model.BringItem, error)
	Assign(ctx context.Context, itemID, eventID uuid.UUID, assigneeID *uuid.UUID) (*model.BringItem, error)
	ToggleFulfill(ctx context.Context, itemID, eventID uuid.UUID) (*model.BringItem, error)
	Delete(ctx context.Context, itemID, eventID uuid.UUID) error
}

// invitationRepository is the subset of repository.InvitationRepository used by InvitationService.
type invitationRepository interface {
	Create(ctx context.Context, eventID uuid.UUID, email, token string, invitedBy uuid.UUID) (*model.Invitation, error)
	ListByEventID(ctx context.Context, eventID uuid.UUID) ([]model.Invitation, error)
	Delete(ctx context.Context, invID, eventID uuid.UUID) error
	GetByToken(ctx context.Context, token string) (*model.Invitation, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.Invitation, error)
	UpdateStatus(ctx context.Context, invID uuid.UUID, status string) error
	ListAcceptedByEmail(ctx context.Context, email string) ([]model.Invitation, error)
}

// userRepository is the subset of repository.UserRepository used by services.
type userRepository interface {
	UpsertByKeycloakID(ctx context.Context, keycloakID, email, name string) (*model.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.User, error)
	GetByEmail(ctx context.Context, email string) (*model.User, error)
}

// emailSender is the subset of email.Service used by InvitationService and TodoService.
type emailSender interface {
	SendInvitation(recipientEmail, eventName, token string) error
	SendTodoAssignment(recipientEmail, eventName, todoTitle string) error
}
