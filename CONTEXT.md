# UniPulse — CONTEXT.md

**Read this file at the start of every session, before every phase, and whenever unsure.** It is the short, authoritative grounding for the project. It does not replace the other docs; it tells you which one to trust and what is already decided.

---

## 1. What this project is

**UniPulse** is a campus service-request platform. Students and faculty raise requests ("AC not working", "WiFi down in Block C"); the system routes each one to the right department and technician, tracks it against an SLA, notifies people on every change, and gives admins analytics.

It is a **portfolio project** for a **Software Engineer (Backend)** application at Nykaa (Java, Spring, Hibernate, REST, Postgres/MySQL/MongoDB, scalability, security, AWS, microservices/serverless, Jenkins, CS fundamentals). Backend depth matters more than frontend breadth.

Owner: Rishit. Single developer. Single campus (tenant-ready via `campus_id`).

## 2. Naming (the docs may still say CampusFlow)

| Old | Use |
|---|---|
| CampusFlow / campusflow | **UniPulse / unipulse** |
| `CF-2026-000123` | `UP-2026-000123` |
| `com.campusflow.*` | `com.unipulse.*` |

If you see the old name anywhere, it is a mistake. Fix it and mention it in the phase walkthrough.

## 3. Document map and precedence

| File | Authority over |
|---|---|
| `CONTEXT.md` (this) | Locked decisions, naming, hallucination rules |
| `SYSTEM_DESIGN.md` | Schema, indexes, API table, flows, concurrency, caching, Kafka settings |
| `ARCHITECTURE.md` | Stack, module layout, patterns, events, deployment, ADRs |
| `PRD.md` | Features, roles, state machine, SLA matrix, acceptance criteria |
| `DESIGN.md` | Everything visual (tokens, components, screens, copy) |
| `MASTER_PROMPT.md` | Phases, working method, git rules, testing standard |

Conflict rules: backend question → SYSTEM_DESIGN > ARCHITECTURE > PRD. Visual question → DESIGN. Anything in this file wins over all others except where it says "see".

## 4. Locked decisions (do not change without writing an ADR)

**Language/runtime:** Java 21, virtual threads enabled, Maven multi-module.
**Framework:** Spring Boot 3.3+, Spring Security 6, Spring Data JPA/Hibernate 6, MapStruct, Resilience4j, springdoc-openapi, Flyway.
**Data:** PostgreSQL 16 (core + analytics schemas), MongoDB 7 (activity feed, notification log), Redis 7 (cache, rate limit, JWT blacklist, workload ZSET, idempotency keys).
**Messaging:** Apache Kafka (KRaft). At-least-once + idempotent consumers. Transactional outbox.
**Services:** `core-api`, `assignment-service`, `notification-service`, `analytics-service`, `sla-watcher` (AWS Lambda).
**Auth:** JWT access (15 min) + rotating refresh (7 d, hashed in DB, reuse detection). BCrypt cost 12.
**Roles:** `REQUESTER`, `TECHNICIAN`, `DEPT_HEAD`, `ADMIN`.
**Status:** `OPEN, ASSIGNED, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED, REOPENED, CANCELLED`.
**Priority:** `P1` Critical, `P2` High, `P3` Medium, `P4` Low (SLA values in PRD section 7).
**Concurrency:** optimistic locking (`@Version`), `If-Match` header, `409 STALE_VERSION`.
**Pagination:** cursor-based on `(created_at, id)`.
**API:** base `/api/v1`, errors as RFC 7807 problem+json with `code` and `traceId`.
**Frontend:** React 18, Vite, TypeScript strict, TanStack Query, React Router, React Hook Form + Zod, Tailwind with design tokens.
**CI/CD:** GitHub Actions primary, `Jenkinsfile` mirror. **Cloud:** AWS (ECS Fargate, RDS, ElastiCache, S3, CloudFront, SES, Lambda, EventBridge, Secrets Manager, CloudWatch, ECR), Terraform.
**Design:** neo-brutalist, sober palette, **no gradients, no purple-family colours, no blur/glow, no emoji icons**.

## 5. Kafka topics (exact names)

