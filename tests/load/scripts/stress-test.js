/**
 * Stress Test
 * Push the system beyond normal load to find breaking points
 * Run: k6 run scripts/stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { API_BASE, THRESHOLDS, STAGES, HTTP_PARAMS } from '../lib/config.js';
import { login, getAuthParams } from '../lib/auth.js';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency', true);
const requestCount = new Counter('requests');
const breakingPoint = new Counter('breaking_point_errors');

export const options = {
  stages: STAGES.stress,
  thresholds: THRESHOLDS.stress,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export function setup() {
  const token = login();
  if (!token) {
    throw new Error('Failed to authenticate during setup');
  }
  return { token };
}

export default function (data) {
  const authParams = getAuthParams(data.token);

  // Heavy read operations
  group('Heavy Reads', function () {
    // Multiple concurrent requests simulation
    const requests = [
      ['GET', `${API_BASE}/workouts?limit=50`, null, authParams],
      ['GET', `${API_BASE}/users/me`, null, authParams],
      ['GET', `${API_BASE}/achievements`, null, authParams],
    ];

    const responses = http.batch(requests);

    responses.forEach((res, idx) => {
      const isOk = res.status === 200;
      check(res, {
        [`batch request ${idx + 1} OK`]: () => isOk,
      });
      errorRate.add(!isOk);
      apiLatency.add(res.timings.duration);
      requestCount.add(1);

      if (res.status >= 500) {
        breakingPoint.add(1);
      }
    });
  });

  sleep(0.5);

  // Database-heavy operations
  group('Database Heavy', function () {
    // Search/filter operations
    const searchRes = http.get(
      `${API_BASE}/workouts?category=strength&difficulty=advanced&limit=100`,
      authParams
    );
    check(searchRes, {
      'complex search OK': (r) => r.status === 200,
    });
    errorRate.add(searchRes.status !== 200);
    apiLatency.add(searchRes.timings.duration);
    requestCount.add(1);

    if (searchRes.status >= 500) {
      breakingPoint.add(1);
    }
  });

  sleep(0.5);

  // Write operations under stress
  group('Write Under Stress', function () {
    // Simulated session update (lightweight write)
    const sessionData = JSON.stringify({
      progress: Math.floor(Math.random() * 100),
      lastExerciseIndex: Math.floor(Math.random() * 10),
    });

    // Note: This is a simulated endpoint - adjust to actual API
    const updateRes = http.patch(
      `${API_BASE}/sessions/current`,
      sessionData,
      authParams
    );

    // Accept 404 as this might not have an active session
    const isOk = updateRes.status === 200 || updateRes.status === 404;
    check(updateRes, {
      'session update OK or no session': () => isOk,
    });

    if (updateRes.status >= 500) {
      errorRate.add(1);
      breakingPoint.add(1);
    }

    apiLatency.add(updateRes.timings.duration);
    requestCount.add(1);
  });

  sleep(0.3);
}

export function teardown(data) {
  console.log('Stress test completed');
  console.log('Check breaking_point_errors metric to identify system limits');
}
