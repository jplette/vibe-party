package service

// mocks_test.go provides in-package test doubles for all repository interfaces.
// Using package service (not service_test) so the mocks can satisfy the
// unexported interface types defined in repos.go.

import (
	"context"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
)

// ---- eventRepository mock ----

type mockEventRepo struct {
	ListByUserIDFn          func(ctx context.Context, userID uuid.UUID) ([]model.EventWithRole, error)
	CreateFn                func(ctx context.Context, name, description, location string, date *string, createdBy uuid.UUID) (*model.Event, error)
	GetByIDFn               func(ctx context.Context, id uuid.UUID) (*model.Event, error)
	UpdateFn                func(ctx context.Context, id uuid.UUID, name, description, location string, date *string) (*model.Event, error)
	DeleteFn                func(ctx context.Context, id uuid.UUID) error
	GetMemberRoleFn         func(ctx context.Context, eventID, userID uuid.UUID) (string, error)
	AddMemberFn             func(ctx context.Context, eventID, userID uuid.UUID, role string) error
	ListMembersFn           func(ctx context.Context, eventID uuid.UUID) ([]model.EventMemberWithUser, error)
	SharesEventMembershipFn func(ctx context.Context, userAID, userBID uuid.UUID) (bool, error)
}

func (m *mockEventRepo) ListByUserID(ctx context.Context, userID uuid.UUID) ([]model.EventWithRole, error) {
	return m.ListByUserIDFn(ctx, userID)
}
func (m *mockEventRepo) Create(ctx context.Context, name, description, location string, date *string, createdBy uuid.UUID) (*model.Event, error) {
	return m.CreateFn(ctx, name, description, location, date, createdBy)
}
func (m *mockEventRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Event, error) {
	return m.GetByIDFn(ctx, id)
}
func (m *mockEventRepo) Update(ctx context.Context, id uuid.UUID, name, description, location string, date *string) (*model.Event, error) {
	return m.UpdateFn(ctx, id, name, description, location, date)
}
func (m *mockEventRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return m.DeleteFn(ctx, id)
}
func (m *mockEventRepo) GetMemberRole(ctx context.Context, eventID, userID uuid.UUID) (string, error) {
	return m.GetMemberRoleFn(ctx, eventID, userID)
}
func (m *mockEventRepo) AddMember(ctx context.Context, eventID, userID uuid.UUID, role string) error {
	return m.AddMemberFn(ctx, eventID, userID, role)
}
func (m *mockEventRepo) ListMembers(ctx context.Context, eventID uuid.UUID) ([]model.EventMemberWithUser, error) {
	return m.ListMembersFn(ctx, eventID)
}
func (m *mockEventRepo) SharesEventMembership(ctx context.Context, userAID, userBID uuid.UUID) (bool, error) {
	return m.SharesEventMembershipFn(ctx, userAID, userBID)
}

// ---- todoRepository mock ----

type mockTodoRepo struct {
	ListByEventIDFn  func(ctx context.Context, eventID uuid.UUID) ([]model.Todo, error)
	CreateFn         func(ctx context.Context, eventID uuid.UUID, title, description string) (*model.Todo, error)
	UpdateFn         func(ctx context.Context, todoID, eventID uuid.UUID, title, description string) (*model.Todo, error)
	AssignFn         func(ctx context.Context, todoID, eventID uuid.UUID, assigneeID *uuid.UUID) (*model.Todo, error)
	ToggleCompleteFn func(ctx context.Context, todoID, eventID uuid.UUID) (*model.Todo, error)
	DeleteFn         func(ctx context.Context, todoID, eventID uuid.UUID) error
}

func (m *mockTodoRepo) ListByEventID(ctx context.Context, eventID uuid.UUID) ([]model.Todo, error) {
	return m.ListByEventIDFn(ctx, eventID)
}
func (m *mockTodoRepo) Create(ctx context.Context, eventID uuid.UUID, title, description string) (*model.Todo, error) {
	return m.CreateFn(ctx, eventID, title, description)
}
func (m *mockTodoRepo) Update(ctx context.Context, todoID, eventID uuid.UUID, title, description string) (*model.Todo, error) {
	return m.UpdateFn(ctx, todoID, eventID, title, description)
}
func (m *mockTodoRepo) Assign(ctx context.Context, todoID, eventID uuid.UUID, assigneeID *uuid.UUID) (*model.Todo, error) {
	return m.AssignFn(ctx, todoID, eventID, assigneeID)
}
func (m *mockTodoRepo) ToggleComplete(ctx context.Context, todoID, eventID uuid.UUID) (*model.Todo, error) {
	return m.ToggleCompleteFn(ctx, todoID, eventID)
}
func (m *mockTodoRepo) Delete(ctx context.Context, todoID, eventID uuid.UUID) error {
	return m.DeleteFn(ctx, todoID, eventID)
}

// ---- itemRepository mock ----

type mockItemRepo struct {
	ListByEventIDFn func(ctx context.Context, eventID uuid.UUID) ([]model.BringItem, error)
	CreateFn        func(ctx context.Context, eventID uuid.UUID, name, quantity string) (*model.BringItem, error)
	UpdateFn        func(ctx context.Context, itemID, eventID uuid.UUID, name, quantity string) (*model.BringItem, error)
	AssignFn        func(ctx context.Context, itemID, eventID uuid.UUID, assigneeID *uuid.UUID) (*model.BringItem, error)
	ToggleFulfillFn func(ctx context.Context, itemID, eventID uuid.UUID) (*model.BringItem, error)
	DeleteFn        func(ctx context.Context, itemID, eventID uuid.UUID) error
}

