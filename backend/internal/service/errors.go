package service

import "errors"

// Sentinel errors for the service layer. Handlers map these to HTTP status codes.
var (
	// ErrNotFound is returned when a resource does not exist.
	ErrNotFound = errors.New("not found")

	// ErrUnauthorized is returned when the request lacks valid credentials.
	ErrUnauthorized = errors.New("unauthorized")

	// ErrForbidden is returned when the authenticated user lacks permission.
	ErrForbidden = errors.New("forbidden")

	// ErrConflict is returned when an operation would create a duplicate.
	ErrConflict = errors.New("conflict")

	// ErrInvalidInput is returned when provided data fails business validation.
	ErrInvalidInput = errors.New("invalid input")
)
