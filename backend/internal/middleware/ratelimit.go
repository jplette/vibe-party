package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"sync"
	"time"
)

// tokenBucket is a simple in-memory token bucket rate limiter per IP.
type tokenBucket struct {
	mu       sync.Mutex
	buckets  map[string]*bucket
	capacity int
	window   time.Duration
}

type bucket struct {
	tokens    int
	lastReset time.Time
}

func newTokenBucket(ratePerMin int) *tokenBucket {
	return &tokenBucket{
		buckets:  make(map[string]*bucket),
		capacity: ratePerMin,
		window:   time.Minute,
	}
}

func (tb *tokenBucket) allow(key string) bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	now := time.Now()
	b, exists := tb.buckets[key]
	if !exists {
		tb.buckets[key] = &bucket{tokens: tb.capacity - 1, lastReset: now}
		return true
	}

	if now.Sub(b.lastReset) >= tb.window {
		b.tokens = tb.capacity
		b.lastReset = now
	}

	if b.tokens <= 0 {
		return false
	}
	b.tokens--
	return true
}

// RateLimiter returns a middleware that limits requests to ratePerMin per IP.
func RateLimiter(ratePerMin int) func(http.Handler) http.Handler {
	tb := newTokenBucket(ratePerMin)

	// Background goroutine to clean up stale bucket entries every 10 minutes.
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			tb.mu.Lock()
			cutoff := time.Now().Add(-10 * time.Minute)
			for key, b := range tb.buckets {
				if b.lastReset.Before(cutoff) {
					delete(tb.buckets, key)
				}
			}
			tb.mu.Unlock()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := extractIP(r)
			if !tb.allow(ip) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]string{"error": "rate limit exceeded"}) //nolint:errcheck
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func extractIP(r *http.Request) string {
	addr := r.RemoteAddr
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		return addr
	}
	return host
}
