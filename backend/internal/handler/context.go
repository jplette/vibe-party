package handler

import (
	"net/http"

	"github.com/vibe-party/backend/internal/model"
)

// UserFromContext extracts the authenticated user from the request context.
// Returns nil if no user is set (unauthenticated requests).
func UserFromContext(r *http.Request) *model.User {
	user, _ := r.Context().Value(model.ContextKeyUser).(*model.User)
	return user
}

// RequireUser extracts the user from context. If missing, writes 401 and returns nil.
// Handlers should return immediately when the second return value is false.
func RequireUser(w http.ResponseWriter, r *http.Request) (*model.User, bool) {
	user := UserFromContext(r)
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "authentication required")
		return nil, false
	}
	return user, true
}
