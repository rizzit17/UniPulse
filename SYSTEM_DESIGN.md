# CampusFlow — System Design

This document answers the "how does it actually work and scale" questions. Each section ends with the interview-ready reasoning.

---

## 1. Capacity Estimation (design target: 1M registered users)

Assumptions: 1M users, 5% DAU = 50k, each DAU creates 0.1 requests/day and views 10 pages/day.

| Metric | Calculation | Result |
|---|---|---|
| Writes/day | 50k × 0.1 | ~5k requests/day (plus ~5× updates/comments = 25k writes/day) |
| Reads/day | 50k × 10 | 500k reads/day |
| Peak read RPS | 500k / 86400 × 10 (peak factor) | ~60 RPS |
| Peak write RPS | 25k / 86400 × 10 | ~3 RPS |
| Storage (requests) | 5k/day × 2 KB × 365 | ~3.6 GB/yr |
| Storage (history + comments) | ~10× rows × 0.5 KB | ~10 GB/yr |
| Attachments | 20% × 5k × 1 MB × 365 | ~365 GB/yr (S3) |

Conclusion: steady-state load is modest. The architecture is sized for **bursts** (exam week, monsoon outage floods, a campus-wide WiFi failure generating 5k requests in 10 minutes ≈ 8 RPS sustained, spikes of 100+ RPS). Load-test target of 1,000 RPS gives >10× headroom.

## 2. Data Model (PostgreSQL, `core` schema)

```sql
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

CREATE TABLE departments (
  id UUID PRIMARY KEY, name TEXT UNIQUE NOT NULL, head_user_id UUID NULL
);

CREATE TABLE categories (
  id UUID PRIMARY KEY, name TEXT UNIQUE NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  default_priority TEXT NOT NULL
);

CREATE TABLE sla_policies (
  priority TEXT PRIMARY KEY, respond_minutes INT NOT NULL, resolve_minutes INT NOT NULL
);

CREATE TABLE technician_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  skills TEXT[] NOT NULL DEFAULT '{}',
  shift_start TIME, shift_end TIME,
  max_active INT NOT NULL DEFAULT 8
);

CREATE TABLE service_requests (
  id              UUID PRIMARY KEY,
  public_id       TEXT UNIQUE NOT NULL,          -- CF-2026-000123
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
  version         BIGINT NOT NULL DEFAULT 0,      -- optimistic lock
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ NULL
);

CREATE TABLE request_history (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES service_requests(id),
  actor_id UUID NOT NULL, field TEXT NOT NULL,
  old_value TEXT, new_value TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE request_comments (
  id UUID PRIMARY KEY, request_id UUID NOT NULL REFERENCES service_requests(id),
  author_id UUID NOT NULL, body TEXT NOT NULL,
  internal BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY, aggregate_id UUID NOT NULL, type TEXT NOT NULL,
  payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ NULL
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY, user_id UUID NOT NULL, family_id UUID NOT NULL,
  token_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE, replaced_by UUID NULL
);

CREATE TABLE processed_events (        -- consumer idempotency
  consumer TEXT NOT NULL, event_id UUID NOT NULL, processed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (consumer, event_id)
);
```

### Indexes (each justified)

```sql
-- Requester "my requests", newest first, cursor pagination
CREATE INDEX idx_req_requester_created ON service_requests (requester_id, created_at DESC, id DESC);

-- Department queue: only active rows, ordered by urgency
CREATE INDEX idx_req_dept_active ON service_requests (department_id, priority, created_at)
  WHERE status IN ('OPEN','ASSIGNED','IN_PROGRESS','ON_HOLD');

-- Technician workload
CREATE INDEX idx_req_assignee_active ON service_requests (assignee_id)
  WHERE status IN ('ASSIGNED','IN_PROGRESS');

-- SLA watcher scans only unresolved rows by deadline
CREATE INDEX idx_req_sla ON service_requests (resolve_by)
  WHERE status IN ('OPEN','ASSIGNED','IN_PROGRESS');

-- Full text
CREATE INDEX idx_req_search ON service_requests USING GIN (search_vector);

-- Outbox relay
CREATE INDEX idx_outbox_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;

-- Duplicate detection
CREATE INDEX idx_req_dedupe ON service_requests (requester_id, category_id, location_block, location_room, created_at DESC);
```

Partial indexes keep hot indexes tiny because 90%+ of rows are eventually `CLOSED`.

## 3. API Design

