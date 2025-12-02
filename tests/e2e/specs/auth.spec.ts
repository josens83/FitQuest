import { test, expect, generateTestUser, mockApiError } from '../fixtures/test-fixtures';
import { LoginPage } from '../pages/LoginPage';

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('test@fitquest.app', 'Test123!@#');
      await loginPage.expectLoginSuccess();

      // Verify we're on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('invalid@email.com', 'wrongpassword');
      await loginPage.expectLoginError();
    });

    test('should show error for empty email', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.passwordInput.fill('somepassword');
      await loginPage.loginButton.click();

      // Email validation error
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    });

    test('should show error for empty password', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.emailInput.fill('test@email.com');
      await loginPage.loginButton.click();

      // Password validation error
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should navigate to forgot password', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.goToForgotPassword();
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('should navigate to registration', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.goToRegister();
      await expect(page).toHaveURL(/\/register/);
    });

    test('should handle API error gracefully', async ({ page }) => {
      // Mock API to return 500
      await mockApiError(page, '**/api/auth/login', 500, 'Server error');

      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('test@fitquest.app', 'Test123!@#');

      // Should show generic error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test('should persist login session', async ({ page, context }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('test@fitquest.app', 'Test123!@#');
      await loginPage.expectLoginSuccess();

      // Open new page in same context
      const newPage = await context.newPage();
      await newPage.goto('/dashboard');

      // Should still be logged in
      await expect(newPage.locator('[data-testid="welcome-message"]')).toBeVisible();
    });
  });

  test.describe('Registration', () => {
    test('should register new user successfully', async ({ page }) => {
      const newUser = generateTestUser();

      await page.goto('/register');

      await page.fill('[data-testid="name-input"]', newUser.name);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', newUser.password);
      await page.click('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="register-button"]');

      // Should redirect to dashboard or verification page
      await expect(page).toHaveURL(/\/(dashboard|verify-email)/);
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="password-mismatch-error"]')).toBeVisible();
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@fitquest.app'); // Existing user
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Password123!');
      await page.click('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="email-exists-error"]')).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="password-input"]', 'weak');

      await expect(page.locator('[data-testid="password-strength-error"]')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      await page.click('[data-testid="user-avatar"]');
      await page.click('[data-testid="logout-menu-item"]');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      // Should not be able to access dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Password Reset', () => {
    test('should send password reset email', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.fill('[data-testid="email-input"]', 'test@fitquest.app');
      await page.click('[data-testid="submit-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should show error for non-existent email', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.fill('[data-testid="email-input"]', 'nonexistent@email.com');
      await page.click('[data-testid="submit-button"]');

      // Should show error (or success for security - depends on implementation)
      await expect(
        page.locator('[data-testid="error-message"], [data-testid="success-message"]')
      ).toBeVisible();
    });
  });
});
