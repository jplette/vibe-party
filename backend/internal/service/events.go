package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
	"github.com/vibe-party/backend/internal/repository"
)

// EventService handles business logic for events.
type EventService struct {
	eventRepo eventRepository
	userRepo  userRepository
	emailSvc  emailSender
}

// NewEventService creates a new EventService.
func NewEventService(eventRepo *repository.EventRepository, userRepo *repository.UserRepository, emailSvc emailSender) *EventService {
	return &EventService{eventRepo: eventRepo, userRepo: userRepo, emailSvc: emailSvc}
}

// ListUserEvents returns all events the current user belongs to.
func (s *EventService) ListUserEvents(ctx context.Context, userID uuid.UUID) ([]model.EventWithRole, error) {
	events, err := s.eventRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list user events: %w", err)
	}
	if events == nil {
		events = []model.EventWithRole{}
	}
	return events, nil
}

// CreateEvent creates a new event and adds the creator as admin.
func (s *EventService) CreateEvent(ctx context.Context, name, description, locationName, locationStreet, locationCity, locationZip, locationCountry string, date, endDate *string, createdBy uuid.UUID) (*model.Event, error) {
	if name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	event, err := s.eventRepo.Create(ctx, name, description, locationName, locationStreet, locationCity, locationZip, locationCountry, date, endDate, createdBy)
	if err != nil {
		return nil, fmt.Errorf("create event: %w", err)
	}
	return event, nil
}

// GetEvent retrieves an event, verifying the user is a member.
func (s *EventService) GetEvent(ctx context.Context, eventID, userID uuid.UUID) (*model.Event, error) {
	event, err := s.eventRepo.GetByID(ctx, eventID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get event: %w", err)
	}

	_, err = s.eventRepo.GetMemberRole(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrForbidden
		}
		return nil, fmt.Errorf("check membership: %w", err)
	}

	return event, nil
}

// UpdateEvent updates an event, requiring the user to be an admin.
func (s *EventService) UpdateEvent(ctx context.Context, eventID, userID uuid.UUID, name, description, locationName, locationStreet, locationCity, locationZip, locationCountry string, date, endDate *string) (*model.Event, error) {
	if name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}

	if err := s.requireAdmin(ctx, eventID, userID); err != nil {
		return nil, err
	}

	event, err := s.eventRepo.Update(ctx, eventID, name, description, locationName, locationStreet, locationCity, locationZip, locationCountry, date, endDate)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update event: %w", err)
	}
	return event, nil
}

// DeleteEvent deletes an event, requiring the user to be an admin.
func (s *EventService) DeleteEvent(ctx context.Context, eventID, userID uuid.UUID) error {
	if err := s.requireAdmin(ctx, eventID, userID); err != nil {
		return err
	}

	if err := s.eventRepo.Delete(ctx, eventID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("delete event: %w", err)
	}
	return nil
}

// ListMembers returns all members of an event. The requesting user must be a member.
func (s *EventService) ListMembers(ctx context.Context, eventID, userID uuid.UUID) ([]model.EventMemberWithUser, error) {
	if _, err := s.RequireMember(ctx, eventID, userID); err != nil {
		return nil, err
	}
	members, err := s.eventRepo.ListMembers(ctx, eventID)
	if err != nil {
		return nil, fmt.Errorf("list members: %w", err)
	}
	if members == nil {
		members = []model.EventMemberWithUser{}
	}
	return members, nil
}

// ListGuests returns all guests (members and accepted invitation-only guests) for an event.
// Requires the caller to be an admin of the event.
func (s *EventService) ListGuests(ctx context.Context, eventID, userID uuid.UUID) ([]model.EventGuest, error) {
	if err := s.requireAdmin(ctx, eventID, userID); err != nil {
		return nil, err
	}
	return s.eventRepo.ListGuests(ctx, eventID)
}

// RemoveGuest removes a member from an event. Requires the caller to be the event owner.
// The event owner cannot remove themselves or other admins.
func (s *EventService) RemoveGuest(ctx context.Context, eventID, callerID, targetUserID uuid.UUID) error {
	event, err := s.eventRepo.GetByID(ctx, eventID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("get event: %w", err)
	}
	if event.CreatedBy != callerID {
		return fmt.Errorf("%w: only the event owner can remove guests", ErrForbidden)
	}

	if callerID == targetUserID {
		return fmt.Errorf("%w: cannot remove yourself from the event", ErrInvalidInput)
	}

	// Check that the target is a member and not an admin.
	targetRole, err := s.eventRepo.GetMemberRole(ctx, eventID, targetUserID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("check target membership: %w", err)
	}
	if targetRole == "admin" {
		return fmt.Errorf("%w: cannot remove an admin from the event", ErrForbidden)
	}

	// Fetch target user email before removal for notification.
	targetUser, err := s.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return fmt.Errorf("get target user: %w", err)
	}

	if err := s.eventRepo.RemoveMember(ctx, eventID, targetUserID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("remove guest: %w", err)
	}

	// Send removal notification (non-fatal).
	if sendErr := s.emailSvc.SendGuestRemoved(targetUser.Email, event.Name); sendErr != nil {
		slog.Warn("failed to send guest removal email", slog.String("error", sendErr.Error()))
	}
	return nil
}

// RequireMember verifies the user is a member of the event. Returns the role.
func (s *EventService) RequireMember(ctx context.Context, eventID, userID uuid.UUID) (string, error) {
	role, err := s.eventRepo.GetMemberRole(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return "", ErrForbidden
		}
		return "", fmt.Errorf("check membership: %w", err)
	}
	return role, nil
}

// AddMember adds a user to an event as a member.
func (s *EventService) AddMember(ctx context.Context, eventID, userID uuid.UUID, role string) error {
	return s.eventRepo.AddMember(ctx, eventID, userID, role)
}

// requireAdmin checks that the user is an admin of the event.
func (s *EventService) requireAdmin(ctx context.Context, eventID, userID uuid.UUID) error {
	role, err := s.eventRepo.GetMemberRole(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrForbidden
		}
		return fmt.Errorf("check admin role: %w", err)
	}
	if role != "admin" {
		return ErrForbidden
	}
	return nil
}
