# UniPulse — Architectural & Implementation Assumptions

This document records the foundational assumptions and operational decisions for the UniPulse platform.

## 1. Project Identity & Naming
- The project identifier is **UniPulse** (superseding the working title "CampusFlow").
- Root Java package: `com.unipulse`.
- Maven groupId: `com.unipulse`.
- Module artifact naming: `unipulse-common`, `unipulse-core-api`, `unipulse-assignment-service`, `unipulse-notification-service`, `unipulse-analytics-service`, `unipulse-sla-watcher`.
- Public request ID format: `UP-YYYY-NNNNNN` (e.g. `UP-2026-000123`), starting at 100000 with atomic sequence generation.

## 2. Architecture & Modules
- Modular monolith core (`core-api`) with extracted async worker services (`assignment-service`, `notification-service`, `analytics-service`) and serverless check (`sla-watcher`).
- Package-by-feature in `core-api`: features communicate across package boundaries via service interfaces only, never touching sibling repositories or JPA entities.
- Transactional Outbox pattern: all domain events are written to `outbox_events` within the primary database transaction. The `OutboxRelay` polls with `FOR UPDATE SKIP LOCKED` and publishes to Kafka.
- Consumer idempotency: Kafka consumers verify and log messages in `processed_events` (`consumer`, `event_id`).

## 3. Data Storage & Schema
- Primary relational store: PostgreSQL 16 (or compatible) for ACID consistency, optimistic locking (`@Version`), and partial indexing.
- Document store: MongoDB 7 for append-heavy activity timelines and notification logs.
- In-memory cache & coordination: Redis 7 for cache-aside, login/API rate limiting, token blacklist, and technician workload min-heaps (`workload:{deptId}`).
- Schema migrations: Flyway versioned migrations (`V1__...sql`). `ddl-auto` is set to `validate`.

## 4. Default SLAs & Priority Calculation
- P1 (Critical): Respond within 15 min, resolve within 4 hours. Load weight = 5.
- P2 (High): Respond within 1 hour, resolve within 12 hours. Load weight = 3.
- P3 (Medium): Respond within 4 hours, resolve within 48 hours. Load weight = 2.
- P4 (Low): Respond within 24 hours, resolve within 7 days. Load weight = 1.
- SLA Pause: Entering `ON_HOLD` captures `sla_paused_at`. Leaving `ON_HOLD` extends `resolve_by` and `respond_by` by the pause duration.

## 5. Security & Tokens
- Access token lifetime: 15 minutes (stateless HMAC-SHA256 in development/testing, RSA in production).
- Refresh token lifetime: 7 days, rotated on each refresh. Refresh token hashes are stored in the database.
- Refresh token reuse detection: if an already-replaced refresh token is used, the entire token family is immediately revoked.
- Blacklist: access token `jti` is stored in Redis upon explicit logout until token expiry.
