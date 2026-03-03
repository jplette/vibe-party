package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/service"
)

// ItemHandler handles bring-item HTTP endpoints.
type ItemHandler struct {
	itemSvc *service.ItemService
}

// NewItemHandler creates a new ItemHandler.
func NewItemHandler(itemSvc *service.ItemService) *ItemHandler {
	return &ItemHandler{itemSvc: itemSvc}
}

type createItemRequest struct {
	Name     string `json:"name"`
	Quantity string `json:"quantity"`
}

type updateItemRequest struct {
	Name     string `json:"name"`
	Quantity string `json:"quantity"`
}

type assignItemRequest struct {
	AssignedTo *string `json:"assigned_to"`
}

// ListItems handles GET /events/:id/items.
func (h *ItemHandler) ListItems(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	items, err := h.itemSvc.ListItems(r.Context(), eventID, user.ID)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, items)
}

// CreateItem handles POST /events/:id/items.
func (h *ItemHandler) CreateItem(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	var req createItemRequest
	if !DecodeJSON(w, r, &req) {
		return
	}
	if req.Name == "" {
		RespondError(w, http.StatusBadRequest, "name is required")
		return
	}

	item, err := h.itemSvc.CreateItem(r.Context(), eventID, user.ID, req.Name, req.Quantity)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusCreated, item)
}

// UpdateItem handles PUT /events/:id/items/:iid.
func (h *ItemHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	itemID, err := parseUUIDParam(r, "iid")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid item id")
		return
	}

	var req updateItemRequest
	if !DecodeJSON(w, r, &req) {
		return
	}
	if req.Name == "" {
		RespondError(w, http.StatusBadRequest, "name is required")
		return
	}

	item, err := h.itemSvc.UpdateItem(r.Context(), eventID, itemID, user.ID, req.Name, req.Quantity)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, item)
}

// AssignItem handles PATCH /events/:id/items/:iid/assign.
func (h *ItemHandler) AssignItem(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	itemID, err := parseUUIDParam(r, "iid")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid item id")
		return
	}

	var req assignItemRequest
	if !DecodeJSON(w, r, &req) {
		return
	}

	var assigneeID *uuid.UUID
	if req.AssignedTo != nil && *req.AssignedTo != "" {
		parsed, parseErr := uuid.Parse(*req.AssignedTo)
		if parseErr != nil {
			RespondError(w, http.StatusBadRequest, "invalid assigned_to uuid")
			return
		}
		assigneeID = &parsed
	}

	item, err := h.itemSvc.AssignItem(r.Context(), eventID, itemID, user.ID, assigneeID)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, item)
}

// FulfillItem handles PATCH /events/:id/items/:iid/fulfill.
func (h *ItemHandler) FulfillItem(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	itemID, err := parseUUIDParam(r, "iid")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid item id")
		return
	}

	item, err := h.itemSvc.ToggleFulfill(r.Context(), eventID, itemID, user.ID)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, item)
}

// DeleteItem handles DELETE /events/:id/items/:iid.
func (h *ItemHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	itemID, err := parseUUIDParam(r, "iid")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid item id")
		return
	}

	if err := h.itemSvc.DeleteItem(r.Context(), eventID, itemID, user.ID); HandleServiceError(w, err) {
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
