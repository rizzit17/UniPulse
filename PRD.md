# CampusFlow — Product Requirements Document

Version 1.0 · Owner: Rishit · Status: Build-ready

---

## 1. Problem

On a large campus (hostels, academic blocks, labs), maintenance and IT issues are reported through WhatsApp groups, paper registers, and walk-ins. Consequences:

- No single owner for a complaint; it bounces between departments.
- No visibility for the reporter on status.
- No SLA tracking, so urgent issues (power failure in a lab, water leak in a hostel) wait as long as trivial ones.
- Admins cannot see workload, repeat offenders (same AC failing monthly) or department performance.

## 2. Product Summary

CampusFlow is a service-request platform. A user raises a request, the system classifies and routes it to the right department and technician, tracks it against an SLA, notifies everyone on each change, and gives admins analytics.

## 3. Goals and Non-Goals

### Goals
1. Reduce time-to-assignment to under 5 seconds (automatic, no human triage) for 90% of requests.
2. Every request has exactly one accountable assignee at any time.
3. SLA breaches are detected and escalated automatically.
4. Full audit trail of every state change.
5. Backend is horizontally scalable and demonstrably load-tested.

### Non-Goals (v1)
- Payments or billing.
- Mobile native apps (responsive web only).
- ML-based classification (rule + keyword engine in v1; pluggable interface so ML can be added later).
- Multi-campus tenancy (single tenant, schema is tenant-ready via `campus_id`).

## 4. Personas

| Persona | Description | Primary needs |
|---|---|---|
| **Student / Faculty (Requester)** | Raises and tracks complaints | Fast submission, clear status, notifications |
| **Technician (Staff)** | Resolves requests in a department | Clear queue, priority order, mobile-friendly updates |
| **Department Head** | Supervises technicians | Reassign, workload view, SLA risk list |
| **Admin** | Runs the platform | Users, departments, rules, analytics, overrides |

## 5. Roles and Permissions

| Action | Requester | Technician | Dept Head | Admin |
|---|:-:|:-:|:-:|:-:|
| Create request | ✔ | ✔ | ✔ | ✔ |
| View own requests | ✔ | ✔ | ✔ | ✔ |
| View department queue | ✘ | own dept | own dept | all |
| Update status | ✘ | assigned only | own dept | all |
| Reassign | ✘ | ✘ | own dept | all |
| Comment | own request | assigned | own dept | all |
| Manage users/departments/rules | ✘ | ✘ | ✘ | ✔ |
| View analytics | ✘ | ✘ | own dept | all |

## 6. Request Lifecycle

```
OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
          │            │            │
          └──→ ON_HOLD ←┘            └──→ REOPENED → ASSIGNED
OPEN/ASSIGNED/IN_PROGRESS → CANCELLED (requester or admin)
```

Rules:
- `RESOLVED` auto-moves to `CLOSED` after 72 hours without a reopen.
- `ON_HOLD` requires a reason and pauses the SLA clock.
- `REOPENED` is allowed only from `RESOLVED`, only by the requester, and resets assignee to the previous technician.
- Illegal transitions return `409 Conflict` with error code `ILLEGAL_TRANSITION`.

## 7. Priority and SLA Matrix

| Priority | Examples | Respond within | Resolve within |
|---|---|---|---|
| P1 Critical | Power outage in lab, water leak, fire alarm fault | 15 min | 4 h |
| P2 High | WiFi down in a block, AC failure in exam hall | 1 h | 12 h |
| P3 Medium | Projector, single-room electrical | 4 h | 48 h |
| P4 Low | Cosmetic, furniture, request for new item | 24 h | 7 d |

Priority is system-suggested from category + keywords and can be overridden by Dept Head/Admin (override is audited).

## 8. Functional Requirements

### 8.1 Authentication and Accounts
| ID | Requirement |
|---|---|
| FR-AUTH-1 | Register/login with email + password (BCrypt, cost 12). |
| FR-AUTH-2 | JWT access token (15 min) + rotating refresh token (7 d) stored hashed in DB. |
| FR-AUTH-3 | Refresh token reuse detection revokes the whole token family. |
| FR-AUTH-4 | Role-based authorization via Spring Security method-level rules. |
| FR-AUTH-5 | Login rate limit: 5 attempts/min/IP+email (Redis). |
| FR-AUTH-6 | Logout blacklists the access token's `jti` in Redis until expiry. |

### 8.2 Request Management
| ID | Requirement |
|---|---|
| FR-REQ-1 | Create request with title, description, category, location (block/room), optional attachments (max 3, 5 MB each, images/PDF). |
| FR-REQ-2 | System generates human ID `CF-2026-000123`. |
| FR-REQ-3 | Duplicate detection: same requester + category + location open within 30 min returns the existing request. |
| FR-REQ-4 | Status transitions follow the state machine in section 6. |
| FR-REQ-5 | Comments (public and internal-only) with timestamps. |
| FR-REQ-6 | Immutable history: every field change recorded with actor, old value, new value. |
| FR-REQ-7 | List with filters (status, priority, category, department, assignee, date range), sorting, and cursor pagination. |
| FR-REQ-8 | Full-text search on title/description. |
| FR-REQ-9 | Concurrent edits detected via optimistic locking; stale write returns `409 STALE_VERSION`. |
| FR-REQ-10 | Requester can rate a closed request (1–5) with optional feedback. |

