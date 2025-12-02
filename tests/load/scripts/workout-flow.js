/**
 * Workout Flow Test
 * Simulates complete user workout journey under load
 * Run: k6 run scripts/workout-flow.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { API_BASE, THRESHOLDS, HTTP_PARAMS } from '../lib/config.js';
import { login, getAuthParams } from '../lib/auth.js';

// Custom metrics
const errorRate = new Rate('errors');
const workoutFlowSuccess = new Rate('workout_flow_success');
const browseLatency = new Trend('browse_latency', true);
const sessionStartLatency = new Trend('session_start_latency', true);
const sessionCompleteLatency = new Trend('session_complete_latency', true);
const xpCalculationLatency = new Trend('xp_calculation_latency', true);

export const options = {
  scenarios: {
    // Casual users - occasional workouts
    casual_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    // Active users - daily workouts
    active_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      startTime: '1m',
    },
    // Power users - multiple daily workouts
    power_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      startTime: '2m',
    },
  },
  thresholds: {
    ...THRESHOLDS.load,
    workout_flow_success: ['rate>0.95'],
    browse_latency: ['p(95)<300'],
    session_start_latency: ['p(95)<500'],
    session_complete_latency: ['p(95)<1000'],
  },
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
  let flowSuccess = true;
  let workoutId = null;
  let sessionId = null;

  // Step 1: Browse workouts
  group('Step 1: Browse Workouts', function () {
    const res = http.get(`${API_BASE}/workouts?limit=20`, authParams);

    const browseOk = check(res, {
      'browse workouts OK': (r) => r.status === 200,
    });

    browseLatency.add(res.timings.duration);

    if (browseOk) {
      try {
        const body = JSON.parse(res.body);
        const items = body.items || body.data || body;
        if (Array.isArray(items) && items.length > 0) {
          // Pick a random workout
          workoutId = items[Math.floor(Math.random() * items.length)].id;
        }
      } catch (e) {
        flowSuccess = false;
      }
    } else {
      flowSuccess = false;
      errorRate.add(1);
    }
  });

  sleep(2); // User thinking time

  // Step 2: View workout details
  if (workoutId) {
    group('Step 2: View Workout Details', function () {
      const res = http.get(`${API_BASE}/workouts/${workoutId}`, authParams);

      const detailOk = check(res, {
        'workout detail OK': (r) => r.status === 200,
      });

      browseLatency.add(res.timings.duration);

      if (!detailOk) {
        flowSuccess = false;
        errorRate.add(1);
      }
    });

    sleep(3); // User reading workout details
  }

  // Step 3: Start workout session
  if (workoutId) {
    group('Step 3: Start Workout Session', function () {
      const payload = JSON.stringify({ workoutId });
      const res = http.post(`${API_BASE}/sessions`, payload, authParams);

      const startOk = check(res, {
        'session start OK': (r) => r.status === 200 || r.status === 201,
      });

      sessionStartLatency.add(res.timings.duration);

      if (startOk) {
        try {
          const body = JSON.parse(res.body);
          sessionId = body.id || body.sessionId;
        } catch (e) {
          flowSuccess = false;
        }
      } else {
        flowSuccess = false;
        errorRate.add(1);
      }
    });
  }

  // Step 4: Simulate workout progress (multiple updates)
  if (sessionId) {
    group('Step 4: Workout Progress', function () {
      const exerciseCount = Math.floor(Math.random() * 5) + 3; // 3-7 exercises

      for (let i = 0; i < exerciseCount; i++) {
        sleep(1); // Time between exercises

        const progressPayload = JSON.stringify({
          exerciseIndex: i,
          progress: Math.floor(((i + 1) / exerciseCount) * 100),
          caloriesBurned: (i + 1) * 20,
        });

        const res = http.patch(
          `${API_BASE}/sessions/${sessionId}`,
          progressPayload,
          authParams
        );

        check(res, {
          'progress update OK': (r) => r.status === 200 || r.status === 404,
        });
      }
    });
  }

  // Step 5: Complete workout session
  if (sessionId) {
    group('Step 5: Complete Workout', function () {
      const completePayload = JSON.stringify({
        status: 'completed',
        actualDuration: Math.floor(Math.random() * 1800) + 600, // 10-40 minutes
        caloriesBurned: Math.floor(Math.random() * 300) + 100,
        rating: Math.floor(Math.random() * 5) + 1,
      });

      const res = http.post(
        `${API_BASE}/sessions/${sessionId}/complete`,
        completePayload,
        authParams
      );

      const completeOk = check(res, {
        'session complete OK': (r) => r.status === 200 || r.status === 201,
      });

      sessionCompleteLatency.add(res.timings.duration);

      if (!completeOk) {
        flowSuccess = false;
        errorRate.add(1);
      }
    });

    sleep(1);

    // Step 6: Check XP and achievements
    group('Step 6: Check Results', function () {
      const profileRes = http.get(`${API_BASE}/users/me`, authParams);
      check(profileRes, {
        'profile after workout OK': (r) => r.status === 200,
      });
      xpCalculationLatency.add(profileRes.timings.duration);

      const achievementsRes = http.get(`${API_BASE}/achievements`, authParams);
      check(achievementsRes, {
        'achievements check OK': (r) => r.status === 200,
      });
    });
  }

  workoutFlowSuccess.add(flowSuccess);
  sleep(5); // Rest between workouts
}

export function teardown(data) {
  console.log('Workout flow test completed');
}
