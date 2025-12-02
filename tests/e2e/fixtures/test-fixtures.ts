import { test as base, expect, Page } from '@playwright/test';

// Test user credentials
export const TEST_USER = {
  email: 'test@fitquest.app',
  password: 'Test123!@#',
  name: 'Test User',
};

export const PREMIUM_USER = {
  email: 'premium@fitquest.app',
  password: 'Premium123!@#',
  name: 'Premium User',
};

// API endpoints
export const API_URL = process.env.API_URL || 'http://localhost:3000';

// Custom fixtures
interface TestFixtures {
  authenticatedPage: Page;
  premiumPage: Page;
}

// Extend the base test with custom fixtures
export const test = base.extend<TestFixtures>({
  // Page with authenticated test user
  authenticatedPage: async ({ page }, use) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password);
    await use(page);
  },

  // Page with premium user
  premiumPage: async ({ page }, use) => {
    await loginUser(page, PREMIUM_USER.email, PREMIUM_USER.password);
    await use(page);
  },
});

// Helper function to login
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
}

// Export expect for convenience
export { expect };

// Test data generators
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@fitquest.app`;
}

export function generateTestUser() {
  return {
    email: generateTestEmail(),
    password: 'TestPass123!@#',
    name: `Test User ${Date.now()}`,
  };
}

// Common assertions
export async function expectToBeLoggedIn(page: Page) {
  // Should see dashboard or user avatar
  await expect(
    page.locator('[data-testid="user-avatar"], [data-testid="dashboard"]')
  ).toBeVisible({ timeout: 10000 });
}

export async function expectToBeLoggedOut(page: Page) {
  // Should see login button or be on login page
  await expect(
    page.locator('[data-testid="login-button"], [data-testid="login-form"]')
  ).toBeVisible({ timeout: 10000 });
}

// Wait helpers
export async function waitForApi(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (response) => {
      if (typeof urlPattern === 'string') {
        return response.url().includes(urlPattern);
      }
      return urlPattern.test(response.url());
    },
    { timeout: 30000 }
  );
}

export async function waitForToast(page: Page, type: 'success' | 'error' = 'success') {
  const selector = type === 'success'
    ? '[data-testid="toast-success"]'
    : '[data-testid="toast-error"]';

  await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
}

// Mock helpers for testing without real API
export async function mockApiResponse(
  page: Page,
  urlPattern: string,
  response: object,
  status: number = 200
) {
  await page.route(`**/${urlPattern}`, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

export async function mockApiError(
  page: Page,
  urlPattern: string,
  status: number = 500,
  message: string = 'Internal server error'
) {
  await page.route(`**/${urlPattern}`, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message, error: true }),
    });
  });
}