### 8.3 Smart Assignment
| ID | Requirement |
|---|---|
| FR-ASG-1 | Category maps to department via admin-managed routing rules. |
| FR-ASG-2 | Within a department, pick the technician with lowest active weighted load who is on shift and has the required skill. |
| FR-ASG-3 | If no technician is available, request stays `OPEN` in the department queue and the Dept Head is notified. |
| FR-ASG-4 | Assignment happens asynchronously (Kafka) and is idempotent. |
| FR-ASG-5 | Reassignment is manual (Dept Head/Admin) and recorded. |

### 8.4 SLA Engine
| ID | Requirement |
|---|---|
| FR-SLA-1 | Each request gets `respond_by` and `resolve_by` timestamps on creation. |
| FR-SLA-2 | Clock pauses in `ON_HOLD`. |
| FR-SLA-3 | At 75% of the window: warning event. At 100%: breach event and auto-escalation (priority bump + notify Dept Head, then Admin after a further 25%). |
| FR-SLA-4 | Breach checks run on a schedule (AWS Lambda / EventBridge in prod, `@Scheduled` locally). |

### 8.5 Notifications
| ID | Requirement |
|---|---|
| FR-NOT-1 | Channels: in-app (SSE), email. |
| FR-NOT-2 | Triggers: created, assigned, status changed, comment added, SLA warning, SLA breach. |
| FR-NOT-3 | Per-user channel preferences. |
| FR-NOT-4 | Failed deliveries retried with exponential backoff, then dead-lettered. |

### 8.6 Analytics (Admin / Dept Head)
| ID | Requirement |
|---|---|
| FR-ANA-1 | Requests per category/department/day. |
| FR-ANA-2 | Mean time to assign, to resolve, SLA compliance %. |
| FR-ANA-3 | Technician workload and throughput. |
| FR-ANA-4 | Hotspots: top locations and assets by repeat complaints. |
| FR-ANA-5 | Dashboards read from pre-aggregated tables, never from live OLTP scans. |

### 8.7 Administration
| ID | Requirement |
|---|---|
| FR-ADM-1 | CRUD departments, categories, routing rules, SLA policies. |
| FR-ADM-2 | User management and role assignment. |
| FR-ADM-3 | Technician shifts and skills. |
| FR-ADM-4 | Audit log viewer. |

## 9. Non-Functional Requirements

| Area | Target |
|---|---|
| Latency | p95 < 200 ms for reads, < 400 ms for writes at 500 RPS |
| Throughput | 1,000 RPS sustained on 2 API replicas (load-tested with k6) |
| Availability | 99.5% (single region, multi-AZ database) |
| Scalability | Stateless API; horizontally scalable; design doc covers 1M users |
| Security | OWASP Top 10 mitigations, input validation, parameterized queries, secrets in AWS Secrets Manager |
| Data integrity | No lost updates, no double assignment, no duplicate notifications |
| Observability | Structured JSON logs with correlation ID, Prometheus metrics, health probes |
| Testing | ≥ 80% line coverage on service layer, Testcontainers integration tests, contract tests for events |
| Portability | `docker compose up` brings the whole system up locally |

## 10. Success Metrics

- 90% of requests auto-assigned within 5 s.
- SLA compliance ≥ 90% in the seeded simulation dataset.
- Zero lost updates under a concurrency test with 50 parallel writers.
- Load test report included in repo (`/docs/load-test/`).

## 11. Release Plan

| Phase | Scope |
|---|---|
| **P0 Foundation** | Repo, Docker Compose, Flyway, auth, user module |
| **P1 Core** | Request CRUD, state machine, comments, history, optimistic locking, pagination |
| **P2 Async** | Kafka, outbox, assignment service, notification service |
| **P3 Scale** | Redis caching, rate limiting, indexes, SLA engine, Lambda |
| **P4 Insight** | Analytics service, Mongo activity feed, dashboards |
| **P5 Ship** | CI/CD, AWS deploy, k6 load test, docs polish, demo data |

## 12. Risks

| Risk | Mitigation |
|---|---|
| Over-engineering delays shipping | Modular monolith first; extract services only in P2+ |
| Kafka local complexity | KRaft single-node in Compose |
| AWS cost | Free-tier sizing, teardown script, Terraform/CLI scripts documented |
| Frontend time sink | Keep UI to 8 screens, token-driven design system |

## 13. JD Traceability (Nykaa — Software Engineer, Backend)

| JD line | Where it shows up in CampusFlow |
|---|---|
| Java, Spring, Hibernate | Java 21, Spring Boot 3, Spring Data JPA/Hibernate, Spring Security |
| REST API proficiency | Versioned REST API, OpenAPI, problem+json errors, idempotency keys |
| Postgres / MySQL / MongoDB | PostgreSQL (OLTP), MongoDB (activity feed and flexible event payloads) |
| Scalable, performant code | Redis caching, indexing, cursor pagination, async via Kafka, load tests |
| Security and data protection | JWT rotation, RBAC, rate limiting, validation, audit log, PII minimization |
| Design application architecture | ARCHITECTURE.md + SYSTEM_DESIGN.md with ADRs |
| Microservices / serverless (plus) | Notification, assignment, analytics services; Lambda SLA checker |
| CI (Jenkins) (plus) | GitHub Actions + Jenkinsfile |
| Cloud design, AWS (plus) | ECS Fargate, RDS, ElastiCache, MSK/Kafka, S3, SES, Lambda, CloudWatch |
| Git | Conventional commits, trunk-based branching, PR templates |
| OOD, patterns, DSA, OS | State, Strategy, Observer, Factory, Builder, Chain of Responsibility; heap-based assignment; thread pools and virtual threads |
| Analytical / problem solving | SLA engine, concurrency design, capacity estimation |
