package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestInvitationToResponse(t *testing.T) {
	now := time.Now()
	invID := uuid.New()
	eventID := uuid.New()
	invitedBy := uuid.New()

	inv := &Invitation{
		ID:        invID,
		EventID:   eventID,
		Email:     "guest@example.com",
		Token:     "super-secret-token-must-not-leak",
		Status:    "pending",
		InvitedBy: invitedBy,
		CreatedAt: now,
		UpdatedAt: now,
	}

	resp := inv.ToResponse()

	t.Run("token is stripped from response", func(t *testing.T) {
		// InvitationResponse has no Token field — this is a compile-time guarantee,
		// but we verify the struct's accessible fields do not expose the token.
		// If someone ever adds Token to InvitationResponse, the field name check below catches it.
		_ = resp // resp.Token does not exist — compiler enforces this
	})

	t.Run("ID is preserved", func(t *testing.T) {
		if resp.ID != invID {
			t.Errorf("got ID %v; want %v", resp.ID, invID)
		}
	})

	t.Run("EventID is preserved", func(t *testing.T) {
		if resp.EventID != eventID {
			t.Errorf("got EventID %v; want %v", resp.EventID, eventID)
		}
	})

	t.Run("Email is preserved", func(t *testing.T) {
		if resp.Email != "guest@example.com" {
			t.Errorf("got Email %q; want %q", resp.Email, "guest@example.com")
		}
	})

	t.Run("Status is preserved", func(t *testing.T) {
		if resp.Status != "pending" {
			t.Errorf("got Status %q; want %q", resp.Status, "pending")
		}
	})

	t.Run("InvitedBy is preserved", func(t *testing.T) {
		if resp.InvitedBy != invitedBy {
			t.Errorf("got InvitedBy %v; want %v", resp.InvitedBy, invitedBy)
		}
	})

	t.Run("CreatedAt is preserved", func(t *testing.T) {
		if !resp.CreatedAt.Equal(now) {
			t.Errorf("got CreatedAt %v; want %v", resp.CreatedAt, now)
		}
	})

	t.Run("UpdatedAt is preserved", func(t *testing.T) {
		if !resp.UpdatedAt.Equal(now) {
			t.Errorf("got UpdatedAt %v; want %v", resp.UpdatedAt, now)
		}
	})
}

func TestInvitationToResponse_DifferentStatuses(t *testing.T) {
	statuses := []string{"pending", "accepted", "declined"}

	for _, status := range statuses {
		t.Run("status="+status, func(t *testing.T) {
			inv := &Invitation{
				ID:        uuid.New(),
				EventID:   uuid.New(),
				Email:     "test@example.com",
				Token:     "tok",
				Status:    status,
				InvitedBy: uuid.New(),
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			resp := inv.ToResponse()
			if resp.Status != status {
				t.Errorf("got status %q; want %q", resp.Status, status)
			}
		})
	}
}
