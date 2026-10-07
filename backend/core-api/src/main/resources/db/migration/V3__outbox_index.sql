-- V3: Add partial index on outbox_events for pending event poller
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events (created_at ASC)
  WHERE published_at IS NULL;
