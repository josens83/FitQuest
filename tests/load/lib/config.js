/**
 * K6 Load Testing Configuration
 * Shared configuration for all load tests
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
export const API_BASE = `${BASE_URL}/api`;

// Test user credentials
export const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'loadtest@fitquest.com',
  password: __ENV.TEST_PASSWORD || 'LoadTest123!',
};

// Thresholds for different test types
export const THRESHOLDS = {
  smoke: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  load: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  stress: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
  },
  spike: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
  },
  soak: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

// Stage configurations
export const STAGES = {
  smoke: [
    { duration: '1m', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '1m', target: 0 },
  ],
  load: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  stress: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '5m', target: 0 },
  ],
  spike: [
    { duration: '1m', target: 100 },
    { duration: '10s', target: 1000 },
    { duration: '3m', target: 1000 },
    { duration: '10s', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '10s', target: 1000 },
    { duration: '3m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
  soak: [
    { duration: '5m', target: 100 },
    { duration: '4h', target: 100 },
    { duration: '5m', target: 0 },
  ],
};

// HTTP request defaults
export const HTTP_PARAMS = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: '30s',
};
