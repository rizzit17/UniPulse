# ADR 004: Apache Kafka for Event Streaming and Pub/Sub

## Status
Accepted

## Context
UniPulse requires asynchronous messaging across services:
- Creation triggers assignment, analytics, and requester notification.
- Assignment triggers technician and requester notification.
- SLA breaches trigger escalation and notifications.
We considered RabbitMQ, AWS SQS, and Apache Kafka.

## Decision
Use Apache Kafka (with KRaft in local/staging) partitioned by `requestId`.

## Consequences
### Positive
- Keying by `requestId` guarantees total ordering of state transitions and updates for any single request.
- Multiple independent consumer groups (`assignment-group`, `notification-group`, `analytics-group`) can read the same stream without point-to-point queues.
- Log retention permits stream replay to rebuild analytics aggregations from scratch.

### Negative / Trade-offs
- Operational footprint is heavier than RabbitMQ or SQS.
- Consumers must manage partition assignment and rebalances.
