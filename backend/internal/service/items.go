package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
	"github.com/vibe-party/backend/internal/repository"
)

// ItemService handles business logic for bring items.
type ItemService struct {
	itemRepo  *repository.ItemRepository
	eventRepo *repository.EventRepository
}

// NewItemService creates a new ItemService.
func NewItemService(itemRepo *repository.ItemRepository, eventRepo *repository.EventRepository) *ItemService {
	return &ItemService{itemRepo: itemRepo, eventRepo: eventRepo}
}

// ListItems returns all bring items for an event, requiring membership.
func (s *ItemService) ListItems(ctx context.Context, eventID, userID uuid.UUID) ([]model.BringItem, error) {
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return nil, err
	}
	items, err := s.itemRepo.ListByEventID(ctx, eventID)
	if err != nil {
		return nil, fmt.Errorf("list items: %w", err)
	}
	if items == nil {
		items = []model.BringItem{}
	}
	return items, nil
}

// CreateItem creates a new bring item, requiring membership.
func (s *ItemService) CreateItem(ctx context.Context, eventID, userID uuid.UUID, name, quantity string) (*model.BringItem, error) {
	if name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return nil, err
	}
	item, err := s.itemRepo.Create(ctx, eventID, name, quantity)
	if err != nil {
		return nil, fmt.Errorf("create item: %w", err)
	}
	return item, nil
}

// UpdateItem updates a bring item, requiring membership.
func (s *ItemService) UpdateItem(ctx context.Context, eventID, itemID, userID uuid.UUID, name, quantity string) (*model.BringItem, error) {
	if name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return nil, err
	}
	item, err := s.itemRepo.Update(ctx, itemID, eventID, name, quantity)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update item: %w", err)
	}
	return item, nil
}

// AssignItem assigns a bring item to a user, requiring membership.
func (s *ItemService) AssignItem(ctx context.Context, eventID, itemID, callerID uuid.UUID, assigneeID *uuid.UUID) (*model.BringItem, error) {
	if err := s.requireMembership(ctx, eventID, callerID); err != nil {
		return nil, err
	}
	item, err := s.itemRepo.Assign(ctx, itemID, eventID, assigneeID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("assign item: %w", err)
	}
	return item, nil
}

// ToggleFulfill toggles the fulfillment status of a bring item, requiring membership.
func (s *ItemService) ToggleFulfill(ctx context.Context, eventID, itemID, userID uuid.UUID) (*model.BringItem, error) {
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return nil, err
	}
	item, err := s.itemRepo.ToggleFulfill(ctx, itemID, eventID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("toggle item fulfill: %w", err)
	}
	return item, nil
}

// DeleteItem deletes a bring item, requiring membership.
func (s *ItemService) DeleteItem(ctx context.Context, eventID, itemID, userID uuid.UUID) error {
	if err := s.requireMembership(ctx, eventID, userID); err != nil {
		return err
	}
	if err := s.itemRepo.Delete(ctx, itemID, eventID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("delete item: %w", err)
	}
	return nil
}

func (s *ItemService) requireMembership(ctx context.Context, eventID, userID uuid.UUID) error {
	_, err := s.eventRepo.GetMemberRole(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrForbidden
		}
		return fmt.Errorf("check membership: %w", err)
	}
	return nil
}