`request.created.v1`, `request.assigned.v1`, `request.status-changed.v1`, `request.comment-added.v1`, `sla.warning.v1`, `sla.breached.v1`, plus `<topic>.dlq` for each consumer. Key is always `requestId`. Envelope fields: `eventId, type, version, occurredAt, aggregateId, correlationId, payload`.

## 6. Anti-hallucination protocol

1. **Never invent** endpoints, tables, columns, topics, env vars, library names, library versions, AWS resource names or config keys that are not in the docs. If you need one, add it to `docs/ASSUMPTIONS.md` with a one-line reason, then use it consistently.
2. **Verify before using any library API.** Check the actual dependency version in `pom.xml` / `package.json`, and read its real source or docs in the workspace or via the browser. Do not write code from memory for Spring Security 6, Hibernate 6, Kafka client, Resilience4j, jjwt or Testcontainers; their APIs changed across versions.
3. **Pin versions.** Every dependency gets an explicit version (or a BOM). Record the chosen versions in `docs/VERSIONS.md` at Phase 0.
4. **Run, don't assume.** A feature is not done until you have run the build, the tests and, for infra, `docker compose up`, and seen them pass. Never write "should work" in a walkthrough. Report actual command output summaries.
5. **No placeholder code.** No `TODO: implement`, no empty method bodies, no fake data returned from real endpoints, no mocked-out production paths. If something is deferred, list it under "Known gaps" in `docs/PROGRESS.md`.
6. **No fabricated results.** Load-test numbers, coverage percentages and latency figures come only from real runs.
7. **Stay inside scope.** Do not add features, services or libraries that are not in the PRD/ARCHITECTURE. Propose in the walkthrough instead.
8. **When docs are silent or ambiguous:** pick the simplest option consistent with section 4, log it in `docs/ASSUMPTIONS.md`, continue. Ask the user only if blocked.
9. **When docs contradict:** follow the precedence in section 3, log the conflict in `docs/ASSUMPTIONS.md`.
10. **Re-ground before each phase:** re-read this file and the relevant sections of the other docs; state in the plan which doc sections the phase implements.
11. **Do not touch** `MASTER_PROMPT.md`, `PRD.md`, `ARCHITECTURE.md`, `SYSTEM_DESIGN.md`, `DESIGN.md` or this file except to fix the naming issue in section 2 or when the user asks.

## 7. State tracking (you maintain `docs/PROGRESS.md`)

Create `docs/PROGRESS.md` in Phase 0 and update it at the end of every phase using this format:

```
## Phase N — <name>  [status: not started | in progress | done]
Branch: phase-n-<slug>   Merged: yes/no
Implements: PRD FR-xxx..., SYSTEM_DESIGN sections ...
Done-when checks: [x] ... [ ] ...
Commands run and result: mvn -B verify → pass (N tests) ...
Deviations from docs: ...
Known gaps: ...
```

At the start of any new session, read `docs/PROGRESS.md` and continue from the first phase not marked done. Do not redo finished phases.

## 8. Glossary

| Term | Meaning in UniPulse |
|---|---|
| Request | A service request / complaint (`service_requests` row) |
| Requester | Student or faculty who raised it (role `REQUESTER`) |
| Technician | Staff who resolves requests in one department |
| Dept Head | Supervises a department, can reassign |
| Routing rule | Admin-managed mapping from category/keyword/location to department |
| SLA | Respond-by and resolve-by deadlines derived from priority |
| Breach | `resolve_by` passed without resolution; triggers escalation |
| Escalation level | 0 Technician, 1 Dept Head, 2 Admin |
| Outbox | Table written in the same transaction as the change; relay publishes to Kafka |
| Sweep | Periodic SLA scan called by the Lambda via `/internal/sla/sweep` |
| Hotspot | Location/asset with repeated complaints in 30 days |

## 9. Working style reminders

- Commit messages: lowercase conventional prefix, specific, plain English, under 72 chars, one logical change each. No mention of AI or agents anywhere.
- Small vertical slices, tests with the code, green build before every commit.
- Explain non-obvious choices in short code comments or ADRs, written the way a human engineer would.
- If a task feels like it needs something not described here, stop and re-read sections 3 and 6 before improvising.