func (m *mockItemRepo) ListByEventID(ctx context.Context, eventID uuid.UUID) ([]model.BringItem, error) {
	return m.ListByEventIDFn(ctx, eventID)
}
func (m *mockItemRepo) Create(ctx context.Context, eventID uuid.UUID, name, quantity string) (*model.BringItem, error) {
	return m.CreateFn(ctx, eventID, name, quantity)
}
func (m *mockItemRepo) Update(ctx context.Context, itemID, eventID uuid.UUID, name, quantity string) (*model.BringItem, error) {
	return m.UpdateFn(ctx, itemID, eventID, name, quantity)
}
func (m *mockItemRepo) Assign(ctx context.Context, itemID, eventID uuid.UUID, assigneeID *uuid.UUID) (*model.BringItem, error) {
	return m.AssignFn(ctx, itemID, eventID, assigneeID)
}
func (m *mockItemRepo) ToggleFulfill(ctx context.Context, itemID, eventID uuid.UUID) (*model.BringItem, error) {
	return m.ToggleFulfillFn(ctx, itemID, eventID)
}
func (m *mockItemRepo) Delete(ctx context.Context, itemID, eventID uuid.UUID) error {
	return m.DeleteFn(ctx, itemID, eventID)
}

// ---- invitationRepository mock ----

type mockInvRepo struct {
	CreateFn              func(ctx context.Context, eventID uuid.UUID, email, token string, invitedBy uuid.UUID) (*model.Invitation, error)
	ListByEventIDFn       func(ctx context.Context, eventID uuid.UUID) ([]model.Invitation, error)
	DeleteFn              func(ctx context.Context, invID, eventID uuid.UUID) error
	GetByTokenFn          func(ctx context.Context, token string) (*model.Invitation, error)
	UpdateStatusFn        func(ctx context.Context, invID uuid.UUID, status string) error
	ListAcceptedByEmailFn func(ctx context.Context, email string) ([]model.Invitation, error)
}

func (m *mockInvRepo) Create(ctx context.Context, eventID uuid.UUID, email, token string, invitedBy uuid.UUID) (*model.Invitation, error) {
	return m.CreateFn(ctx, eventID, email, token, invitedBy)
}
func (m *mockInvRepo) ListByEventID(ctx context.Context, eventID uuid.UUID) ([]model.Invitation, error) {
	return m.ListByEventIDFn(ctx, eventID)
}
func (m *mockInvRepo) Delete(ctx context.Context, invID, eventID uuid.UUID) error {
	return m.DeleteFn(ctx, invID, eventID)
}
func (m *mockInvRepo) GetByToken(ctx context.Context, token string) (*model.Invitation, error) {
	return m.GetByTokenFn(ctx, token)
}
func (m *mockInvRepo) UpdateStatus(ctx context.Context, invID uuid.UUID, status string) error {
	return m.UpdateStatusFn(ctx, invID, status)
}
func (m *mockInvRepo) ListAcceptedByEmail(ctx context.Context, email string) ([]model.Invitation, error) {
	return m.ListAcceptedByEmailFn(ctx, email)
}

// ---- userRepository mock ----

type mockUserRepo struct {
	UpsertByKeycloakIDFn func(ctx context.Context, keycloakID, email, name string) (*model.User, error)
	GetByIDFn            func(ctx context.Context, id uuid.UUID) (*model.User, error)
	GetByEmailFn         func(ctx context.Context, email string) (*model.User, error)
}

func (m *mockUserRepo) UpsertByKeycloakID(ctx context.Context, keycloakID, email, name string) (*model.User, error) {
	return m.UpsertByKeycloakIDFn(ctx, keycloakID, email, name)
}
func (m *mockUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	return m.GetByIDFn(ctx, id)
}
func (m *mockUserRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	return m.GetByEmailFn(ctx, email)
}

// ---- emailSender mock ----

type mockEmailSender struct {
	SendInvitationFn func(recipientEmail, eventName, token string) error
}

func (m *mockEmailSender) SendInvitation(recipientEmail, eventName, token string) error {
	if m.SendInvitationFn != nil {
		return m.SendInvitationFn(recipientEmail, eventName, token)
	}
	return nil
}

// newEventService constructs an EventService with mock dependencies for testing.
func newTestEventService(repo eventRepository) *EventService {
	return &EventService{eventRepo: repo}
}

// newTodoService constructs a TodoService with mock dependencies for testing.
func newTestTodoService(todoRepo todoRepository, eventRepo eventRepository) *TodoService {
	return &TodoService{todoRepo: todoRepo, eventRepo: eventRepo}
}

// newItemService constructs an ItemService with mock dependencies for testing.
func newTestItemService(itemRepo itemRepository, eventRepo eventRepository) *ItemService {
	return &ItemService{itemRepo: itemRepo, eventRepo: eventRepo}
}

// newInvitationService constructs an InvitationService with mock dependencies for testing.
func newTestInvitationService(invRepo invitationRepository, eventRepo eventRepository, userRepo userRepository, emailSvc emailSender) *InvitationService {
	return &InvitationService{
		invRepo:   invRepo,
		eventRepo: eventRepo,
		userRepo:  userRepo,
		emailSvc:  emailSvc,
	}
}

// newUserService constructs a UserService with mock dependencies for testing.
func newTestUserService(userRepo userRepository, eventRepo eventRepository) *UserService {
	return &UserService{userRepo: userRepo, eventRepo: eventRepo}
}
