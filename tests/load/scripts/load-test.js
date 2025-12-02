/**
 * Load Test
 * Standard load test to verify system performance under expected load
 * Run: k6 run scripts/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { API_BASE, THRESHOLDS, STAGES, HTTP_PARAMS } from '../lib/config.js';
import { login, getAuthParams } from '../lib/auth.js';

// Custom metrics
const errorRate = new Rate('errors');
const workoutListLatency = new Trend('workout_list_latency', true);
const workoutDetailLatency = new Trend('workout_detail_latency', true);
const sessionLatency = new Trend('session_latency', true);
const profileLatency = new Trend('profile_latency', true);
const requestCount = new Counter('requests');

export const options = {
  stages: STAGES.load,
  thresholds: {
    ...THRESHOLDS.load,
    workout_list_latency: ['p(95)<300'],
    workout_detail_latency: ['p(95)<200'],
    session_latency: ['p(95)<500'],
    profile_latency: ['p(95)<200'],
  },
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

  // Group: Workout browsing
  group('Workout Browsing', function () {
    // List workouts
    const listRes = http.get(`${API_BASE}/workouts?limit=20`, authParams);
    check(listRes, {
      'workouts list OK': (r) => r.status === 200,
    });
    errorRate.add(listRes.status !== 200);
    workoutListLatency.add(listRes.timings.duration);
    requestCount.add(1);

    sleep(0.5);

    // Get workout detail (if list returned items)
    try {
      const body = JSON.parse(listRes.body);
      const items = body.items || body.data || body;
      if (Array.isArray(items) && items.length > 0) {
        const workoutId = items[0].id;
        const detailRes = http.get(`${API_BASE}/workouts/${workoutId}`, authParams);
        check(detailRes, {
          'workout detail OK': (r) => r.status === 200,
        });
        errorRate.add(detailRes.status !== 200);
        workoutDetailLatency.add(detailRes.timings.duration);
        requestCount.add(1);
      }
    } catch (e) {
      // Ignore parsing errors
    }

    sleep(0.5);

    // Filter by category
    const categories = ['strength', 'cardio', 'yoga', 'hiit'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const filterRes = http.get(`${API_BASE}/workouts?category=${randomCategory}`, authParams);
    check(filterRes, {
      'filtered workouts OK': (r) => r.status === 200,
    });
    errorRate.add(filterRes.status !== 200);
    workoutListLatency.add(filterRes.timings.duration);
    requestCount.add(1);
  });

  sleep(1);

  // Group: User profile
  group('User Profile', function () {
    const profileRes = http.get(`${API_BASE}/users/me`, authParams);
    check(profileRes, {
      'profile OK': (r) => r.status === 200,
    });
    errorRate.add(profileRes.status !== 200);
    profileLatency.add(profileRes.timings.duration);
    requestCount.add(1);

    sleep(0.3);

    const statsRes = http.get(`${API_BASE}/users/me/stats`, authParams);
    check(statsRes, {
      'stats OK': (r) => r.status === 200 || r.status === 404,
    });
    profileLatency.add(statsRes.timings.duration);
    requestCount.add(1);
  });

  sleep(1);

  // Group: Gamification
  group('Gamification', function () {
    const achievementsRes = http.get(`${API_BASE}/achievements`, authParams);
    check(achievementsRes, {
      'achievements OK': (r) => r.status === 200,
    });
    errorRate.add(achievementsRes.status !== 200);
    requestCount.add(1);

    sleep(0.3);

    const leaderboardRes = http.get(`${API_BASE}/leaderboard?limit=10`, authParams);
    check(leaderboardRes, {
      'leaderboard OK': (r) => r.status === 200 || r.status === 404,
    });
    requestCount.add(1);
  });

  sleep(1);
}

export function teardown(data) {
  console.log('Load test completed');
}
