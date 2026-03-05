package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestTokenBucketAllow(t *testing.T) {
	t.Run("first request within capacity is allowed", func(t *testing.T) {
		tb := newTokenBucket(5)
		if !tb.allow("192.168.1.1") {
			t.Error("expected first request to be allowed")
		}
	})

	t.Run("requests up to capacity are allowed", func(t *testing.T) {
		capacity := 3
		tb := newTokenBucket(capacity)
		for i := 0; i < capacity; i++ {
			if !tb.allow("10.0.0.1") {
				t.Errorf("expected request %d to be allowed", i+1)
			}
		}
	})

	t.Run("request exceeding capacity is denied", func(t *testing.T) {
		capacity := 3
		tb := newTokenBucket(capacity)
		for i := 0; i < capacity; i++ {
			tb.allow("10.0.0.2")
		}
		if tb.allow("10.0.0.2") {
			t.Error("expected request beyond capacity to be denied")
		}
	})

	t.Run("different IPs have independent buckets", func(t *testing.T) {
		tb := newTokenBucket(1)
		tb.allow("1.1.1.1") // exhausts IP1's bucket
		// IP2 should still be allowed
		if !tb.allow("2.2.2.2") {
			t.Error("expected different IP to have its own bucket")
		}
	})

	t.Run("tokens reset after window elapses", func(t *testing.T) {
		tb := newTokenBucket(1)
		tb.allow("3.3.3.3") // exhaust
		if tb.allow("3.3.3.3") {
			t.Error("expected rate limit to be hit before reset")
		}

		// Manually rewind the lastReset to simulate window expiry.
		tb.mu.Lock()
		tb.buckets["3.3.3.3"].lastReset = time.Now().Add(-2 * time.Minute)
		tb.mu.Unlock()

		if !tb.allow("3.3.3.3") {
			t.Error("expected request to be allowed after window reset")
		}
	})
}

func TestRateLimiterMiddleware(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	t.Run("requests within limit pass through", func(t *testing.T) {
		mw := RateLimiter(10)(next)
		for i := 0; i < 5; i++ {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.RemoteAddr = "192.0.2.1:1234"
			w := httptest.NewRecorder()

			mw.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("request %d: got status %d; want %d", i+1, w.Code, http.StatusOK)
			}
		}
	})

	t.Run("exceeding limit returns 429 with JSON error", func(t *testing.T) {
		mw := RateLimiter(2)(next)
		const ip = "192.0.2.2:5678"

		// Exhaust the bucket.
		for i := 0; i < 2; i++ {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.RemoteAddr = ip
			mw.ServeHTTP(httptest.NewRecorder(), req)
		}

		// Next request should be rate-limited.
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = ip
		w := httptest.NewRecorder()
		mw.ServeHTTP(w, req)

		if w.Code != http.StatusTooManyRequests {
			t.Errorf("got status %d; want %d", w.Code, http.StatusTooManyRequests)
		}

		var body map[string]string
		if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if body["error"] != "rate limit exceeded" {
			t.Errorf("got error %q; want %q", body["error"], "rate limit exceeded")
		}
	})

	t.Run("different IPs are rate-limited independently", func(t *testing.T) {
		mw := RateLimiter(1)(next)

		// Exhaust IP1.
		req1 := httptest.NewRequest(http.MethodGet, "/", nil)
		req1.RemoteAddr = "10.0.0.1:1"
		mw.ServeHTTP(httptest.NewRecorder(), req1)
		req1Again := httptest.NewRequest(http.MethodGet, "/", nil)
		req1Again.RemoteAddr = "10.0.0.1:1"
		w1 := httptest.NewRecorder()
		mw.ServeHTTP(w1, req1Again)
		if w1.Code != http.StatusTooManyRequests {
			t.Errorf("expected IP1 to be rate-limited, got %d", w1.Code)
		}

		// IP2 should still be allowed.
		req2 := httptest.NewRequest(http.MethodGet, "/", nil)
		req2.RemoteAddr = "10.0.0.2:1"
		w2 := httptest.NewRecorder()
		mw.ServeHTTP(w2, req2)
		if w2.Code != http.StatusOK {
			t.Errorf("expected IP2 to be allowed, got %d", w2.Code)
		}
	})
}

func TestExtractIP(t *testing.T) {
	tests := []struct {
		name       string
		remoteAddr string
		wantIP     string
	}{
		{
			name:       "IPv4 with port",
			remoteAddr: "192.168.1.1:54321",
			wantIP:     "192.168.1.1",
		},
		{
			name:       "IPv6 with port",
			remoteAddr: "[::1]:8080",
			wantIP:     "::1",
		},
		{
			name:       "no port falls back to raw addr",
			remoteAddr: "192.168.1.1",
			wantIP:     "192.168.1.1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.RemoteAddr = tt.remoteAddr

			got := extractIP(req)
			if got != tt.wantIP {
				t.Errorf("got IP %q; want %q", got, tt.wantIP)
			}
		})
	}
}
