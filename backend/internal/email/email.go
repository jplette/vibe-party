package email

import (
	"fmt"
	"net/smtp"
	"strings"
)

// Service handles sending emails via SMTP.
type Service struct {
	host        string
	port        int
	from        string
	frontendURL string
}

// NewService creates a new email Service.
func NewService(host string, port int, from, frontendURL string) *Service {
	return &Service{
		host:        host,
		port:        port,
		from:        from,
		frontendURL: frontendURL,
	}
}

// SendTodoAssignment sends an HTML email notifying a recipient that a todo has been assigned to them.
func (s *Service) SendTodoAssignment(recipientEmail, eventName, todoTitle string) error {
	eventURL := fmt.Sprintf("%s/events", s.frontendURL)

	subject := fmt.Sprintf("You've been assigned a task for %s on Vibe Party!", eventName)
	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #efefd0;">
  <h1 style="color: #ff6b35;">New task assigned to you!</h1>
  <p>You have been assigned the following task for the event: <strong>%s</strong></p>
  <p style="font-size: 18px; font-weight: bold; color: #004e89;">%s</p>
  <p>Click the button below to view the event and your tasks:</p>
  <a href="%s" style="
    display: inline-block;
    background-color: #ff6b35;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
    margin: 16px 0;
  ">View Event</a>
  <p style="color: #6b7280; font-size: 14px;">
    Or copy this link: <a href="%s">%s</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px;">
    If you did not expect this assignment, please contact the event organizer.
  </p>
</body>
</html>`, eventName, todoTitle, eventURL, eventURL, eventURL)

	var msg strings.Builder
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	msg.WriteString(fmt.Sprintf("From: %s\r\n", s.from))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", recipientEmail))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	if err := smtp.SendMail(addr, nil, s.from, []string{recipientEmail}, []byte(msg.String())); err != nil {
		return fmt.Errorf("smtp send: %w", err)
	}
	return nil
}

// SendGuestRemoved sends an HTML email notifying a guest that they have been removed from an event.
func (s *Service) SendGuestRemoved(recipientEmail, eventName string) error {
	subject := fmt.Sprintf("You have been removed from %s on Vibe Party", eventName)
	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #efefd0;">
  <h1 style="color: #ff6b35;">You have been removed from an event</h1>
  <p>You have been removed from the event: <strong>%s</strong></p>
  <p>If you believe this was a mistake, please contact the event organizer.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px;">
    This is an automated notification from Vibe Party.
  </p>
</body>
</html>`, eventName)

	var msg strings.Builder
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	msg.WriteString(fmt.Sprintf("From: %s\r\n", s.from))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", recipientEmail))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	if err := smtp.SendMail(addr, nil, s.from, []string{recipientEmail}, []byte(msg.String())); err != nil {
		return fmt.Errorf("smtp send: %w", err)
	}
	return nil
}

// SendInvitation sends an HTML invitation email to the recipient.
func (s *Service) SendInvitation(recipientEmail, eventName, token string) error {
	acceptURL := fmt.Sprintf("%s/invitations/accept?token=%s", s.frontendURL, token)
	declineURL := fmt.Sprintf("%s/invitations/decline?token=%s", s.frontendURL, token)

	subject := fmt.Sprintf("You're invited to %s on Vibe Party!", eventName)
	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #ff6b35;">You've been invited!</h1>
  <p>You've been invited to join the event: <strong>%s</strong></p>
  <p>Click the button below to accept or decline your invitation:</p>
  <div style="margin: 16px 0;">
    <a href="%s" style="
      display: inline-block;
      background-color: #ff6b35;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin-right: 12px;
    ">Accept Invitation</a>
    <a href="%s" style="
      display: inline-block;
      background-color: #6b7280;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
    ">Decline</a>
  </div>
  <p style="color: #6b7280; font-size: 14px;">
    Or copy the accept link: <a href="%s">%s</a><br>
    Or copy the decline link: <a href="%s">%s</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px;">
    If you did not expect this invitation, you can safely ignore this email.
  </p>
</body>
</html>`, eventName, acceptURL, declineURL, acceptURL, acceptURL, declineURL, declineURL)

	// Build MIME message
	var msg strings.Builder
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	msg.WriteString(fmt.Sprintf("From: %s\r\n", s.from))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", recipientEmail))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	// SendMail with nil auth for unauthenticated relays (MailHog in dev)
	if err := smtp.SendMail(addr, nil, s.from, []string{recipientEmail}, []byte(msg.String())); err != nil {
		return fmt.Errorf("smtp send: %w", err)
	}
	return nil
}
