import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;
  readonly googleLoginButton: Locator;
  readonly appleLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
    this.registerLink = page.locator('[data-testid="register-link"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.googleLoginButton = page.locator('[data-testid="google-login"]');
    this.appleLoginButton = page.locator('[data-testid="apple-login"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoginSuccess() {
    await this.page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
  }

  async expectLoginError(errorText?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (errorText) {
      await expect(this.errorMessage).toContainText(errorText);
    }
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/\/forgot-password/);
  }

  async goToRegister() {
    await this.registerLink.click();
    await this.page.waitForURL(/\/register/);
  }
}
