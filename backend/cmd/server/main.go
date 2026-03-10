package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/vibe-party/backend/internal/config"
	"github.com/vibe-party/backend/internal/email"
	"github.com/vibe-party/backend/internal/handler"
	"github.com/vibe-party/backend/internal/middleware"
	"github.com/vibe-party/backend/internal/repository"
	"github.com/vibe-party/backend/internal/service"
)

func main() {
	// Bootstrap logger (JSON INFO) — used before config is loaded.
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	// Load configuration.
	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load config", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Switch to human-readable text logger with debug level in development.
	if cfg.AppEnv == "development" {
		logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
		slog.SetDefault(logger)
	}

	// Connect to PostgreSQL.
	db, err := connectDB(cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer db.Close()
	logger.Info("connected to PostgreSQL")

	// Run migrations.
	if err := runMigrations(cfg.DatabaseURL, logger); err != nil {
		logger.Error("migration failed", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Connect to Redis.
	var redisClient *redis.Client
	redisClient, err = connectRedis(cfg.RedisURL)
	if err != nil {
		// Redis is not critical for startup — log warning and continue.
		logger.Warn("failed to connect to Redis; JWKS caching disabled", slog.String("error", err.Error()))
		redisClient = nil
	} else {
		logger.Info("connected to Redis")
	}

	// Wire up repositories.
	userRepo := repository.NewUserRepository(db)
	eventRepo := repository.NewEventRepository(db)
	todoRepo := repository.NewTodoRepository(db)
	itemRepo := repository.NewItemRepository(db)
	invRepo := repository.NewInvitationRepository(db)

	// Wire up email service.
	emailSvc := email.NewService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPFrom, cfg.FrontendURL)

	// Wire up services.
	userSvc := service.NewUserService(userRepo, eventRepo)
	eventSvc := service.NewEventService(eventRepo)
	todoSvc := service.NewTodoService(todoRepo, eventRepo, invRepo, userRepo, emailSvc)
	itemSvc := service.NewItemService(itemRepo, eventRepo)
	invSvc := service.NewInvitationService(invRepo, eventRepo, userRepo, todoRepo, emailSvc)

	// Wire up handlers.
	healthHandler := handler.NewHealthHandler(db, redisClient)
	userHandler := handler.NewUserHandler(userSvc)
	eventHandler := handler.NewEventHandler(eventSvc)
	todoHandler := handler.NewTodoHandler(todoSvc)
	itemHandler := handler.NewItemHandler(itemSvc)
	invHandler := handler.NewInvitationHandler(invSvc)

	// Build middleware.
	jwtAuth := middleware.JWTAuth(cfg.KeycloakIssuer, cfg.KeycloakInternalURL, cfg.KeycloakClientID, redisClient, userSvc, invSvc, logger)
	corsMiddleware := middleware.CORS(cfg.CORSAllowedOrigins)
	rateLimiter := middleware.RateLimiter(100)
	// Stricter rate limiter for invitation endpoint (20 req/min).
	invitationRateLimiter := middleware.RateLimiter(20)

	// Build router.
	r := chi.NewRouter()

	// Global middleware chain: Recovery → RequestID → Logging → CORS → RateLimit
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(middleware.RequestLogger(logger))
	r.Use(corsMiddleware)
	r.Use(rateLimiter)

	// Health endpoints (no auth).
	r.Get("/health", healthHandler.Health)
	r.Get("/ready", healthHandler.Ready)

	// API v1 routes.
	r.Route("/api/v1", func(r chi.Router) {
		// Public invitation endpoints — no JWT required.
		r.Post("/invitations/accept", invHandler.AcceptInvitation)
		r.Post("/invitations/decline", invHandler.DeclineInvitation)

		// All other API routes require JWT authentication.
		r.Group(func(r chi.Router) {
			r.Use(jwtAuth)

			// Users.
			r.Get("/users/me", userHandler.GetMe)
			r.Get("/users/{id}", userHandler.GetByID)

			// Events.
			r.Get("/events", eventHandler.ListEvents)
			r.Post("/events", eventHandler.CreateEvent)
			r.Get("/events/{id}", eventHandler.GetEvent)
			r.Put("/events/{id}", eventHandler.UpdateEvent)
			r.Delete("/events/{id}", eventHandler.DeleteEvent)

			// Members (nested under events).
			r.Get("/events/{id}/members", eventHandler.ListMembers)

			// Todos (nested under events).
			r.Get("/events/{id}/todos", todoHandler.ListTodos)
			r.Post("/events/{id}/todos", todoHandler.CreateTodo)
			r.Put("/events/{id}/todos/{tid}", todoHandler.UpdateTodo)
			r.Patch("/events/{id}/todos/{tid}/assign", todoHandler.AssignTodo)
			r.Patch("/events/{id}/todos/{tid}/due-date", todoHandler.SetDueDate)
			r.Patch("/events/{id}/todos/{tid}/complete", todoHandler.CompleteTodo)
			r.Delete("/events/{id}/todos/{tid}", todoHandler.DeleteTodo)

			// Bring items (nested under events).
			r.Get("/events/{id}/items", itemHandler.ListItems)
			r.Post("/events/{id}/items", itemHandler.CreateItem)
			r.Put("/events/{id}/items/{iid}", itemHandler.UpdateItem)
			r.Patch("/events/{id}/items/{iid}/assign", itemHandler.AssignItem)
			r.Patch("/events/{id}/items/{iid}/fulfill", itemHandler.FulfillItem)
			r.Delete("/events/{id}/items/{iid}", itemHandler.DeleteItem)

			// Invitations (nested under events, with stricter rate limit).
			r.With(invitationRateLimiter).Post("/events/{id}/invitations", invHandler.SendInvitation)
			r.Get("/events/{id}/invitations", invHandler.ListInvitations)
			r.Delete("/events/{id}/invitations/{inv_id}", invHandler.CancelInvitation)
		})
	})

	// Start server with graceful shutdown.
	srv := &http.Server{
		Addr:         ":" + cfg.AppPort,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Channel to receive OS signals.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Start server in background.
	go func() {
		logger.Info("server starting", slog.String("addr", srv.Addr), slog.String("env", cfg.AppEnv))
		if listenErr := srv.ListenAndServe(); listenErr != nil && listenErr != http.ErrServerClosed {
			logger.Error("server error", slog.String("error", listenErr.Error()))
			os.Exit(1)
		}
	}()

	// Wait for shutdown signal.
	<-quit
	logger.Info("shutdown signal received, draining connections...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("graceful shutdown failed", slog.String("error", err.Error()))
	} else {
		logger.Info("server shutdown complete")
	}
}

// connectDB opens a pgx connection pool with retry logic.
func connectDB(databaseURL string) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse db config: %w", err)
	}

	cfg.MaxConns = 25
	cfg.MinConns = 5
	cfg.MaxConnLifetime = time.Hour
	cfg.MaxConnIdleTime = 30 * time.Minute

	db, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("open db pool: %w", err)
	}

	if err := db.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	return db, nil
}

// connectRedis parses the Redis URL and pings to verify connectivity.
func connectRedis(redisURL string) (*redis.Client, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}

	client := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		client.Close()
		return nil, fmt.Errorf("ping redis: %w", err)
	}

	return client, nil
}

// runMigrations executes all pending database migrations.
// golang-migrate's pgx/v5 driver requires the "pgx5://" scheme, so we
// replace "postgres://" or "postgresql://" with "pgx5://".
func runMigrations(databaseURL string, logger *slog.Logger) error {
	migrateURL := toPgx5URL(databaseURL)

	m, err := migrate.New("file://migrations", migrateURL)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("run migrations: %w", err)
	}

	logger.Info("database migrations applied")
	return nil
}

// toPgx5URL converts a postgres:// or postgresql:// connection string to the
// pgx5:// scheme that golang-migrate's pgx/v5 driver requires.
func toPgx5URL(u string) string {
	switch {
	case strings.HasPrefix(u, "postgres://"):
		return "pgx5://" + u[len("postgres://"):]
	case strings.HasPrefix(u, "postgresql://"):
		return "pgx5://" + u[len("postgresql://"):]
	default:
		return u
	}
}
