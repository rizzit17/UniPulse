CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.daily_request_stats (
    date DATE NOT NULL,
    department_id UUID NOT NULL,
    category_id UUID NOT NULL,
    created_count INT NOT NULL DEFAULT 0,
    resolved_count INT NOT NULL DEFAULT 0,
    breached_count INT NOT NULL DEFAULT 0,
    sla_warning_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (date, department_id, category_id)
);

CREATE TABLE IF NOT EXISTS analytics.technician_stats (
    date DATE NOT NULL,
    technician_id UUID NOT NULL,
    assigned_count INT NOT NULL DEFAULT 0,
    resolved_count INT NOT NULL DEFAULT 0,
    total_resolve_seconds BIGINT NOT NULL DEFAULT 0,
    avg_resolve_seconds INT NOT NULL DEFAULT 0,
    PRIMARY KEY (date, technician_id)
);

CREATE TABLE IF NOT EXISTS analytics.hotspots (
    location_block VARCHAR(64) NOT NULL,
    location_room VARCHAR(64) NOT NULL,
    category_id UUID NOT NULL,
    count_30d INT NOT NULL DEFAULT 0,
    last_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (location_block, location_room, category_id)
);

CREATE TABLE IF NOT EXISTS analytics.processed_events (
    consumer VARCHAR(128) NOT NULL,
    event_id UUID NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (consumer, event_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_dept ON analytics.daily_request_stats (department_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_technician_stats_tech ON analytics.technician_stats (technician_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_hotspots_count ON analytics.hotspots (count_30d DESC);
