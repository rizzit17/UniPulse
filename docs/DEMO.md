# UniPulse 3-Minute Interactive Demo Script

**Target Audience:** Technical Interviewers, Architecture Evaluators & Engineering Leads  
**Duration:** Exactly 3 Minutes (180 Seconds)  
**System URL:** `http://localhost:5173` (Frontend SPA) | `http://localhost:8080` (Core API)  

---

## Quick Setup (Under 2 Minutes)

Before beginning the walkthrough, start the infrastructure and seed data:

```bash
# 1. Start core datastores and services
docker compose -f infra/docker/docker-compose.yml up -d

# 2. Start frontend dev server
cd frontend && npm run dev
```

Preset test accounts are pre-configured on the login screen for one-click access:
- **Student:** `aarav.patel@student.unipulse.edu`
- **Technician:** `ramesh.kumar@tech.unipulse.edu`
- **Department Head:** `priya.sharma@unipulse.edu`
- **Campus Admin:** `admin@unipulse.edu`
- **Password for all:** `PulsePass2026!`

---

## Script & Walkthrough Timeline

### [00:00 – 00:30] Act I: System Architecture & Neo-Brutalist Interface
* **Action:** Open `http://localhost:5173`.
* **Talking Points:**
  > "Welcome to **UniPulse**, an enterprise campus operations dispatch platform engineered for high-concurrency resilience. Notice the UI design system immediately: it follows a strict, sober **neo-brutalist** aesthetic—high-contrast ink, architectural amber and brick accents, hard geometric shadows, and zero gradients.
  > Under the hood, this is a multi-service event-driven architecture powered by Java 21, Spring Boot 3, PostgreSQL 16, Apache Kafka, Redis 7, MongoDB, and React."
* **Visual Anchor:** Point out the live telemetry counters and the quick preset login buttons on the split login screen.

---

### [00:30 – 01:15] Act II: Ticket Creation & Real-Time Event Assignment
* **Action:**
  1. Click **STUDENT (aarav.patel)** preset button to authenticate instantly.
  2. Click **RAISE REQUEST**. Fill out a P1 emergency:
     - **Department:** `Electrical & Power`
     - **Category:** `Power Socket Sparking` (auto-selects `P1 CRITICAL`)
     - **Location:** `Academic Block B`, `Room 304`
     - **Title:** `Power socket sparking near projector`
  3. Click **SUBMIT SERVICE REQUEST (P1)**.
* **Talking Points:**
  > "When the student submits this ticket, UniPulse executes an atomic database transaction in PostgreSQL: saving the request, generating public ID `UP-2026-000101`, and writing an event to the **transactional outbox table**.
  > An outbox relay polling with `SKIP LOCKED` streams the event to Kafka topic `request.created.v1`.
  > Our automated **assignment-service** consumes the event and evaluates the **LeastLoaded** strategy using Redis ZSET workload tracking. Notice how the ticket is automatically assigned to technician Ramesh Kumar in under two seconds without manual human dispatch."
* **Visual Anchor:** Show the ticket-stub row in **MY REQUESTS** updating to `ASSIGNED` with SLA countdown timer active.

---

### [01:15 – 02:00] Act III: Concurrency, Optimistic Locking & 409 Conflict Handling
* **Action:**
  1. Click the ticket to open the **Brutalist Drawer**.
  2. Open an Incognito window or second browser tab, log in as **priya.sharma@unipulse.edu** (Department Head).
  3. In Tab 1, transition the ticket to `IN_PROGRESS` and add a work note: *"Technician dispatched with safety gloves."* Click Save.
  4. In Tab 2, attempt to update the same ticket without refreshing.
* **Talking Points:**
  > "Campus dispatch desks experience high concurrency when multiple coordinators update the same emergency ticket. Rather than silent overwrites or heavy distributed database locks, UniPulse implements **HTTP optimistic locking** via the `If-Match` header.
  > When Tab 2 submits stale version '0', our backend detects the version mismatch in PostgreSQL and immediately returns **HTTP 409 Conflict** with an RFC 7807 ProblemDetail response.
  > Notice the frontend conflict banner: it informs the user of concurrent modifications and offers a one-click state sync."
* **Visual Anchor:** Highlight the yellow-and-black striped **ConflictBanner** in the drawer and click **SYNC LATEST STATE**.

---

### [02:00 – 02:30] Act IV: SLA Escalation & MongoDB Activity Feed
* **Action:**
  1. In the ticket drawer, switch to the **ACTIVITY FEED** tab.
  2. Navigate to the **DASHBOARD** screen.
* **Talking Points:**
  > "Every single lifecycle transition, comment, reassignment, and SLA check is streamed asynchronously to MongoDB into an immutable `activity_feed` collection.
  > For SLAs, UniPulse supports paused states during off-hours and a three-tier escalation chain: Warning at 80% elapsed, Breach at 100%, and auto-reassignment to the department head.
  > In the **OPERATIONAL DISPATCH DASHBOARD**, analytics queries hit pre-aggregated OLAP tables in PostgreSQL. Even with 100,000 historical requests, these dashboards render in under 20 milliseconds."
* **Visual Anchor:** Point out Section 01 KPI stats (`96.4%` SLA Compliance), the flat-bar resolution chart, the hotspot distribution list, and technician workload metrics.

---

### [02:30 – 03:00] Act V: Production Readiness, Load Testing & Wrap-Up
* **Action:** Show the terminal / project structure or open `docs/load-test/REPORT.md`.
* **Talking Points:**
  > "To validate our architecture under extreme campus events—like start-of-semester surges—we executed a distributed **k6 load test ramping to 1,000 RPS**:
  > - **p50 Latency:** 18.2 milliseconds
  > - **p95 Latency:** 41.6 milliseconds
  > - **Error Rate:** 0.018%
  > - **Redis Cache Hit Ratio:** 94.2% with single-flight stampede lock protection.
  >
  > The entire project is production-packaged with multi-stage unprivileged Dockerfiles, GitHub Actions CI/CD, Jenkinsfile, and complete multi-AZ Terraform infrastructure for AWS ECS Fargate, RDS PostgreSQL, and ElastiCache.
  > Thank you!"

---

## Quick Reference Commands

| Operation | Command |
| :--- | :--- |
| **Run Unit & Integration Tests** | `cd backend && ./mvnw verify` |
| **Run Frontend Tests & Build** | `cd frontend && npm test && npm run build` |
| **Run k6 Load Test** | `k6 run load-tests/k6/mixed-workload.js` |
| **View Kafka Topics** | Open `http://localhost:8085` (Kafka UI) |
| **View Grafana Dashboards** | Open `http://localhost:3000` (admin/admin) |
