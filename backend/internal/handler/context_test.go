package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/vibe-party/backend/internal/model"
)

func TestUserFromContext(t *testing.T) {
	t.Run("returns user when present in context", func(t *testing.T) {
		user := &model.User{
			ID:    uuid.New(),
			Email: "alice@example.com",
			Name:  "Alice",
		}
		ctx := context.WithValue(context.Background(), model.ContextKeyUser, user)
		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)

		got := UserFromContext(req)

		if got == nil {
			t.Fatal("expected user, got nil")
		}
		if got.ID != user.ID {
			t.Errorf("got ID %v; want %v", got.ID, user.ID)
		}
		if got.Email != user.Email {
			t.Errorf("got Email %q; want %q", got.Email, user.Email)
		}
	})

	t.Run("returns nil when user not in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		got := UserFromContext(req)
		if got != nil {
			t.Errorf("expected nil, got %+v", got)
		}
	})

	t.Run("returns nil when wrong type in context", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), model.ContextKeyUser, "not-a-user")
		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
		got := UserFromContext(req)
		if got != nil {
			t.Errorf("expected nil for wrong type, got %+v", got)
		}
	})
}

func TestRequireUser(t *testing.T) {
	t.Run("returns user and true when authenticated", func(t *testing.T) {
		user := &model.User{
			ID:    uuid.New(),
			Email: "bob@example.com",
			Name:  "Bob",
		}
		ctx := context.WithValue(context.Background(), model.ContextKeyUser, user)
		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
		w := httptest.NewRecorder()

		got, ok := RequireUser(w, req)

		if !ok {
			t.Error("expected ok=true, got false")
		}
		if got == nil {
			t.Fatal("expected user, got nil")
		}
		if got.ID != user.ID {
			t.Errorf("got ID %v; want %v", got.ID, user.ID)
		}
		if w.Code != http.StatusOK {
			t.Errorf("expected no response written; got status %d", w.Code)
		}
	})

	t.Run("writes 401 and returns nil when unauthenticated", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()

		got, ok := RequireUser(w, req)

		if ok {
			t.Error("expected ok=false, got true")
		}
		if got != nil {
			t.Errorf("expected nil user, got %+v", got)
		}
		if w.Code != http.StatusUnauthorized {
			t.Errorf("got status %d; want %d", w.Code, http.StatusUnauthorized)
		}

		var body map[string]string
		if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if body["error"] != "authentication required" {
			t.Errorf("got error %q; want %q", body["error"], "authentication required")
		}
	})
}
