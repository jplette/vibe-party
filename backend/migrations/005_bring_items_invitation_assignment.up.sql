ALTER TABLE bring_items
    ADD COLUMN assigned_invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL;

ALTER TABLE bring_items
    ADD CONSTRAINT bring_items_assignment_exclusive
    CHECK (assigned_to IS NULL OR assigned_invitation_id IS NULL);

CREATE INDEX idx_bring_items_assigned_invitation_id ON bring_items(assigned_invitation_id)
    WHERE assigned_invitation_id IS NOT NULL;
