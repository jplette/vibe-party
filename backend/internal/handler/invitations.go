package handler

import (
	"net/http"

	"github.com/vibe-party/backend/internal/service"
)

// InvitationHandler handles invitation-related HTTP endpoints.
type InvitationHandler struct {
	invSvc *service.InvitationService
}

// NewInvitationHandler creates a new InvitationHandler.
func NewInvitationHandler(invSvc *service.InvitationService) *InvitationHandler {
	return &InvitationHandler{invSvc: invSvc}
}

type sendInvitationRequest struct {
	Email string `json:"email"`
}

type acceptDeclineRequest struct {
	Token string `json:"token"`
}

// SendInvitation handles POST /events/:id/invitations.
func (h *InvitationHandler) SendInvitation(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	var req sendInvitationRequest
	if !DecodeJSON(w, r, &req) {
		return
	}
	if req.Email == "" {
		RespondError(w, http.StatusBadRequest, "email is required")
		return
	}

	inv, err := h.invSvc.SendInvitation(r.Context(), eventID, user.ID, req.Email)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusCreated, inv)
}

// ListInvitations handles GET /events/:id/invitations.
func (h *InvitationHandler) ListInvitations(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	invs, err := h.invSvc.ListInvitations(r.Context(), eventID, user.ID)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, invs)
}

// CancelInvitation handles DELETE /events/:id/invitations/:inv_id.
func (h *InvitationHandler) CancelInvitation(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	invID, err := parseUUIDParam(r, "inv_id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid invitation id")
		return
	}

	if err := h.invSvc.CancelInvitation(r.Context(), eventID, invID, user.ID); HandleServiceError(w, err) {
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// AcceptInvitation handles POST /invitations/accept — no auth required.
func (h *InvitationHandler) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	var req acceptDeclineRequest
	if !DecodeJSON(w, r, &req) {
		return
	}
	if req.Token == "" {
		RespondError(w, http.StatusBadRequest, "token is required")
		return
	}

	inv, err := h.invSvc.AcceptInvitation(r.Context(), req.Token)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "accepted",
		"eventId": inv.EventID,
	})
}

// DeclineInvitation handles POST /invitations/decline — no auth required.
func (h *InvitationHandler) DeclineInvitation(w http.ResponseWriter, r *http.Request) {
	var req acceptDeclineRequest
	if !DecodeJSON(w, r, &req) {
		return
	}
	if req.Token == "" {
		RespondError(w, http.StatusBadRequest, "token is required")
		return
	}

	if err := h.invSvc.DeclineInvitation(r.Context(), req.Token); HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, map[string]string{"status": "declined"})
}
