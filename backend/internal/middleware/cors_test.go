package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS(t *testing.T) {
	allowedOrigins := []string{
		"http://localhost:5173",
		"https://app.example.com",
	}

	// Sentinel next handler to verify it was called.
	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusOK)
	})

	mw := CORS(allowedOrigins)(next)

	t.Run("allowed origin sets ACAO header", func(t *testing.T) {
		nextCalled = false
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Origin", "http://localhost:5173")
		w := httptest.NewRecorder()

		mw.ServeHTTP(w, req)

		if !nextCalled {
			t.Error("expected next handler to be called")
		}
		if got := w.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
			t.Errorf("got ACAO %q; want %q", got, "http://localhost:5173")
		}
	})

	t.Run("disallowed origin does not set ACAO header", func(t *testing.T) {
		nextCalled = false
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Origin", "http://evil.com")
		w := httptest.NewRecorder()

		mw.ServeHTTP(w, req)

		if !nextCalled {
			t.Error("expected next handler to be called even for disallowed origin")
		}
		if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
			t.Errorf("expected no ACAO header for disallowed origin, got %q", got)
		}
	})

	t.Run("request without Origin header passes through", func(t *testing.T) {
		nextCalled = false
		req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
		w := httptest.NewRecorder()

		mw.ServeHTTP(w, req)

		if !nextCalled {
			t.Error("expected next handler to be called")
		}
	})

	t.Run("OPTIONS preflight returns 204 and does not call next", func(t *testing.T) {
		nextCalled = false
		req := httptest.NewRequest(http.MethodOptions, "/", nil)
		req.Header.Set("Origin", "http://localhost:5173")
		w := httptest.NewRecorder()

		mw.ServeHTTP(w, req)

		if nextCalled {
			t.Error("expected next handler NOT to be called for OPTIONS")
		}
		if w.Code != http.StatusNoContent {
			t.Errorf("got status %d; want %d", w.Code, http.StatusNoContent)
		}
	})

	t.Run("standard CORS headers always present", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Origin", "http://localhost:5173")
		w := httptest.NewRecorder()

		mw.ServeHTTP(w, req)

		headers := map[string]string{
			"Access-Control-Allow-Methods":     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
			"Access-Control-Allow-Headers":     "Content-Type, Authorization, X-Request-ID",
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Max-Age":           "86400",
		}
		for header, want := range headers {
			if got := w.Header().Get(header); got != want {
				t.Errorf("header %q: got %q; want %q", header, got, want)
			}
		}
	})

	t.Run("origin with trailing slash is normalized and allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Origin", "http://localhost:5173/")
		w := httptest.NewRecorder()

		mw.ServeHTTP(w, req)

		// The middleware normalizes both sides, so this should match.
		if got := w.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173/" {
			t.Errorf("got ACAO %q; want origin echoed back for allowed origin", got)
		}
	})

	t.Run("second allowed origin is accepted", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Origin", "https://app.example.com")
		w := httptest.NewRecorder()

		mw.ServeHTTP(w, req)

		if got := w.Header().Get("Access-Control-Allow-Origin"); got != "https://app.example.com" {
			t.Errorf("got ACAO %q; want %q", got, "https://app.example.com")
		}
	})
}
