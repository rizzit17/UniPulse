import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL } from './config.js';
import { getAuthToken } from './auth-helper.js';

// Custom Metrics
const readLatency = new Trend('unipulse_read_duration_ms');
const createLatency = new Trend('unipulse_create_duration_ms');
const transitionLatency = new Trend('unipulse_transition_duration_ms');
const errorRate = new Rate('unipulse_error_rate');
const successfulRequests = new Counter('unipulse_successful_requests');

// Load Profile: Ramp to 1,000 RPS
export const options = {
  scenarios: {
    mixed_traffic: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 150,
      maxVUs: 800,
      stages: [
        { target: 200, duration: '1m' },   // Warm up
        { target: 500, duration: '2m' },   // Ramp to 500 RPS
        { target: 1000, duration: '3m' },  // Ramp to 1,000 RPS
        { target: 1000, duration: '5m' },  // Sustain at peak 1,000 RPS
        { target: 0, duration: '1m' }      // Ramp down
      ],
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'],
    'unipulse_error_rate': ['rate<0.01'], // < 1% error budget
    'unipulse_read_duration_ms': ['p(95)<100'],
    'unipulse_create_duration_ms': ['p(95)<250'],
    'unipulse_transition_duration_ms': ['p(95)<200']
  },
};

// Seeded department and category IDs
const CATEGORIES = [
  { id: 'c-1', deptId: 'd-1', priority: 'P1' },
  { id: 'c-2', deptId: 'd-1', priority: 'P2' },
  { id: 'c-3', deptId: 'd-2', priority: 'P2' },
  { id: 'c-4', deptId: 'd-3', priority: 'P3' },
  { id: 'c-5', deptId: 'd-4', priority: 'P2' }
];

export function setup() {
  const token = getAuthToken('student');
  return { token };
}

export default function (data) {
  const rand = Math.random();
  const token = data.token || getAuthToken('student');

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  if (rand < 0.70) {
    // 70% READ OPERATIONS (Tickets list, single ticket, analytics summary)
    const readChoice = Math.random();
    let res;

    if (readChoice < 0.50) {
      // List requests with filter
      res = http.get(`${BASE_URL}/api/v1/requests?limit=10&status=OPEN`, { headers: authHeaders });
    } else if (readChoice < 0.80) {
      // Fetch single request
      res = http.get(`${BASE_URL}/api/v1/requests/r-101`, { headers: authHeaders });
    } else {
      // Fetch analytics overview
      res = http.get(`${BASE_URL}/api/v1/analytics/overview`, { headers: authHeaders });
    }

    readLatency.add(res.timings.duration);
    const passed = check(res, { 'read returns 200': (r) => r.status === 200 });
    if (!passed) errorRate.add(1);
    else successfulRequests.add(1);

  } else if (rand < 0.90) {
    // 20% TICKET CREATION (Idempotent POST /requests)
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const idempotencyKey = `k6-${__VU}-${__ITER}-${Date.now()}`;
    const payload = JSON.stringify({
      departmentId: cat.deptId,
      categoryId: cat.id,
      title: `Load Test Issue VU ${__VU} Iter ${__ITER}`,
      description: 'Automated performance benchmark ticket to evaluate throughput and outbox generation.',
      priority: cat.priority,
      locationBlock: 'Academic Block B',
      locationRoom: `Lab ${Math.floor(Math.random() * 200) + 100}`
    });

    const createHeaders = Object.assign({}, authHeaders, {
      'Idempotency-Key': idempotencyKey
    });

    const res = http.post(`${BASE_URL}/api/v1/requests`, payload, { headers: createHeaders });

    createLatency.add(res.timings.duration);
    const passed = check(res, { 'ticket created 201': (r) => r.status === 201 });
    if (!passed) errorRate.add(1);
    else successfulRequests.add(1);

  } else {
    // 10% STATE TRANSITIONS (Optimistic locking PATCH /requests/{id}/status)
    const targetRequestId = `r-${Math.floor(Math.random() * 50) + 101}`;
    const patchPayload = JSON.stringify({
      status: 'IN_PROGRESS',
      comment: 'Technician arrived on-site and began diagnostics.'
    });

    const transitionHeaders = Object.assign({}, authHeaders, {
      'If-Match': '"1"' // optimistic version lock
    });

    const res = http.patch(
      `${BASE_URL}/api/v1/requests/${targetRequestId}/status`,
      patchPayload,
      { headers: transitionHeaders }
    );

    transitionLatency.add(res.timings.duration);
    // 200 OK or 409 Conflict are valid business outcomes under concurrency
    const passed = check(res, {
      'transition succeeded or valid conflict': (r) => r.status === 200 || r.status === 409
    });
    if (!passed) errorRate.add(1);
    else successfulRequests.add(1);
  }

  sleep(0.01);
}
