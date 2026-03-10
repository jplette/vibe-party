package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/service"
)

// EventHandler handles event-related HTTP endpoints.
type EventHandler struct {
	eventSvc *service.EventService
}

// NewEventHandler creates a new EventHandler.
func NewEventHandler(eventSvc *service.EventService) *EventHandler {
	return &EventHandler{eventSvc: eventSvc}
}

// createEventRequest is the payload for POST /events.
type createEventRequest struct {
	Name            string  `json:"name"`
	Description     string  `json:"description"`
	Date            *string `json:"date"`
	EndDate         *string `json:"endDate"`
	LocationName    string  `json:"locationName"`
	LocationStreet  string  `json:"locationStreet"`
	LocationCity    string  `json:"locationCity"`
	LocationZip     string  `json:"locationZip"`
	LocationCountry string  `json:"locationCountry"`
}

// updateEventRequest is the payload for PUT /events/:id.
type updateEventRequest struct {
	Name            string  `json:"name"`
	Description     string  `json:"description"`
	Date            *string `json:"date"`
	EndDate         *string `json:"endDate"`
	LocationName    string  `json:"locationName"`
	LocationStreet  string  `json:"locationStreet"`
	LocationCity    string  `json:"locationCity"`
	LocationZip     string  `json:"locationZip"`
	LocationCountry string  `json:"locationCountry"`
}

// ListEvents handles GET /events — returns all events for the current user.
func (h *EventHandler) ListEvents(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}

	events, err := h.eventSvc.ListUserEvents(r.Context(), user.ID)
	if HandleServiceError(w, err) {
		return
	}

	RespondJSON(w, http.StatusOK, events)
}

// CreateEvent handles POST /events.
func (h *EventHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}

	var req createEventRequest
	if !DecodeJSON(w, r, &req) {
		return
	}

	if req.Name == "" {
		RespondError(w, http.StatusBadRequest, "name is required")
		return
	}

	event, err := h.eventSvc.CreateEvent(r.Context(), req.Name, req.Description, req.LocationName, req.LocationStreet, req.LocationCity, req.LocationZip, req.LocationCountry, req.Date, req.EndDate, user.ID)
	if HandleServiceError(w, err) {
		return
	}

	RespondJSON(w, http.StatusCreated, event)
}

// GetEvent handles GET /events/:id.
func (h *EventHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}

	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	event, err := h.eventSvc.GetEvent(r.Context(), eventID, user.ID)
	if HandleServiceError(w, err) {
		return
	}

	RespondJSON(w, http.StatusOK, event)
}

// UpdateEvent handles PUT /events/:id.
func (h *EventHandler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}

	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	var req updateEventRequest
	if !DecodeJSON(w, r, &req) {
		return
	}

	if req.Name == "" {
		RespondError(w, http.StatusBadRequest, "name is required")
		return
	}

	event, err := h.eventSvc.UpdateEvent(r.Context(), eventID, user.ID, req.Name, req.Description, req.LocationName, req.LocationStreet, req.LocationCity, req.LocationZip, req.LocationCountry, req.Date, req.EndDate)
	if HandleServiceError(w, err) {
		return
	}

	RespondJSON(w, http.StatusOK, event)
}

// DeleteEvent handles DELETE /events/:id.
func (h *EventHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}

	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	if err := h.eventSvc.DeleteEvent(r.Context(), eventID, user.ID); HandleServiceError(w, err) {
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListMembers handles GET /events/:id/members.
func (h *EventHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}

	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	members, err := h.eventSvc.ListMembers(r.Context(), eventID, user.ID)
	if HandleServiceError(w, err) {
		return
	}

	RespondJSON(w, http.StatusOK, members)
}

// ListGuests handles GET /events/:id/guests.
func (h *EventHandler) ListGuests(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}

	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	guests, err := h.eventSvc.ListGuests(r.Context(), eventID, user.ID)
	if HandleServiceError(w, err) {
		return
	}

	RespondJSON(w, http.StatusOK, guests)
}

// parseUUIDParam extracts and parses a UUID from a Chi URL parameter.
func parseUUIDParam(r *http.Request, param string) (uuid.UUID, error) {
	return uuid.Parse(chi.URLParam(r, param))
}