Base: `/api/v1`. JSON. Errors follow RFC 7807 `application/problem+json` with `code`, `traceId`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | public | |
| POST | `/auth/login` | public | rate-limited |
| POST | `/auth/refresh` | refresh token | rotation |
| POST | `/auth/logout` | JWT | blacklists `jti` |
| POST | `/requests` | JWT | `Idempotency-Key` header supported |
| GET | `/requests?status=&priority=&cursor=&limit=` | JWT | scope depends on role |
| GET | `/requests/{id}` | JWT + ownership | ETag = version |
| PATCH | `/requests/{id}` | JWT | requires `If-Match: <version>`; 412/409 on stale |
| POST | `/requests/{id}/transitions` | Tech/Head/Admin | body: `{to, reason}` |
| POST | `/requests/{id}/assign` | Head/Admin | manual reassign |
| GET/POST | `/requests/{id}/comments` | JWT | |
| GET | `/requests/{id}/history` | JWT | |
| POST | `/requests/{id}/rating` | Requester | only when CLOSED |
| POST | `/attachments/presign` | JWT | returns S3 presigned PUT |
| GET | `/notifications/stream` | JWT | SSE |
| GET | `/analytics/overview`, `/analytics/sla`, `/analytics/hotspots`, `/analytics/workload` | Head/Admin | |
| CRUD | `/admin/departments`, `/admin/categories`, `/admin/routing-rules`, `/admin/sla-policies`, `/admin/users` | Admin | |
| POST | `/internal/sla/sweep` | service token | called by Lambda |

Cursor format: opaque base64 of `(created_at, id)`. Query: `WHERE (created_at, id) < (:ts, :id) ORDER BY created_at DESC, id DESC LIMIT :n+1`.

## 4. Request Creation Flow

```
1. POST /requests (JWT, Idempotency-Key)
2. Validate DTO, check Redis idempotency key → return stored response if present
3. Duplicate check (30 min window) → return existing if found
4. Resolve category → department (Redis cache-aside, TTL 10 min)
5. Compute priority + respond_by/resolve_by from sla_policies (cached)
6. BEGIN TX
     insert service_requests (status=OPEN)
     insert request_history
     insert outbox_events (request.created.v1)
   COMMIT
7. Return 201 (public_id, status OPEN)  ← user never waits on assignment
8. OutboxRelay polls (FOR UPDATE SKIP LOCKED), publishes to Kafka, marks published
9. assignment-service consumes → picks technician → calls core-api
   PATCH-assign internal endpoint (or updates via shared contract) → status ASSIGNED
10. notification-service consumes request.assigned → in-app + email
```

## 5. Smart Assignment

### Routing
`category → department` via `categories.department_id`, overridden by `routing_rules` (keyword/location match, evaluated by priority order).

### Technician selection

Weighted load: `load = Σ weight(priority)` over active requests; weights P1=5, P2=3, P3=2, P4=1.

Eligibility filter: active, same department, on shift now, has required skill, `activeCount < max_active`.

Choose min load; tie-break by oldest last-assigned time.

Data structure: per-department **min-heap** keyed by `(load, lastAssignedAt)` kept in Redis sorted set `workload:{deptId}` (score = load). `ZRANGE 0 N` gives candidates in O(log n + N); filter eligibility in memory.

Race protection: two assignment workers could pick the same technician simultaneously. This is acceptable for load balance (slightly uneven) but **not** for double-assigning one request. The latter is prevented by:
1. Kafka key = requestId, so one partition, one consumer.
2. DB guard: `UPDATE service_requests SET assignee_id=?, status='ASSIGNED', version=version+1 WHERE id=? AND status='OPEN' AND assignee_id IS NULL` — affected rows = 0 means already handled, consumer acks and moves on.

Redis workload counters are rebuilt from Postgres nightly and on mismatch (reconciliation job).

## 6. Concurrency: "Two admins edit the same request"

Layered approach:

1. **Optimistic locking** — `@Version` on `ServiceRequest`. Client sends `If-Match: <version>`. Hibernate issues `UPDATE ... WHERE id=? AND version=?`. Zero rows → `OptimisticLockException` → mapped to `409 STALE_VERSION` with the current representation, so the UI can show "Rahul changed this 12 seconds ago, review diff".
2. **State machine guard** — even with a fresh version, illegal transitions are rejected.
3. **Atomic conditional updates** for hot paths (assignment, status change) as shown above.
4. **Pessimistic lock** (`SELECT ... FOR UPDATE`) used only in the outbox relay and the SLA sweep, where we want exclusive batch ownership (`SKIP LOCKED`).

Why optimistic: contention per request is very low (a handful of actors), so avoiding held row locks gives better throughput and no deadlock risk; conflicts are rare and user-visible.

Test: JUnit + Testcontainers spawns 50 threads updating the same request; assert exactly one winner per version and zero lost updates.

## 7. SLA Engine

