ALTER TABLE todos
    ADD COLUMN due_date                TIMESTAMPTZ,
    ADD COLUMN assigned_invitation_id  UUID REFERENCES invitations(id) ON DELETE SET NULL;

ALTER TABLE todos
    ADD CONSTRAINT todos_assignment_exclusive
    CHECK (assigned_to IS NULL OR assigned_invitation_id IS NULL);

CREATE INDEX idx_todos_assigned_invitation_id ON todos(assigned_invitation_id)
    WHERE assigned_invitation_id IS NOT NULL;
