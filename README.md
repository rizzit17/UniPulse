# UniPulse — Smart Campus Service Platform

**UniPulse** is a resilient, event-driven smart campus service platform built to automate maintenance, facilities, and IT complaint lifecycles across campus infrastructure. 

```
┌──────────────────────────────────────────────────────────────┐
│  UP-2026-000123  │  AC not cooling — Block C, Room 214       │
│  [P2 HIGH]       │  Status: IN_PROGRESS  │  SLA: 02:14:07    │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. Architecture Overview

UniPulse employs a modular monolith architecture for transactional domain integrity, with selectively extracted async microservices:

- **`unipulse-core-api`**: Primary transactional Spring Boot 3.3+ REST API (Users, Auth, Service Requests, Comments, Audit History, Transactional Outbox, SLA engine).
- **`unipulse-assignment-service`**: Event-driven smart technician assignment engine consuming `request.created.v1` via Kafka and managing workload min-heaps in Redis.
- **`unipulse-notification-service`**: Multi-channel notification dispatcher (SSE in-app timeline, SMTP/SES email).
- **`unipulse-analytics-service`**: Pre-aggregated metrics engine for department performance, technician workload, and hotspot reporting.
- **`unipulse-sla-watcher`**: Scheduled SLA breach detector and automated escalation engine.
- **`frontend/`**: Neo-brutalist sober operations dashboard (React 18, TypeScript, TanStack Query, Tailwind).

---

## 2. Technology Stack

- **Backend**: Java 21 (Virtual Threads enabled), Spring Boot 3.3+, Spring Data JPA / Hibernate 6, Spring Security 6 (Stateless JWT).
- **Primary Database**: PostgreSQL 16 with Flyway versioned migrations and partial indexes.
- **Caching & Locks**: Redis 7 (Cache-aside, rate limiting, token blacklist, workload sorted sets).
- **Event Streaming**: Apache Kafka 3.7+ (KRaft mode) with transactional outbox and consumer idempotency.
- **Document Store**: MongoDB 7 (activity feeds and audit events).
- **Observability**: Spring Boot Actuator, Micrometer, Prometheus, Grafana, structured JSON logging with MDC Correlation IDs.

---

## 3. Getting Started

### Prerequisites
- Java 21 JDK (or Java 22+)
- Docker & Docker Compose v2+
- Maven 3.9+ (or use the provided Maven wrapper)
- Node.js 20+ (for frontend)

### Quickstart (Infrastructure)

1. Start all infrastructure services (PostgreSQL, Redis, Kafka, MongoDB, Prometheus, Grafana, Kafka UI, MailHog):

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Verify service status:
```bash
docker compose -f infra/docker/docker-compose.yml ps
```

| Service | Port | Description |
|---|---|---|
| PostgreSQL 16 | `5432` | Primary OLTP database (`unipulse`) |
| Redis 7 | `6379` | Cache, rate limiter & locks |
| Kafka (KRaft) | `9092`, `29092` | Event streaming broker |
| MongoDB 7 | `27017` | Document store for activity feeds |
| Prometheus | `9090` | Metrics scraper |
| Grafana | `3000` | Dashboards (`admin` / `admin`) |
| Kafka UI | `8085` | Kafka topic and consumer inspector |
| MailHog | `8025` (UI), `1025` (SMTP) | Local email inbox |

### Running the Backend

From the project root:

```powershell
cd backend
mvn -B clean verify
```

To run `core-api`:
```powershell
mvn spring-boot:run -pl core-api
```

Once running:
- **Actuator Health**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **OpenAPI UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI Spec**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## 4. Key Endpoints

- `POST /api/v1/auth/register` — Register a student, staff, or department member.
- `POST /api/v1/auth/login` — Login with rate-limiting and receive rotating JWT + refresh token.
- `POST /api/v1/requests` — Raise a new service request with duplicate detection.
- `GET /api/v1/requests` — List requests with cursor pagination and role filters.
- `PATCH /api/v1/requests/{id}` — Optimistic-locking update with `If-Match` version check.
- `POST /api/v1/requests/{id}/transitions` — Transition status across the validated state machine.

---

## 5. Architectural Principles

1. **Transactional Outbox**: Never dual-write to database and Kafka. Domain events are committed in the primary transaction and relayed asynchronously using `SKIP LOCKED`.
2. **Idempotent Consumers**: Every Kafka consumer checks and logs `processed_events` to ensure exactly-once side effects.
3. **Optimistic Locking**: Every modification checks `@Version` to guard against concurrent overwrites, returning `409 STALE_VERSION` when conflicts arise.
4. **RFC 7807 Errors**: All API errors are emitted as `application/problem+json` with stable error codes and request correlation IDs.