- Deadlines are stored on the row at creation.
- Pause: entering `ON_HOLD` stores `sla_paused_at`; leaving adds elapsed seconds to `sla_paused_total_seconds` and pushes `respond_by`/`resolve_by` forward by that amount.
- **Sweep** (Lambda every minute → `POST /internal/sla/sweep`): 
  - `SELECT ... WHERE status IN (...) AND resolve_by - now() < 25% window AND escalation_level = 0 FOR UPDATE SKIP LOCKED LIMIT 500` → warning events.
  - Same for breach (`resolve_by < now()`) → bump escalation level, bump priority one step, emit `sla.breached.v1`.
- Escalation chain: Technician (L0) → Dept Head (L1) → Admin (L2).
- Idempotent: `escalation_level` is the guard; a sweep run twice does not double-escalate.
- Complexity: indexed range scan on `idx_req_sla`; cost proportional to rows near deadline, not table size.

## 8. Caching Strategy (Redis)

| Key | Pattern | TTL | Invalidation |
|---|---|---|---|
| `cat:all`, `dept:all`, `route:rules` | cache-aside | 10 min | evict on admin write |
| `sla:policy:{priority}` | cache-aside | 1 h | evict on admin write |
| `req:{id}` | cache-aside (read-through for GET) | 60 s | evict on any write to that request |
| `rl:login:{ip}:{email}` | token bucket | 60 s | auto |
| `rl:api:{userId}` | sliding window | 60 s | auto |
| `jwt:bl:{jti}` | blacklist | token remaining TTL | auto |
| `idem:{key}` | stored response | 24 h | auto |
| `workload:{deptId}` | ZSET | none | updated on assign/resolve + nightly rebuild |

Pitfalls handled: cache stampede (single-flight with short Redis lock + jittered TTL), stale reads (evict-after-commit via `TransactionSynchronization`), penetration (negative caching of 404 for 10 s).

Never cached: lists filtered by user, anything requiring ownership checks without including user id in the key.

## 9. Kafka Design

- Producer: `acks=all`, `enable.idempotence=true`, `max.in.flight=5`, compression `lz4`.
- Delivery semantics: **at-least-once** + idempotent consumers (`processed_events` table keyed by `(consumer, eventId)`) = effectively-once effect.
- Consumer retries: `DefaultErrorHandler` with exponential backoff (1s, 2s, 4s, 8s), then publish to `<topic>.dlq` with error headers.
- Poison messages never block the partition.
- Lag metrics exported (Micrometer → Prometheus) and used as the ECS autoscaling signal for `assignment-service`.
- Schema evolution: `version` field in envelope, additive-only changes, tolerant reader.
- Outbox relay: batch 100, `FOR UPDATE SKIP LOCKED`, publish, mark `published_at`, sweep published rows older than 7 days.

Why Kafka over a direct call: request creation latency is independent of downstream health. If notification-service is down, requests are still created and notifications catch up when it recovers. Kafka also gives replay (rebuild analytics) and fan-out (three consumers, one event).

## 10. Notifications

- `notification-service` consumes events, resolves recipients (requester, assignee, dept head by rule), checks preferences, renders template, dispatches per channel.
- In-app: writes to MongoDB `notifications`, pushes via SSE. Multiple instances: Redis pub/sub fan-out so the instance holding the user's SSE connection delivers it.
- Email: SES with Resilience4j retry + circuit breaker; failure after retries → DLQ and `status=FAILED` in Mongo.
- Dedupe key `(eventId, userId, channel)` unique index in Mongo.

## 11. Analytics

- `analytics-service` consumes all request events and maintains:
  - `daily_request_stats(date, department_id, category_id, created, resolved, breached)`
  - `technician_stats(date, technician_id, assigned, resolved, avg_resolve_seconds)`
  - `hotspots(location_block, location_room, category_id, count_30d)`
- Upserts via `INSERT ... ON CONFLICT DO UPDATE`.
- Dashboards read these small tables. Heavy ad-hoc queries never touch the OLTP schema.
- MongoDB `activity_feed` stores a denormalized timeline per request for the UI.

## 12. Scaling Plan

| Stage | Users / load | Changes |
|---|---|---|
| **Now** | up to ~50k users, ~100 RPS | 2 core-api replicas, 1 RDS, 1 Redis, 3-broker or single Kafka |
| **Growth** | 500k users, ~500 RPS | Autoscale core-api (CPU/RPS), RDS read replica for list/search endpoints, PgBouncer, bump Kafka partitions, CDN for SPA |
| **1M+ users** | 1M users, ~2k RPS peak | Route reads to replicas (read/write split via routing datasource), Redis cluster mode, partition `request_history` and `service_requests` by month, archive CLOSED > 1 yr to S3/Parquet, per-campus sharding using `campus_id` as shard key if multi-campus |
| **Multi-campus** | many tenants | `campus_id` on every table, tenant filter in a Hibernate filter, shard by campus |

