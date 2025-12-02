/**
 * Smoke Test
 * Quick sanity check to verify the system is working
 * Run: k6 run scripts/smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { API_BASE, THRESHOLDS, STAGES, HTTP_PARAMS } from '../lib/config.js';
import { login, getAuthParams } from '../lib/auth.js';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency', true);

export const options = {
  stages: STAGES.smoke,
  thresholds: THRESHOLDS.smoke,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export function setup() {
  // Login once during setup
  const token = login();
  if (!token) {
    console.error('Failed to authenticate during setup');
  }
  return { token };
}

export default function (data) {
  const authParams = getAuthParams(data.token);

  // Test 1: Health check
  {
    const res = http.get(`${API_BASE}/health`, HTTP_PARAMS);
    check(res, {
      'health check status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
  }

  sleep(1);

  // Test 2: Get workouts list
  {
    const res = http.get(`${API_BASE}/workouts`, authParams);
    check(res, {
      'workouts list status is 200': (r) => r.status === 200,
      'workouts response has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) || body.items || body.data;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
  }

  sleep(1);

  // Test 3: Get user profile
  {
    const res = http.get(`${API_BASE}/users/me`, authParams);
    check(res, {
      'user profile status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
  }

  sleep(1);

  // Test 4: Get achievements
  {
    const res = http.get(`${API_BASE}/achievements`, authParams);
    check(res, {
      'achievements status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
  }

  sleep(1);
}

export function teardown(data) {
  console.log('Smoke test completed');
}
