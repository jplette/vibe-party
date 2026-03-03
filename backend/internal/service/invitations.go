package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/email"
	"github.com/vibe-party/backend/internal/model"
	"github.com/vibe-party/backend/internal/repository"
)

// InvitationService handles business logic for invitations.
type InvitationService struct {
	invRepo   *repository.InvitationRepository
	eventRepo *repository.EventRepository
	userRepo  *repository.UserRepository
	emailSvc  *email.Service
}

// NewInvitationService creates a new InvitationService.
func NewInvitationService(
	invRepo *repository.InvitationRepository,
	eventRepo *repository.EventRepository,
	userRepo *repository.UserRepository,
	emailSvc *email.Service,
) *InvitationService {
	return &InvitationService{
		invRepo:   invRepo,
		eventRepo: eventRepo,
		userRepo:  userRepo,
		emailSvc:  emailSvc,
	}
}

// SendInvitation creates an invitation record and sends an email.
// Requires the caller to be a member of the event.
func (s *InvitationService) SendInvitation(ctx context.Context, eventID, callerID uuid.UUID, recipientEmail string) (*model.Invitation, error) {
	if recipientEmail == "" {
		return nil, fmt.Errorf("%w: email is required", ErrInvalidInput)
	}

	// Verify caller is a member.
	_, err := s.eventRepo.GetMemberRole(ctx, eventID, callerID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrForbidden
		}
		return nil, fmt.Errorf("check membership: %w", err)
	}

	// Verify the event exists.
	event, err := s.eventRepo.GetByID(ctx, eventID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get event: %w", err)
	}

	token, err := generateToken()
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	inv, err := s.invRepo.Create(ctx, eventID, recipientEmail, token, callerID)
	if err != nil {
		return nil, fmt.Errorf("create invitation: %w", err)
	}

	// Send email asynchronously so we don't block the HTTP response.
	go func() {
		if sendErr := s.emailSvc.SendInvitation(recipientEmail, event.Name, token); sendErr != nil {
			// Log the error but don't fail the request — invitation is already recorded.
			fmt.Printf("failed to send invitation email to %s: %v\n", recipientEmail, sendErr)
		}
	}()

	return inv, nil
}

// ListInvitations returns all invitations for an event, requiring membership.
func (s *InvitationService) ListInvitations(ctx context.Context, eventID, userID uuid.UUID) ([]model.Invitation, error) {
	_, err := s.eventRepo.GetMemberRole(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrForbidden
		}
		return nil, fmt.Errorf("check membership: %w", err)
	}

	invs, err := s.invRepo.ListByEventID(ctx, eventID)
	if err != nil {
		return nil, fmt.Errorf("list invitations: %w", err)
	}
	if invs == nil {
		invs = []model.Invitation{}
	}
	return invs, nil
}

// CancelInvitation deletes an invitation, requiring admin role.
func (s *InvitationService) CancelInvitation(ctx context.Context, eventID, invID, userID uuid.UUID) error {
	role, err := s.eventRepo.GetMemberRole(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrForbidden
		}
		return fmt.Errorf("check membership: %w", err)
	}
	if role != "admin" {
		return ErrForbidden
	}

	if err := s.invRepo.Delete(ctx, invID, eventID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("cancel invitation: %w", err)
	}
	return nil
}

// AcceptInvitation processes a token-based acceptance.
// If userID is provided, adds the user to the event as a member.
func (s *InvitationService) AcceptInvitation(ctx context.Context, token string, userID *uuid.UUID) error {
	inv, err := s.invRepo.GetByToken(ctx, token)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("get invitation: %w", err)
	}

	if inv.Status != "pending" {
		return fmt.Errorf("%w: invitation is already %s", ErrInvalidInput, inv.Status)
	}

	if err := s.invRepo.UpdateStatus(ctx, inv.ID, "accepted"); err != nil {
		return fmt.Errorf("update invitation status: %w", err)
	}

	// If a user ID is given, add them to the event.
	if userID != nil {
		if err := s.eventRepo.AddMember(ctx, inv.EventID, *userID, "member"); err != nil {
			return fmt.Errorf("add member: %w", err)
		}
	}

	return nil
}

// DeclineInvitation processes a token-based decline.
func (s *InvitationService) DeclineInvitation(ctx context.Context, token string) error {
	inv, err := s.invRepo.GetByToken(ctx, token)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("get invitation: %w", err)
	}

	if inv.Status != "pending" {
		return fmt.Errorf("%w: invitation is already %s", ErrInvalidInput, inv.Status)
	}

	if err := s.invRepo.UpdateStatus(ctx, inv.ID, "declined"); err != nil {
		return fmt.Errorf("update invitation status: %w", err)
	}

	return nil
}

// generateToken creates a cryptographically random 32-byte URL-safe base64 token.
func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("rand read: %w", err)
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
