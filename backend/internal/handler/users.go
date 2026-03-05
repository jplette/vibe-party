package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/service"
)

// UserHandler handles user-related HTTP endpoints.
type UserHandler struct {
	userSvc *service.UserService
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(userSvc *service.UserService) *UserHandler {
	return &UserHandler{userSvc: userSvc}
}

// GetMe handles GET /users/me — returns the current authenticated user.
func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	RespondJSON(w, http.StatusOK, user)
}

// GetByID handles GET /users/:id — returns a user by their internal UUID.
// Access is restricted to the requesting user's own profile, or profiles of
// users who share at least one event with the requester.
func (h *UserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	caller, ok := RequireUser(w, r)
	if !ok {
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if caller.ID != id {
		shared, err := h.userSvc.SharesEventMembership(r.Context(), caller.ID, id)
		if HandleServiceError(w, err) {
			return
		}
		if !shared {
			RespondError(w, http.StatusForbidden, "forbidden")
			return
		}
	}

	user, err := h.userSvc.GetByID(r.Context(), id)
	if HandleServiceError(w, err) {
		return
	}

	RespondJSON(w, http.StatusOK, user)
}
