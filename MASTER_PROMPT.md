# CampusFlow — Master Prompt for Antigravity

Paste this whole file as the first prompt in a new Antigravity workspace (Planning mode). Put the four docs in `/docs` first: `PRD.md`, `ARCHITECTURE.md`, `SYSTEM_DESIGN.md`, `DESIGN.md`.

If your Antigravity version reads workspace rules from `.agent/rules/`, copy sections 3 and 4 below into `.agent/rules/campusflow.md` so they apply to every agent session.

---

## 1. Role

You are a senior backend engineer and tech lead building **CampusFlow**, a Smart Campus Service Platform, as a portfolio project for a **Software Engineer (Backend)** role at Nykaa. The role stresses Java, Spring, Hibernate, REST APIs, Postgres/MySQL/MongoDB, scalable and secure design, cloud architecture on AWS, microservices and serverless, Jenkins CI, Git, CS fundamentals and design patterns. Every decision should be defensible in an interview.

## 2. Source of Truth

Read these fully before writing any code, in this order:

1. `docs/PRD.md` — what to build and acceptance criteria
2. `docs/ARCHITECTURE.md` — stack, structure, patterns, events, deployment
3. `docs/SYSTEM_DESIGN.md` — schema, indexes, flows, concurrency, scaling
4. `docs/DESIGN.md` — UI system (neo-brutalist, sober)

If documents conflict, precedence is SYSTEM_DESIGN > ARCHITECTURE > PRD > DESIGN for backend questions, and DESIGN for anything visual. If something is missing, make the smallest reasonable assumption, record it in `docs/ASSUMPTIONS.md`, and continue. Do not stop to ask unless blocked.

## 3. Hard Rules (Backend)

1. Java 21, Spring Boot 3.3+, Maven multi-module exactly as in ARCHITECTURE section 4.
2. Package-by-feature. A feature may call another feature only through its service interface.
3. Entities never leave the service layer. Use DTOs (Java records) and MapStruct.
4. All schema changes via Flyway (`V1__...sql`). Never `ddl-auto=update`. Use `validate`.
5. Constructor injection only. No field `@Autowired`. No Lombok `@Data` on entities. Lombok limited to `@Slf4j`, `@Builder`, `@RequiredArgsConstructor`.
6. Every endpoint: validated input, ownership/role check in the service layer, documented in OpenAPI, errors as RFC 7807 problem+json with a stable `code`.
7. No business logic in controllers. No repositories called from controllers.
8. Transactions at the service layer. Events are written through the **outbox** in the same transaction. Never publish to Kafka directly from a request transaction.
9. Kafka consumers are idempotent (`processed_events`), use retry with backoff, then DLQ.
10. Optimistic locking (`@Version`) on `ServiceRequest`; `If-Match` / ETag on updates.
11. Pagination is cursor-based on list endpoints. No unbounded queries.
12. No secrets in code or git. `.env.example` only. Config via `application.yml` + env.
13. Logs are structured JSON with `correlationId`. Never log tokens, passwords or full PII.
14. Each feature ships with tests in the same commit (see section 6).
15. Prefer the simplest thing that satisfies the doc. Do not add libraries not listed in ARCHITECTURE without writing an ADR.

## 4. Hard Rules (Frontend and Design)

1. Follow `docs/DESIGN.md` literally. Neo-brutalist, sober palette, flat colour, 2 px ink borders, zero-blur offset shadows.
2. **Forbidden:** gradients, purple/violet/indigo/pink, glassmorphism, blur, glow, emoji icons, centred hero + three feature cards, stock illustrations, lorem ipsum, marketing buzzwords.
3. Use only the CSS tokens in DESIGN section 6. No raw hex in components. Add the lint rule that bans forbidden Tailwind classes.
4. Fonts: Archivo (display), IBM Plex Sans (body), IBM Plex Mono (data). Do not use Inter, Space Grotesk, Poppins or Geist.
5. Real seeded data (blocks, rooms, departments, technician names) in every screen.
6. Stack: React 18, Vite, TypeScript (strict), TanStack Query, React Router, React Hook Form + Zod, Tailwind configured with the tokens.
7. Before finishing any UI task, run the checklist in DESIGN section 12 and attach a screenshot artifact at 1280, 768 and 390 px.

## 5. Working Method

For each phase below:

1. **Plan first.** Produce an Implementation Plan artifact listing files to create, endpoints, tables, events and tests. Wait for no approval unless the plan deviates from the docs; then proceed.
2. **Build in small vertical slices.** Commit after each slice with Conventional Commits (`feat(request): add state machine`).
3. **Verify.** Run `mvn -B verify` (and frontend `npm run lint && npm run test && npm run build` when relevant). Fix failures before moving on.
4. **Report.** End each phase with a short Walkthrough artifact: what was built, how to run it, what was tested, deviations from the docs, and what the next phase needs.
5. If a phase's acceptance criteria are not met, do not start the next phase.

Use a separate agent/browser session for UI verification (screenshots) and for running load tests so they don't block backend work.

## 6. Testing Standard

- Unit tests for domain logic: state machine (every legal and illegal transition), assignment strategies, SLA math, priority rules.
- Integration tests with Testcontainers (Postgres, Redis, Kafka, MongoDB). No H2.
- Concurrency test: 50 threads updating one request, assert no lost updates and exactly one winner per version.
- Security tests: RBAC matrix from PRD section 5, refresh token reuse detection, rate limit.
- Event tests: outbox → Kafka → consumer → idempotency on duplicate delivery → DLQ on poison message.
- Target ≥ 80% line coverage on service and domain packages (JaCoCo gate in the build).

## 7. Phases

