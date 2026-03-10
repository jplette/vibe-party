DROP INDEX IF EXISTS idx_bring_items_assigned_invitation_id;
ALTER TABLE bring_items DROP CONSTRAINT IF EXISTS bring_items_assignment_exclusive;
ALTER TABLE bring_items DROP COLUMN IF EXISTS assigned_invitation_id;
