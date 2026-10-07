# ADR 007: MongoDB for Denormalized Activity Feed and Notification Log

## Status
Accepted

## Context
Service request audit logs, status milestones, comments, and notifications generate continuous append-only event streams. Querying normalized relational tables with joins for rich timeline rendering adds overhead to the primary PostgreSQL OLTP database.

## Decision
Use MongoDB 7 as a document store for denormalized `activity_feed` timelines and `notification_log` collections, illustrating polyglot persistence where each database handles the access pattern it was designed for.

## Consequences
### Positive
- Appending timeline events is fast and schema-flexible.
- Timeline UI requests can fetch a complete, pre-formatted document by `requestId` in a single query without joining multiple tables.
- Shields PostgreSQL OLTP tables from high-frequency UI polling.

### Negative / Trade-offs
- An additional database technology is maintained in the operational infrastructure.
- Activity documents must be synchronized via Kafka domain events.
