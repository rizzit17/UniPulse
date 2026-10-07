# ADR 006: Cursor-Based Pagination for Request Lists

## Status
Accepted

## Context
Traditional offset-based pagination (`LIMIT 20 OFFSET 5000`) suffers from performance degradation as offset increases (O(N) row scanning in PostgreSQL) and introduces phantom or duplicate items when rows are inserted or modified while the user pages through results.

## Decision
Implement cursor-based keyset pagination on list endpoints using an opaque base64-encoded tuple of `(created_at, id)`.
Queries execute as:
```sql
WHERE (created_at, id) < (:cursorTimestamp, :cursorId)
ORDER BY created_at DESC, id DESC
LIMIT :limit + 1
```

## Consequences
### Positive
- Keyset index seeks on `(created_at, id)` remain O(log N) regardless of pagination depth.
- Prevents row skipping or duplication when new requests are raised in real-time.

### Negative / Trade-offs
- Random access to arbitrary page numbers (e.g. "jump to page 47") is not supported directly; pagination is strictly forward/backward cursor navigation.
