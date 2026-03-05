package handler

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// HealthHandler handles health and readiness check endpoints.
type HealthHandler struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

// NewHealthHandler creates a new HealthHandler.
func NewHealthHandler(db *pgxpool.Pool, redisClient *redis.Client) *HealthHandler {
	return &HealthHandler{db: db, redis: redisClient}
}

// Health handles GET /health — basic liveness check.
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	RespondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// Ready handles GET /ready — checks DB and Redis connectivity.
func (h *HealthHandler) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	type checkResult struct {
		status string
		err    error
	}

	dbOK := "ok"
	if err := h.db.Ping(ctx); err != nil {
		slog.Error("db health check failed", "error", err)
		dbOK = "error"
	}

	redisOK := "ok"
	if h.redis != nil {
		if err := h.redis.Ping(ctx).Err(); err != nil {
			slog.Error("redis health check failed", "error", err)
			redisOK = "error"
		}
	} else {
		redisOK = "not configured"
	}

	status := "ok"
	httpStatus := http.StatusOK
	if dbOK != "ok" || (redisOK != "ok" && redisOK != "not configured") {
		status = "degraded"
		httpStatus = http.StatusServiceUnavailable
	}

	RespondJSON(w, httpStatus, map[string]string{
		"status": status,
		"db":     dbOK,
		"redis":  redisOK,
	})
}
