import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly userAvatar: Locator;
  readonly welcomeMessage: Locator;
  readonly streakCounter: Locator;
  readonly xpProgress: Locator;
  readonly levelBadge: Locator;
  readonly todayWorkoutsSection: Locator;
  readonly quickStartButton: Locator;
  readonly recentActivityFeed: Locator;
  readonly achievementNotification: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userAvatar = page.locator('[data-testid="user-avatar"]');
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.streakCounter = page.locator('[data-testid="streak-counter"]');
    this.xpProgress = page.locator('[data-testid="xp-progress"]');
    this.levelBadge = page.locator('[data-testid="level-badge"]');
    this.todayWorkoutsSection = page.locator('[data-testid="today-workouts"]');
    this.quickStartButton = page.locator('[data-testid="quick-start-button"]');
    this.recentActivityFeed = page.locator('[data-testid="activity-feed"]');
    this.achievementNotification = page.locator('[data-testid="achievement-notification"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectLoaded() {
    await expect(this.welcomeMessage).toBeVisible({ timeout: 10000 });
  }

  async getStreakCount(): Promise<number> {
    const text = await this.streakCounter.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0', 10);
  }

  async getLevel(): Promise<number> {
    const text = await this.levelBadge.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '1', 10);
  }

  async startQuickWorkout() {
    await this.quickStartButton.click();
    await this.page.waitForURL(/\/workouts\/.*\/play/);
  }

  async navigateToWorkouts() {
    await this.page.click('[data-testid="nav-workouts"]');
    await this.page.waitForURL(/\/workouts/);
  }

  async navigateToProfile() {
    await this.userAvatar.click();
    await this.page.click('[data-testid="profile-menu-item"]');
    await this.page.waitForURL(/\/profile/);
  }

  async expectAchievementUnlocked(achievementName?: string) {
    await expect(this.achievementNotification).toBeVisible({ timeout: 10000 });
    if (achievementName) {
      await expect(this.achievementNotification).toContainText(achievementName);
    }
  }

  async logout() {
    await this.userAvatar.click();
    await this.page.click('[data-testid="logout-menu-item"]');
    await this.page.waitForURL(/\/login/);
  }
}