Bottleneck order and fix: (1) DB connection count → HikariCP tuning + PgBouncer; (2) hot list queries → partial indexes + cache + replica; (3) notification fan-out → Kafka consumer scaling; (4) attachments → direct-to-S3 presigned uploads so the API never proxies bytes.

Java-level notes: virtual threads (`spring.threads.virtual.enabled=true`) for blocking I/O heavy endpoints; bounded executors for CPU work; Hikari pool size sized by `connections = ((core_count × 2) + effective_spindle_count)` as baseline then measured.

## 13. Failure Modes

| Failure | Behavior |
|---|---|
| Kafka down | Requests still created; outbox accumulates; relay drains on recovery |
| Redis down | Cache bypass to DB; rate limiter fails **open** for reads, **closed** for login; alert fires |
| Notification service down | No user impact on creation; backlog drains later |
| Assignment service slow | Requests visible as OPEN in queue; Dept Head sees "unassigned > 2 min" badge |
| DB failover (Multi-AZ) | Hikari reconnect; in-flight writes retried by client with idempotency key |
| Duplicate event delivery | `processed_events` prevents double effect |
| Lambda missed run | Next run catches up since checks are time-based and idempotent |

## 14. Observability

- Logs: JSON, fields `ts, level, service, traceId, correlationId, userId, requestId, msg`. `correlationId` propagated through HTTP and Kafka headers.
- Metrics: RED (rate, errors, duration) per endpoint, Kafka consumer lag, outbox backlog size, cache hit ratio, SLA breach counter, assignment latency histogram.
- Health: `/actuator/health/liveness` and `/readiness` (DB, Redis, Kafka).
- Alerts: p95 > 500 ms 5 min, error rate > 2%, outbox backlog > 1000, consumer lag > 500, DLQ non-empty.
- Grafana dashboards committed under `infra/docker/grafana/`.

## 15. Testing Strategy

| Level | Tooling | What |
|---|---|---|
| Unit | JUnit 5, Mockito, AssertJ | State machine, assignment strategies, SLA math, priority rules |
| Integration | Spring Boot Test + Testcontainers (Postgres, Redis, Kafka, Mongo) | Repositories, outbox → Kafka → consumer, security rules |
| Concurrency | Executor + CountDownLatch | Optimistic locking, double assignment |
| Contract | JSON schema validation of event envelopes | Producer/consumer compatibility |
| API | REST Assured | Auth flows, RBAC matrix |
| Load | k6 | 1,000 RPS mixed workload, report committed |
| Security | OWASP dependency-check, ZAP baseline (optional) | |

## 16. Interview Q&A Cheat Sheet

**Why Redis?** Read-heavy reference data and hot request reads; also rate limiting, JWT blacklist and workload ZSET, which need atomic in-memory ops with TTL. DB stays the source of truth.

**Why PostgreSQL over MongoDB for core?** The domain is relational (users, departments, requests, history), needs multi-row ACID transactions (request + history + outbox), a constrained state machine, partial indexes and analytical joins. MongoDB is used where it fits: append-heavy activity feed and notification log.

**Why Kafka?** Decouple creation from assignment/notification, absorb bursts, fan out one event to three consumers, replay to rebuild analytics, preserve per-request ordering with key partitioning.

**How do you prevent two admins modifying the same request?** Optimistic locking with `@Version` plus `If-Match`, atomic conditional updates for transitions, and state-machine validation; conflicts return 409 with the latest state.

**How would you scale to 1M users?** Stateless replicas behind ALB, cache-aside, read replicas, partial indexes, cursor pagination, monthly partitioning, Kafka partition scaling, autoscale on lag, direct-to-S3 uploads, then campus-based sharding.

**How do you guarantee an event is published when the DB commit succeeds?** Transactional outbox: event row is written in the same transaction; a relay publishes it with at-least-once semantics and consumers dedupe.

**How would you deploy on AWS?** Containers on ECS Fargate behind an ALB, RDS Multi-AZ, ElastiCache, MSK, S3 + CloudFront for the SPA, Lambda + EventBridge for SLA sweeps, Secrets Manager, CloudWatch alarms, images in ECR, Terraform for infra, GitHub Actions deploy.

**What would you do differently with more time?** Replace keyword classification with an ML classifier behind the existing `ClassificationStrategy`, add CDC (Debezium) instead of polling outbox, add OpenTelemetry tracing.
