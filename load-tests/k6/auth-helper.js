import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, TEST_USERS } from './config.js';

const tokenCache = {};

export function getAuthToken(role = 'student') {
  if (tokenCache[role]) {
    return tokenCache[role];
  }

  const credentials = TEST_USERS[role] || TEST_USERS.student;
  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password
  });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(res, {
    'auth login succeeded': (r) => r.status === 200 && r.json('accessToken') !== undefined
  });

  if (res.status === 200) {
    const token = res.json('accessToken');
    tokenCache[role] = token;
    return token;
  }

  return null;
}
