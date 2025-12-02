/**
 * Spike Test
 * Test system behavior under sudden traffic spikes
 * Run: k6 run scripts/spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { API_BASE, THRESHOLDS, STAGES, HTTP_PARAMS } from '../lib/config.js';
import { login, getAuthParams } from '../lib/auth.js';

// Custom metrics
const errorRate = new Rate('errors');
const recoveryTime = new Trend('recovery_time', true);
const spikeErrors = new Counter('spike_errors');
const normalErrors = new Counter('normal_errors');

export const options = {
  stages: STAGES.spike,
  thresholds: THRESHOLDS.spike,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export function setup() {
  const token = login();
  if (!token) {
    throw new Error('Failed to authenticate during setup');
  }
  return { token };
}

// Track VU count for spike detection
let previousVUs = 0;
let spikeStartTime = null;

export default function (data) {
  const authParams = getAuthParams(data.token);
  const currentVUs = __VU;
  const isSpike = currentVUs > previousVUs * 2;

  if (isSpike && !spikeStartTime) {
    spikeStartTime = Date.now();
  }

  // Primary endpoint under test
  const endpoints = [
    { name: 'workouts', url: `${API_BASE}/workouts?limit=20` },
    { name: 'profile', url: `${API_BASE}/users/me` },
    { name: 'achievements', url: `${API_BASE}/achievements` },
  ];

  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const res = http.get(randomEndpoint.url, authParams);

  const isOk = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!isOk);

  if (!isOk) {
    if (isSpike) {
      spikeErrors.add(1);
    } else {
      normalErrors.add(1);
    }
  }

  // Measure recovery after spike
  if (spikeStartTime && currentVUs < previousVUs / 2) {
    recoveryTime.add(Date.now() - spikeStartTime);
    spikeStartTime = null;
  }

  previousVUs = currentVUs;

  sleep(0.1 + Math.random() * 0.2); // 100-300ms between requests
}

export function teardown(data) {
  console.log('Spike test completed');
  console.log('Compare spike_errors vs normal_errors to assess spike handling');
}
