# ADR 003: Transactional Outbox Pattern for Domain Event Publishing

## Status
Accepted

## Context
When a service request is created or its state changes, external events (such as `request.created.v1`) must be published to Kafka. Publishing to Kafka directly inside the HTTP request database transaction (dual-write) creates two failure modes:
1. Database commit succeeds, but Kafka publishing fails (lost event).
2. Kafka publish succeeds, but database transaction rolls back (phantom event).

Using Spring's `@TransactionalEventListener(phase = AFTER_COMMIT)` reduces phantom events but still risks losing events if the application crashes between DB commit and network send.

## Decision
Implement the Transactional Outbox Pattern. An `outbox_events` record is written to PostgreSQL within the exact same database transaction that modifies the domain entity. An independent `OutboxRelay` background worker polls unpublished events with `SELECT ... FOR UPDATE SKIP LOCKED`, emits them to Kafka, and marks them `published_at = now()`.

## Consequences
### Positive
- Guarantees at-least-once publishing with zero lost events.
- Isolates API transaction performance and latency from Kafka broker availability.
- Enables safe replay of events if downstream consumers need reconstruction.

### Negative / Trade-offs
- Slight polling latency (typically 50-200ms) between DB commit and Kafka delivery.
- Consumers must be idempotent (`processed_events` table) to handle duplicate delivery.