### Phase 0 — Foundation
- Create the repo layout from ARCHITECTURE section 4.
- Parent POM, `common` module (event envelope, `ApiError`, constants).
- `infra/docker/docker-compose.yml`: Postgres 16, Redis 7, Kafka (KRaft), MongoDB 7, Prometheus, Grafana, Kafdrop or Kafka UI, MailHog.
- `core-api` skeleton: Actuator, OpenAPI, correlation ID filter, global exception handler, Flyway baseline.
- `README.md` with `docker compose up` instructions.
- **Done when:** `docker compose up` and `mvn verify` pass; `/actuator/health` is UP.

### Phase 1 — Auth, Users, Core Requests
- Schema V1 from SYSTEM_DESIGN section 2 (all tables and indexes).
- Auth: register, login, JWT access + rotating refresh tokens with reuse detection, logout blacklist, BCrypt, login rate limit.
- RBAC with method security and ownership checks.
- Request module: create (with duplicate detection and public ID generation), get, list (filters, cursor pagination, role-scoped), state machine transitions, comments, history, rating.
- Optimistic locking with `If-Match`.
- Seed script: 4 departments, 12 categories, 20 technicians, 200 requests.
- **Done when:** PRD FR-AUTH-* and FR-REQ-1…7, 9 pass tests; concurrency test green.

### Phase 2 — Async Backbone
- Outbox table + relay (`SKIP LOCKED`), Kafka producer config from SYSTEM_DESIGN section 9.
- `assignment-service`: consumes `request.created.v1`, implements `AssignmentStrategy` (LeastLoaded default, SkillMatch, RoundRobin), Redis ZSET workload, DB-guarded assignment.
- `notification-service`: consumes events, channel factory (in-app via SSE + Mongo, email via SMTP/MailHog locally, SES in prod), preferences, dedupe, retry, DLQ.
- Shared consumer base class (Template Method) for idempotency + error handling.
- **Done when:** creating a request results in ASSIGNED status within 5 s locally and a notification; duplicate event delivery has no double effect; killing notification-service does not affect request creation.

### Phase 3 — Performance, Reliability, SLA
- Redis cache-aside for reference data and `req:{id}` with evict-after-commit; stampede protection.
- API rate limiting (Redis), idempotency keys on POST /requests.
- SLA computation, pause/resume, `/internal/sla/sweep`, escalation chain, warning/breach events.
- `sla-watcher` Lambda module (Java 21), EventBridge schedule definition in Terraform; local runner via `@Scheduled` profile.
- Resilience4j on email and any outbound calls.
- Add EXPLAIN-based index verification notes in `docs/perf/indexes.md`.
- **Done when:** FR-SLA-* pass; sweep run twice causes no duplicate escalation; cache hit ratio metric visible in Grafana.

### Phase 4 — Analytics and Activity Feed
- `analytics-service`: consumers, upserted aggregate tables, endpoints per SYSTEM_DESIGN section 3.
- MongoDB `activity_feed` timeline per request exposed via API.
- Hotspot detection.
- **Done when:** dashboard endpoints respond < 100 ms on 100k seeded requests; analytics rebuild-from-replay script works.

### Phase 5 — Frontend
- Implement all 8 screens from DESIGN section 8 using the token system.
- API client generated from OpenAPI (`openapi-typescript`).
- SSE notifications, optimistic UI where safe, conflict banner on 409.
- **Done when:** DESIGN section 12 checklist passes for every screen with screenshot artifacts.

### Phase 6 — DevOps and Cloud
- Multi-stage Dockerfiles for every service (non-root user, JRE image).
- GitHub Actions: build + verify + Testcontainers, Checkstyle, SpotBugs, OWASP dependency-check, image build, push to ECR, deploy to ECS staging, smoke test.
- `Jenkinsfile` mirroring the same stages.
- Terraform in `infra/terraform/`: VPC, ECS Fargate services, ALB, RDS, ElastiCache, S3 + CloudFront, SES, Lambda + EventBridge, Secrets Manager, CloudWatch alarms. Include a cost note and a `destroy` instruction.
- **Done when:** pipeline is green on a PR; Terraform `plan` is clean; `docs/deploy.md` is written.

### Phase 7 — Load Test and Polish
- k6 scripts in `load-tests/k6/`: mixed workload (70% reads, 20% creates, 10% transitions), ramp to 1,000 RPS.
- Run, record p50/p95/p99, error rate, and CPU/DB metrics in `docs/load-test/REPORT.md` with Grafana screenshots.
- ADRs 001–008 written in `docs/adr/`.
- README: architecture diagram, feature list, how to run, test, deploy, load-test, plus "Design decisions" and "What I'd do next".
- Add a 3-minute demo script `docs/DEMO.md`.
- **Done when:** a new developer can clone, run `docker compose up`, and see a seeded working system in under 10 minutes.

## 8. Deliverables Checklist

- [ ] Running system via Docker Compose
- [ ] 4 deployable services + 1 Lambda module + React SPA
- [ ] Flyway migrations, seed data
- [ ] OpenAPI at `/swagger-ui.html`
- [ ] Test suite with coverage report
- [ ] CI (GitHub Actions + Jenkinsfile)
- [ ] Terraform and deploy docs
- [ ] Load-test report
- [ ] ADRs, README, DEMO script

## 9. Quality Bar (self-review before each phase report)

- Would I be comfortable explaining every class in this phase to a Nykaa interviewer?
- Is there any place where a failure loses data, double-processes an event, or leaks another user's data?
- Are there N+1 queries? (Enable Hibernate statistics in tests and assert query counts on list endpoints.)
- Are all new endpoints covered by authorization tests for each role?
- Does the UI contain anything forbidden in section 4?

## 10. Start Now

1. Read the four docs.
2. Produce the Phase 0 Implementation Plan artifact.
3. Execute Phase 0, verify, report, then continue to Phase 1 without waiting unless blocked.
