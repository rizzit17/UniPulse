# ADR 001: PostgreSQL for Primary Relational Domain Store

## Status
Accepted

## Context
UniPulse manages transactional entities with strict relationship constraints: users, departments, categories, technician shifts, service requests, and history. State machine transitions require atomic updates, multi-row consistency (creating a request, recording history, and inserting outbox events in a single database transaction), and partial indexing.

## Decision
Use PostgreSQL 16 as the primary OLTP data store for the `core` schema.

## Consequences
### Positive
- ACID transaction guarantees ensure that request creation, status updates, and transactional outbox entries are committed atomically.
- Partial indexes (e.g. active requests per department or SLA deadlines) keep hot query indexes compact even as terminal closed requests grow.
- Optimistic locking with `@Version` prevents concurrent overwrite conflicts.

### Negative / Trade-offs
- Requires structured schema migrations via Flyway.
- Horizontal write scaling requires read replicas and connection pooling (PgBouncer/HikariCP).
