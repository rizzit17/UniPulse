# ADR 002: Modular Monolith Core with Selective Async Service Extraction

## Status
Accepted

## Context
Deploying full microservices across all domain boundaries introduces operational overhead, network latency, distributed transaction complexity, and fragile consistency across user/auth/request domains. However, certain background workloads (smart technician assignment, multi-channel notifications, read-heavy analytics aggregations) have distinct scaling and failure profiles.

## Decision
Adopt a modular monolith design for `unipulse-core-api` with package-by-feature boundaries, while extracting three specialized async services:
1. `unipulse-assignment-service` (scales on Kafka partition lag)
2. `unipulse-notification-service` (isolates slow SMTP/SES I/O from request creation)
3. `unipulse-analytics-service` (isolates heavy aggregate reads and upserts from OLTP)

## Consequences
### Positive
- Core transactions remain atomic without distributed 2PC or saga complexity.
- Slow external operations (e.g. SMTP failures) never block HTTP request creation.
- Feature packages in `core-api` communicate strictly via service interfaces, making future extraction straightforward.

### Negative / Trade-offs
- Requires managing multiple build artifacts and container images.
- Kafka message bus must be maintained for inter-service communication.
