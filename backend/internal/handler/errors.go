package handler

import (
	"errors"
	"net/http"

	"github.com/vibe-party/backend/internal/service"
)

// HandleServiceError maps service-layer sentinel errors to appropriate HTTP responses.
// Returns true if an error was handled (caller should return), false if err is nil.
func HandleServiceError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, service.ErrNotFound):
		RespondError(w, http.StatusNotFound, "resource not found")
	case errors.Is(err, service.ErrForbidden):
		RespondError(w, http.StatusForbidden, "access denied")
	case errors.Is(err, service.ErrUnauthorized):
		RespondError(w, http.StatusUnauthorized, "authentication required")
	case errors.Is(err, service.ErrConflict):
		RespondError(w, http.StatusConflict, err.Error())
	case errors.Is(err, service.ErrInvalidInput):
		RespondError(w, http.StatusBadRequest, err.Error())
	default:
		RespondError(w, http.StatusInternalServerError, "internal server error")
	}
	return true
}
