#!/usr/bin/env bash
set -e

TARGET_URL="${1:-http://localhost:8080}"
echo "Executing UniPulse k6 Load Test against ${TARGET_URL}..."

k6 run -e TARGET_URL="${TARGET_URL}" load-tests/k6/mixed-workload.js
