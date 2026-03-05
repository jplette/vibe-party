package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/vibe-party/backend/internal/service"
)

func TestHandleServiceError(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantHandle bool
		wantStatus int
		wantMsg    string
	}{
		{
			name:       "nil error returns false",
			err:        nil,
			wantHandle: false,
		},
		{
			name:       "ErrNotFound maps to 404",
			err:        service.ErrNotFound,
			wantHandle: true,
			wantStatus: http.StatusNotFound,
			wantMsg:    "resource not found",
		},
		{
			name:       "ErrForbidden maps to 403",
			err:        service.ErrForbidden,
			wantHandle: true,
			wantStatus: http.StatusForbidden,
			wantMsg:    "access denied",
		},
		{
			name:       "ErrUnauthorized maps to 401",
			err:        service.ErrUnauthorized,
			wantHandle: true,
			wantStatus: http.StatusUnauthorized,
			wantMsg:    "authentication required",
		},
		{
			name:       "ErrConflict maps to 409",
			err:        service.ErrConflict,
			wantHandle: true,
			wantStatus: http.StatusConflict,
			wantMsg:    "conflict",
		},
		{
			name:       "ErrInvalidInput maps to 400",
			err:        fmt.Errorf("%w: name is required", service.ErrInvalidInput),
			wantHandle: true,
			wantStatus: http.StatusBadRequest,
			wantMsg:    "invalid input: name is required",
		},
		{
			name:       "unknown error maps to 500",
			err:        errors.New("database exploded"),
			wantHandle: true,
			wantStatus: http.StatusInternalServerError,
			wantMsg:    "internal server error",
		},
		{
			name:       "wrapped ErrNotFound maps to 404",
			err:        fmt.Errorf("outer: %w", service.ErrNotFound),
			wantHandle: true,
			wantStatus: http.StatusNotFound,
			wantMsg:    "resource not found",
		},
		{
			name:       "wrapped ErrForbidden maps to 403",
			err:        fmt.Errorf("check membership: %w", service.ErrForbidden),
			wantHandle: true,
			wantStatus: http.StatusForbidden,
			wantMsg:    "access denied",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			handled := HandleServiceError(w, tt.err)

			if handled != tt.wantHandle {
				t.Errorf("got handled=%v; want %v", handled, tt.wantHandle)
			}

			if !tt.wantHandle {
				return
			}

			if w.Code != tt.wantStatus {
				t.Errorf("got status %d; want %d", w.Code, tt.wantStatus)
			}

			var body map[string]string
			if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
				t.Fatalf("failed to decode response body: %v", err)
			}

			if body["error"] != tt.wantMsg {
				t.Errorf("got error %q; want %q", body["error"], tt.wantMsg)
			}
		})
	}
}
