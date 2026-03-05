package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRespondJSON(t *testing.T) {
	tests := []struct {
		name            string
		status          int
		body            any
		wantStatus      int
		wantContentType string
		wantBody        string
	}{
		{
			name:            "ok with struct body",
			status:          http.StatusOK,
			body:            map[string]string{"key": "value"},
			wantStatus:      http.StatusOK,
			wantContentType: "application/json",
			wantBody:        `{"key":"value"}`,
		},
		{
			name:            "created with nil body",
			status:          http.StatusCreated,
			body:            nil,
			wantStatus:      http.StatusCreated,
			wantContentType: "application/json",
			wantBody:        "",
		},
		{
			name:            "internal server error",
			status:          http.StatusInternalServerError,
			body:            map[string]string{"error": "boom"},
			wantStatus:      http.StatusInternalServerError,
			wantContentType: "application/json",
			wantBody:        `{"error":"boom"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			RespondJSON(w, tt.status, tt.body)

			resp := w.Result()
			defer resp.Body.Close()

			if resp.StatusCode != tt.wantStatus {
				t.Errorf("got status %d; want %d", resp.StatusCode, tt.wantStatus)
			}

			if got := resp.Header.Get("Content-Type"); got != tt.wantContentType {
				t.Errorf("got Content-Type %q; want %q", got, tt.wantContentType)
			}

			if tt.wantBody != "" {
				bodyBytes, _ := io.ReadAll(resp.Body)
				got := strings.TrimSpace(string(bodyBytes))
				if got != tt.wantBody {
					t.Errorf("got body %q; want %q", got, tt.wantBody)
				}
			}
		})
	}
}

func TestRespondError(t *testing.T) {
	tests := []struct {
		name       string
		status     int
		message    string
		wantStatus int
	}{
		{"not found", http.StatusNotFound, "resource not found", http.StatusNotFound},
		{"bad request", http.StatusBadRequest, "name is required", http.StatusBadRequest},
		{"forbidden", http.StatusForbidden, "access denied", http.StatusForbidden},
		{"unauthorized", http.StatusUnauthorized, "authentication required", http.StatusUnauthorized},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			RespondError(w, tt.status, tt.message)

			resp := w.Result()
			defer resp.Body.Close()

			if resp.StatusCode != tt.wantStatus {
				t.Errorf("got status %d; want %d", resp.StatusCode, tt.wantStatus)
			}

			var body map[string]string
			if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
				t.Fatalf("failed to decode error response: %v", err)
			}

			if body["error"] != tt.message {
				t.Errorf("got error message %q; want %q", body["error"], tt.message)
			}
		})
	}
}

func TestDecodeJSON(t *testing.T) {
	type payload struct {
		Name string `json:"name"`
	}

	tests := []struct {
		name       string
		body       string
		wantOK     bool
		wantStatus int
		wantName   string
	}{
		{
			name:     "valid JSON",
			body:     `{"name":"Alice"}`,
			wantOK:   true,
			wantName: "Alice",
		},
		{
			name:       "invalid JSON",
			body:       `{notjson}`,
			wantOK:     false,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "unknown field disallowed",
			body:       `{"name":"Alice","extra":"field"}`,
			wantOK:     false,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:     "empty name field",
			body:     `{"name":""}`,
			wantOK:   true,
			wantName: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body))
			w := httptest.NewRecorder()

			var p payload
			ok := DecodeJSON(w, req, &p)

			if ok != tt.wantOK {
				t.Errorf("got ok=%v; want ok=%v", ok, tt.wantOK)
			}

			if !tt.wantOK {
				if w.Code != tt.wantStatus {
					t.Errorf("got status %d; want %d", w.Code, tt.wantStatus)
				}
				return
			}

			if p.Name != tt.wantName {
				t.Errorf("got name %q; want %q", p.Name, tt.wantName)
			}
		})
	}
}
