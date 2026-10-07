-- UniPulse V1 Schema Baseline
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- Sequence for public request IDs (e.g. UP-2026-100001)
CREATE SEQUENCE IF NOT EXISTS request_public_id_seq START WITH 100001;

CREATE TABLE departments (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  head_user_id UUID NULL
);

CREATE TABLE users (
  id            UUID PRIMARY KEY,
  campus_id     SMALLINT NOT NULL DEFAULT 1,
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('REQUESTER','TECHNICIAN','DEPT_HEAD','ADMIN')),
  department_id UUID NULL REFERENCES departments(id),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint for departments.head_user_id
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_head_user FOREIGN KEY (head_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  default_priority TEXT NOT NULL
);

CREATE TABLE sla_policies (
  priority TEXT PRIMARY KEY,
  respond_minutes INT NOT NULL,
  resolve_minutes INT NOT NULL
);

CREATE TABLE technician_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skills TEXT[] NOT NULL DEFAULT '{}',
  shift_start TIME,
  shift_end TIME,
  max_active INT NOT NULL DEFAULT 8
);

CREATE TABLE service_requests (
  id              UUID PRIMARY KEY,
  public_id       TEXT UNIQUE NOT NULL,
  requester_id    UUID NOT NULL REFERENCES users(id),
  category_id     UUID NOT NULL REFERENCES categories(id),
  department_id   UUID NOT NULL REFERENCES departments(id),
  assignee_id     UUID NULL REFERENCES users(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  location_block  TEXT NOT NULL,
  location_room   TEXT,
  status          TEXT NOT NULL,
  priority        TEXT NOT NULL,
  respond_by      TIMESTAMPTZ NOT NULL,
  resolve_by      TIMESTAMPTZ NOT NULL,
  sla_paused_at   TIMESTAMPTZ NULL,
  sla_paused_total_seconds INT NOT NULL DEFAULT 0,
  escalation_level SMALLINT NOT NULL DEFAULT 0,
  version         BIGINT NOT NULL DEFAULT 0,
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ NULL
);

CREATE TABLE request_history (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE request_comments (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ NULL
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  replaced_by UUID NULL
);

CREATE TABLE processed_events (
  consumer TEXT NOT NULL,
  event_id UUID NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (consumer, event_id)
);

-- Optimized partial indexes
CREATE INDEX idx_req_requester_created ON service_requests (requester_id, created_at DESC, id DESC);

CREATE INDEX idx_req_dept_active ON service_requests (department_id, priority, created_at)
  WHERE status IN ('OPEN','ASSIGNED','IN_PROGRESS','ON_HOLD');

CREATE INDEX idx_req_assignee_active ON service_requests (assignee_id)
  WHERE status IN ('ASSIGNED','IN_PROGRESS');

CREATE INDEX idx_req_sla ON service_requests (resolve_by)
  WHERE status IN ('OPEN','ASSIGNED','IN_PROGRESS');

CREATE INDEX idx_req_search ON service_requests USING GIN (search_vector);

CREATE INDEX idx_outbox_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;

CREATE INDEX idx_req_dedupe ON service_requests (requester_id, category_id, location_block, location_room, created_at DESC);
