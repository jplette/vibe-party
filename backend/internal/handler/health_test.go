package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestHealthHandlerHealth tests the /health liveness endpoint.
// It does not require a real DB or Redis — just exercises the handler directly.
func TestHealthHandlerHealth(t *testing.T) {
	// HealthHandler.Health doesn't use db or redis fields.
	h := &HealthHandler{}

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	h.Health(w, req)

	resp := w.Result()
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("got status %d; want %d", resp.StatusCode, http.StatusOK)
	}

	if ct := resp.Header.Get("Content-Type"); ct != "application/json" {
		t.Errorf("got Content-Type %q; want %q", ct, "application/json")
	}

	var body map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if body["status"] != "ok" {
		t.Errorf("got status %q; want %q", body["status"], "ok")
	}
}
