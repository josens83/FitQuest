import { test, expect, waitForApi } from '../fixtures/test-fixtures';
import { DashboardPage } from '../pages/DashboardPage';
import {
  WorkoutsPage,
  WorkoutDetailPage,
  WorkoutPlayerPage,
  WorkoutCompletePage,
} from '../pages/WorkoutsPage';

test.describe('Workout Flow', () => {
  test.describe('Workout Discovery', () => {
    test('should display workout list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);

      await workoutsPage.goto();
      await workoutsPage.expectLoaded();
      await workoutsPage.expectWorkoutsVisible(1);
    });

    test('should filter workouts by category', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);

      await workoutsPage.goto();
      await workoutsPage.filterByCategory('strength');

      // All visible workouts should be strength category
      const cards = page.locator('[data-testid="workout-card"]');
      const count = await cards.count();

      for (let i = 0; i < count; i++) {
        const category = await cards.nth(i).locator('[data-testid="workout-category"]').textContent();
        expect(category?.toLowerCase()).toContain('strength');
      }
    });

    test('should filter workouts by difficulty', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);

      await workoutsPage.goto();
      await workoutsPage.filterByDifficulty('beginner');

      const cards = page.locator('[data-testid="workout-card"]');
      const count = await cards.count();

      for (let i = 0; i < count; i++) {
        const difficulty = await cards.nth(i).locator('[data-testid="workout-difficulty"]').textContent();
        expect(difficulty?.toLowerCase()).toContain('beginner');
      }
    });

    test('should search workouts', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);

      await workoutsPage.goto();
      await workoutsPage.search('cardio');

      // Wait for search results
      await page.waitForTimeout(500);

      // Should have filtered results
      const cards = page.locator('[data-testid="workout-card"]');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should show empty state when no results', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);

      await workoutsPage.goto();
      await workoutsPage.search('xyznonexistent123');

      await workoutsPage.expectEmptyState();
    });

    test('should load more workouts on scroll', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);

      await workoutsPage.goto();

      const initialCount = await workoutsPage.getWorkoutCount();

      // Load more if available
      if (await workoutsPage.loadMoreButton.isVisible()) {
        await workoutsPage.loadMore();
        const newCount = await workoutsPage.getWorkoutCount();
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });
  });

  test.describe('Workout Detail', () => {
    test('should display workout details', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);

      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);

      await detailPage.expectLoaded();
      await expect(detailPage.description).toBeVisible();
      await expect(detailPage.duration).toBeVisible();
      await expect(detailPage.exerciseList).toBeVisible();
    });

    test('should toggle favorite', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);

      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);

      // Click favorite
      const initialState = await detailPage.favoriteButton.getAttribute('data-favorited');
      await detailPage.toggleFavorite();

      // Wait for API response
      await page.waitForTimeout(500);

      // State should change
      const newState = await detailPage.favoriteButton.getAttribute('data-favorited');
      expect(newState).not.toBe(initialState);
    });

    test('should navigate back to list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);

      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);
      await detailPage.goBack();

      await expect(page).toHaveURL(/\/workouts$/);
    });
  });

  test.describe('Workout Session', () => {
    test('should start and complete a workout', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);
      const playerPage = new WorkoutPlayerPage(page);
      const completePage = new WorkoutCompletePage(page);

      // Navigate to workout
      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);

      // Get expected XP reward
      const expectedXp = await detailPage.getXpReward();

      // Start workout
      await detailPage.startWorkout();
      await playerPage.expectLoaded();

      // Complete workout (fast-forward for testing)
      await playerPage.simulateFullWorkout();

      // Verify completion screen
      await completePage.expectLoaded();

      const earnedXp = await completePage.getXpEarned();
      expect(earnedXp).toBeGreaterThanOrEqual(expectedXp);
    });

    test('should pause and resume workout', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);
      const playerPage = new WorkoutPlayerPage(page);

      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);
      await detailPage.startWorkout();

      // Pause
      await playerPage.pause();
      await expect(page.locator('[data-testid="paused-overlay"]')).toBeVisible();

      // Resume
      await playerPage.resume();
      await expect(page.locator('[data-testid="paused-overlay"]')).not.toBeVisible();
    });

    test('should quit workout with confirmation', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);
      const playerPage = new WorkoutPlayerPage(page);

      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);
      await detailPage.startWorkout();

      await playerPage.quitWorkout();

      await expect(page).toHaveURL(/\/workouts/);
    });

    test('should track progress through exercises', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);
      const playerPage = new WorkoutPlayerPage(page);

      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);
      await detailPage.startWorkout();

      // Get initial counter
      const initialCounter = await playerPage.exerciseCounter.textContent();

      // Go to next exercise
      await playerPage.nextExercise();

      const newCounter = await playerPage.exerciseCounter.textContent();
      expect(newCounter).not.toBe(initialCounter);
    });
  });

  test.describe('Workout Completion', () => {
    test('should display XP earned', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);
      const playerPage = new WorkoutPlayerPage(page);
      const completePage = new WorkoutCompletePage(page);

      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);
      await detailPage.startWorkout();
      await playerPage.simulateFullWorkout();

      await expect(completePage.xpEarned).toBeVisible();
      const xp = await completePage.getXpEarned();
      expect(xp).toBeGreaterThan(0);
    });

    test('should display calories burned', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);
      const playerPage = new WorkoutPlayerPage(page);
      const completePage = new WorkoutCompletePage(page);

      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);
      await detailPage.startWorkout();
      await playerPage.simulateFullWorkout();

      await expect(completePage.caloriesBurned).toBeVisible();
    });

    test('should return to dashboard after completion', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      const workoutsPage = new WorkoutsPage(page);
      const detailPage = new WorkoutDetailPage(page);
      const playerPage = new WorkoutPlayerPage(page);
      const completePage = new WorkoutCompletePage(page);

      await workoutsPage.goto();
      await workoutsPage.selectWorkout(0);
      await detailPage.startWorkout();
      await playerPage.simulateFullWorkout();

      await completePage.returnToDashboard();

      await expect(page).toHaveURL(/\/dashboard/);
    });
  });
});

test.describe('Quick Start Workout', () => {
  test('should start workout from dashboard', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.goto();
    await dashboardPage.startQuickWorkout();

    await expect(page).toHaveURL(/\/workouts\/.*\/play/);
  });
});
