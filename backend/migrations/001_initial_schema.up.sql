-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- users
CREATE TABLE IF NOT EXISTS users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id TEXT        UNIQUE NOT NULL,
    email       TEXT        NOT NULL,
    name        TEXT        NOT NULL,
    global_role TEXT        NOT NULL DEFAULT 'user',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- events
CREATE TABLE IF NOT EXISTS events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    description TEXT,
    date        TIMESTAMPTZ,
    location    TEXT,
    created_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- event_members
CREATE TABLE IF NOT EXISTS event_members (
    event_id   UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT        NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- todos
CREATE TABLE IF NOT EXISTS todos (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id     UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title        TEXT        NOT NULL,
    description  TEXT,
    assigned_to  UUID        REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- bring_items
CREATE TABLE IF NOT EXISTS bring_items (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id     UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    quantity     TEXT,
    assigned_to  UUID        REFERENCES users(id) ON DELETE SET NULL,
    fulfilled_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- invitations
CREATE TABLE IF NOT EXISTS invitations (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email      TEXT        NOT NULL,
    token      TEXT        UNIQUE NOT NULL,
    status     TEXT        NOT NULL DEFAULT 'pending',
    invited_by UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_token    ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email    ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_event_members_event  ON event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_todos_event_id       ON todos(event_id);
CREATE INDEX IF NOT EXISTS idx_bring_items_event_id ON bring_items(event_id);
