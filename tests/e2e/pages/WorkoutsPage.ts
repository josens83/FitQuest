import { Page, Locator, expect } from '@playwright/test';

export class WorkoutsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly difficultyFilter: Locator;
  readonly workoutList: Locator;
  readonly workoutCards: Locator;
  readonly loadMoreButton: Locator;
  readonly emptyState: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('[data-testid="workout-search"]');
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.difficultyFilter = page.locator('[data-testid="difficulty-filter"]');
    this.workoutList = page.locator('[data-testid="workout-list"]');
    this.workoutCards = page.locator('[data-testid="workout-card"]');
    this.loadMoreButton = page.locator('[data-testid="load-more"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');
  }

  async goto() {
    await this.page.goto('/workouts');
  }

  async expectLoaded() {
    await expect(this.workoutList).toBeVisible({ timeout: 10000 });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for search results to update
    await this.page.waitForTimeout(500);
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.click();
    await this.page.click(`[data-testid="category-option-${category}"]`);
  }

  async filterByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced') {
    await this.difficultyFilter.click();
    await this.page.click(`[data-testid="difficulty-option-${difficulty}"]`);
  }

  async getWorkoutCount(): Promise<number> {
    return this.workoutCards.count();
  }

  async selectWorkout(index: number = 0) {
    await this.workoutCards.nth(index).click();
    await this.page.waitForURL(/\/workouts\/[^/]+$/);
  }

  async selectWorkoutById(id: string) {
    await this.page.click(`[data-testid="workout-card-${id}"]`);
    await this.page.waitForURL(/\/workouts\/[^/]+$/);
  }

  async loadMore() {
    await this.loadMoreButton.click();
    // Wait for new workouts to load
    await this.page.waitForTimeout(1000);
  }

  async sortBy(option: 'popular' | 'newest' | 'duration' | 'difficulty') {
    await this.sortDropdown.click();
    await this.page.click(`[data-testid="sort-option-${option}"]`);
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectWorkoutsVisible(minCount: number = 1) {
    await expect(this.workoutCards.first()).toBeVisible();
    const count = await this.workoutCards.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }
}

export class WorkoutDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly description: Locator;
  readonly duration: Locator;
  readonly difficulty: Locator;
  readonly xpReward: Locator;
  readonly startButton: Locator;
  readonly exerciseList: Locator;
  readonly backButton: Locator;
  readonly favoriteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('[data-testid="workout-title"]');
    this.description = page.locator('[data-testid="workout-description"]');
    this.duration = page.locator('[data-testid="workout-duration"]');
    this.difficulty = page.locator('[data-testid="workout-difficulty"]');
    this.xpReward = page.locator('[data-testid="workout-xp-reward"]');
    this.startButton = page.locator('[data-testid="start-workout-button"]');
    this.exerciseList = page.locator('[data-testid="exercise-list"]');
    this.backButton = page.locator('[data-testid="back-button"]');
    this.favoriteButton = page.locator('[data-testid="favorite-button"]');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
    await expect(this.startButton).toBeVisible();
  }

  async startWorkout() {
    await this.startButton.click();
    await this.page.waitForURL(/\/workouts\/.*\/play/);
  }

  async toggleFavorite() {
    await this.favoriteButton.click();
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL(/\/workouts$/);
  }

  async getXpReward(): Promise<number> {
    const text = await this.xpReward.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0', 10);
  }
}

export class WorkoutPlayerPage {
  readonly page: Page;
  readonly currentExercise: Locator;
  readonly timer: Locator;
  readonly progressBar: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly pauseButton: Locator;
  readonly skipButton: Locator;
  readonly completeButton: Locator;
  readonly quitButton: Locator;
  readonly exerciseCounter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.currentExercise = page.locator('[data-testid="current-exercise"]');
    this.timer = page.locator('[data-testid="workout-timer"]');
    this.progressBar = page.locator('[data-testid="workout-progress"]');
    this.nextButton = page.locator('[data-testid="next-exercise-button"]');
    this.previousButton = page.locator('[data-testid="previous-exercise-button"]');
    this.pauseButton = page.locator('[data-testid="pause-button"]');
    this.skipButton = page.locator('[data-testid="skip-button"]');
    this.completeButton = page.locator('[data-testid="complete-workout-button"]');
    this.quitButton = page.locator('[data-testid="quit-workout-button"]');
    this.exerciseCounter = page.locator('[data-testid="exercise-counter"]');
  }

  async expectLoaded() {
    await expect(this.currentExercise).toBeVisible({ timeout: 10000 });
  }

  async nextExercise() {
    await this.nextButton.click();
  }

  async previousExercise() {
    await this.previousButton.click();
  }

  async pause() {
    await this.pauseButton.click();
  }

  async resume() {
    await this.page.click('[data-testid="resume-button"]');
  }

  async skip() {
    await this.skipButton.click();
  }

  async completeWorkout() {
    // Wait for complete button to be enabled (at end of workout)
    await expect(this.completeButton).toBeEnabled({ timeout: 60000 });
    await this.completeButton.click();
    await this.page.waitForURL(/\/workouts\/.*\/complete/);
  }

  async quitWorkout() {
    await this.quitButton.click();
    // Confirm quit dialog
    await this.page.click('[data-testid="confirm-quit"]');
    await this.page.waitForURL(/\/workouts/);
  }

  async simulateFullWorkout() {
    // Fast-forward through all exercises
    let hasNext = await this.nextButton.isVisible();
    while (hasNext) {
      await this.nextButton.click();
      await this.page.waitForTimeout(100);
      hasNext = await this.nextButton.isVisible().catch(() => false);
    }

    // Complete the workout
    await this.completeWorkout();
  }
}

export class WorkoutCompletePage {
  readonly page: Page;
  readonly congratsMessage: Locator;
  readonly xpEarned: Locator;
  readonly caloriesBurned: Locator;
  readonly duration: Locator;
  readonly newAchievements: Locator;
  readonly levelUp: Locator;
  readonly shareButton: Locator;
  readonly returnButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.congratsMessage = page.locator('[data-testid="congrats-message"]');
    this.xpEarned = page.locator('[data-testid="xp-earned"]');
    this.caloriesBurned = page.locator('[data-testid="calories-burned"]');
    this.duration = page.locator('[data-testid="actual-duration"]');
    this.newAchievements = page.locator('[data-testid="new-achievements"]');
    this.levelUp = page.locator('[data-testid="level-up-notification"]');
    this.shareButton = page.locator('[data-testid="share-button"]');
    this.returnButton = page.locator('[data-testid="return-button"]');
  }

  async expectLoaded() {
    await expect(this.congratsMessage).toBeVisible({ timeout: 10000 });
    await expect(this.xpEarned).toBeVisible();
  }

  async getXpEarned(): Promise<number> {
    const text = await this.xpEarned.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0', 10);
  }

  async expectAchievementUnlocked(achievementName?: string) {
    await expect(this.newAchievements).toBeVisible();
    if (achievementName) {
      await expect(this.newAchievements).toContainText(achievementName);
    }
  }

  async expectLevelUp() {
    await expect(this.levelUp).toBeVisible();
  }

  async returnToDashboard() {
    await this.returnButton.click();
    await this.page.waitForURL(/\/dashboard/);
  }
}
