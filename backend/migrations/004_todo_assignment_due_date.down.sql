DROP INDEX IF EXISTS idx_todos_assigned_invitation_id;
ALTER TABLE todos
    DROP CONSTRAINT IF EXISTS todos_assignment_exclusive,
    DROP COLUMN IF EXISTS assigned_invitation_id,
    DROP COLUMN IF EXISTS due_date;
