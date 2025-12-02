/**
 * Authentication Helper for K6 Load Tests
 */

import http from 'k6/http';
import { check } from 'k6';
import { API_BASE, TEST_USER, HTTP_PARAMS } from './config.js';

let cachedToken = null;

/**
 * Login and get access token
 */
export function login(email = TEST_USER.email, password = TEST_USER.password) {
  const payload = JSON.stringify({ email, password });

  const response = http.post(`${API_BASE}/auth/login`, payload, HTTP_PARAMS);

  const success = check(response, {
    'login successful': (r) => r.status === 200 || r.status === 201,
    'has access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken || body.access_token || body.token;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    try {
      const body = JSON.parse(response.body);
      return body.accessToken || body.access_token || body.token;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Get cached token or login
 */
export function getToken() {
  if (!cachedToken) {
    cachedToken = login();
  }
  return cachedToken;
}

/**
 * Get authenticated HTTP params
 */
export function getAuthParams(token = null) {
  const authToken = token || getToken();

  return {
    ...HTTP_PARAMS,
    headers: {
      ...HTTP_PARAMS.headers,
      'Authorization': `Bearer ${authToken}`,
    },
  };
}

/**
 * Register a new user
 */
export function register(email, password, name = 'Test User') {
  const payload = JSON.stringify({
    email,
    password,
    name,
  });

  const response = http.post(`${API_BASE}/auth/register`, payload, HTTP_PARAMS);

  return check(response, {
    'registration successful': (r) => r.status === 200 || r.status === 201,
  });
}
