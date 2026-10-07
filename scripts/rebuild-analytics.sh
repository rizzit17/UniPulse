#!/usr/bin/env bash
# UniPulse Analytics Rebuild from Event Replay Script
set -e

ANALYTICS_URL="${ANALYTICS_URL:-http://localhost:8083}"
INTERNAL_TOKEN="${INTERNAL_TOKEN:-unipulse-internal-secret-token-2026}"

echo "=========================================================="
echo "UniPulse: Triggering Analytics Rebuild & Replay"
echo "Target: ${ANALYTICS_URL}/internal/analytics/rebuild"
echo "=========================================================="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ANALYTICS_URL}/internal/analytics/rebuild" \
  -H "X-Internal-Token: ${INTERNAL_TOKEN}" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "SUCCESS ($HTTP_STATUS): Analytics aggregates successfully cleared and re-initialized."
  echo "$BODY"
  echo ""
  echo "If replaying via Kafka consumer offset rewind:"
  echo "Run: kafka-consumer-groups --bootstrap-server localhost:9092 --group unipulse-analytics-group --reset-offsets --to-earliest --execute --all-topics"
  exit 0
else
  echo "FAILED ($HTTP_STATUS): Could not rebuild analytics."
  echo "$BODY"
  exit 1
fi
