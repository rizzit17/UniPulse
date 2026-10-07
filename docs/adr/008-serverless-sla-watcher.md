# ADR 008: Serverless AWS Lambda Runner for SLA Sweep Execution

## Status
Accepted

## Context
SLA policies require periodic sweeps to detect impending warnings (at 75% of window) and breaches (at 100% of window). Running an in-process `@Scheduled` timer inside every horizontal replica of `core-api` risks duplicate sweeps, distributed lock contention, and wasted idle compute.

## Decision
Use an external trigger: in production on AWS, an EventBridge rule triggers a lightweight serverless AWS Lambda function (`unipulse-sla-watcher`) once per minute, which invokes `POST /internal/sla/sweep` with a secure service token. For local development and testing, a spring profile enables a single `@Scheduled` fallback runner.

## Consequences
### Positive
- Zero duplicate cron executions across scaled application nodes.
- Serverless execution incurs cost only during active sweep invocations.
- Demonstrates serverless cloud architecture on AWS integrated with the core Spring backend.

### Negative / Trade-offs
- Requires managing an AWS Lambda packaging lifecycle and EventBridge rule in Terraform.
- Internal endpoint must authenticate callers via shared secret / service token.
