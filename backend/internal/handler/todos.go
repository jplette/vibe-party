package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/service"
)

// TodoHandler handles todo-related HTTP endpoints.
type TodoHandler struct {
	todoSvc *service.TodoService
}

// NewTodoHandler creates a new TodoHandler.
func NewTodoHandler(todoSvc *service.TodoService) *TodoHandler {
	return &TodoHandler{todoSvc: todoSvc}
}

type createTodoRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type updateTodoRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type assignTodoRequest struct {
	// AssignedTo is a user UUID. Omit or set to null to unassign.
	AssignedTo *string `json:"assigned_to"`
}

// ListTodos handles GET /events/:id/todos.
func (h *TodoHandler) ListTodos(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	todos, err := h.todoSvc.ListTodos(r.Context(), eventID, user.ID)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, todos)
}

// CreateTodo handles POST /events/:id/todos.
func (h *TodoHandler) CreateTodo(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}

	var req createTodoRequest
	if !DecodeJSON(w, r, &req) {
		return
	}
	if req.Title == "" {
		RespondError(w, http.StatusBadRequest, "title is required")
		return
	}

	todo, err := h.todoSvc.CreateTodo(r.Context(), eventID, user.ID, req.Title, req.Description)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusCreated, todo)
}

// UpdateTodo handles PUT /events/:id/todos/:tid.
func (h *TodoHandler) UpdateTodo(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	todoID, err := parseUUIDParam(r, "tid")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid todo id")
		return
	}

	var req updateTodoRequest
	if !DecodeJSON(w, r, &req) {
		return
	}
	if req.Title == "" {
		RespondError(w, http.StatusBadRequest, "title is required")
		return
	}

	todo, err := h.todoSvc.UpdateTodo(r.Context(), eventID, todoID, user.ID, req.Title, req.Description)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, todo)
}

// AssignTodo handles PATCH /events/:id/todos/:tid/assign.
func (h *TodoHandler) AssignTodo(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	todoID, err := parseUUIDParam(r, "tid")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid todo id")
		return
	}

	var req assignTodoRequest
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

	todo, err := h.todoSvc.AssignTodo(r.Context(), eventID, todoID, user.ID, assigneeID)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, todo)
}

// CompleteTodo handles PATCH /events/:id/todos/:tid/complete.
func (h *TodoHandler) CompleteTodo(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	todoID, err := parseUUIDParam(r, "tid")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid todo id")
		return
	}

	todo, err := h.todoSvc.ToggleComplete(r.Context(), eventID, todoID, user.ID)
	if HandleServiceError(w, err) {
		return
	}
	RespondJSON(w, http.StatusOK, todo)
}

// DeleteTodo handles DELETE /events/:id/todos/:tid.
func (h *TodoHandler) DeleteTodo(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireUser(w, r)
	if !ok {
		return
	}
	eventID, err := parseUUIDParam(r, "id")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event id")
		return
	}
	todoID, err := parseUUIDParam(r, "tid")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid todo id")
		return
	}

	if err := h.todoSvc.DeleteTodo(r.Context(), eventID, todoID, user.ID); HandleServiceError(w, err) {
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
