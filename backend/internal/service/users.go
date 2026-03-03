package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
	"github.com/vibe-party/backend/internal/repository"
)

// UserService handles business logic for user operations.
type UserService struct {
	userRepo *repository.UserRepository
}

// NewUserService creates a new UserService.
func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

// SyncUser ensures a local user record exists and is up to date with the JWT claims.
// Called on every authenticated request via auth middleware.
func (s *UserService) SyncUser(ctx context.Context, keycloakID, email, name string) (*model.User, error) {
	user, err := s.userRepo.UpsertByKeycloakID(ctx, keycloakID, email, name)
	if err != nil {
		return nil, fmt.Errorf("sync user: %w", err)
	}
	return user, nil
}

// GetByID returns a user by their internal UUID.
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return user, nil
}

// GetMe returns the currently authenticated user from context.
func (s *UserService) GetMe(ctx context.Context) (*model.User, error) {
	user, ok := ctx.Value(model.ContextKeyUser).(*model.User)
	if !ok || user == nil {
		return nil, ErrUnauthorized
	}
	return user, nil
}
