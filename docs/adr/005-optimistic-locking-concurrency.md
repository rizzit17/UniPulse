# ADR 005: Optimistic Locking with ETag and If-Match

## Status
Accepted

## Context
When two users (such as an admin and a department head) edit the same service request concurrently, blind updates risk lost updates (last-write-wins overwriting earlier edits). Pessimistic locking (`SELECT FOR UPDATE`) holds database locks across user think-time or API transactions, introducing latency and deadlock hazards.

## Decision
Adopt optimistic locking using JPA `@Version` on `ServiceRequest`, exposed via HTTP `ETag` and validated via `If-Match: <version>`.

## Consequences
### Positive
- Zero row locking overhead during reads.
- Concurrent updates detect stale versions immediately and reject with `409 Conflict` (`STALE_VERSION`).
- The frontend can show a clean conflict resolution banner displaying the newly modified state.

### Negative / Trade-offs
- The client must include `If-Match` headers on update operations.
- Stale transactions must be retried by the client.
