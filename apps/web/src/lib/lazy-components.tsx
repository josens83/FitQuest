'use client';

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

// Loading skeleton components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const CardSkeleton = () => (
  <div className="animate-pulse rounded-lg border bg-card p-6">
    <div className="mb-4 h-4 w-3/4 rounded bg-muted" />
    <div className="mb-2 h-3 w-full rounded bg-muted" />
    <div className="h-3 w-2/3 rounded bg-muted" />
  </div>
);

const ChartSkeleton = () => (
  <div className="animate-pulse rounded-lg border bg-card p-6">
    <div className="mb-4 h-4 w-1/3 rounded bg-muted" />
    <div className="h-64 w-full rounded bg-muted" />
  </div>
);

const TableSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-10 w-full rounded bg-muted" />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 w-full rounded bg-muted" />
    ))}
  </div>
);

// Generic lazy loader wrapper
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: ComponentType = LoadingSpinner
) {
  return dynamic(importFn, {
    loading: () => <LoadingComponent />,
    ssr: false,
  });
}

// Lazy loaded heavy components
export const LazyChart = dynamic(
  () => import('@/components/charts/Chart').then((mod) => mod.Chart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyWorkoutPlayer = dynamic(
  () => import('@/components/workout/WorkoutPlayer').then((mod) => mod.WorkoutPlayer),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyAchievementModal = dynamic(
  () => import('@/components/achievements/AchievementModal').then((mod) => mod.AchievementModal),
  {
    loading: () => null,
    ssr: false,
  }
);

export const LazyLeaderboard = dynamic(
  () => import('@/components/social/Leaderboard').then((mod) => mod.Leaderboard),
  {
    loading: () => <TableSkeleton />,
    ssr: false,
  }
);

export const LazyActivityFeed = dynamic(
  () => import('@/components/social/ActivityFeed').then((mod) => mod.ActivityFeed),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

export const LazyProgressCharts = dynamic(
  () => import('@/components/analytics/ProgressCharts').then((mod) => mod.ProgressCharts),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyCalendarHeatmap = dynamic(
  () => import('@/components/analytics/CalendarHeatmap').then((mod) => mod.CalendarHeatmap),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyExerciseVideo = dynamic(
  () => import('@/components/workout/ExerciseVideo').then((mod) => mod.ExerciseVideo),
  {
    loading: () => (
      <div className="animate-pulse aspect-video w-full rounded-lg bg-muted" />
    ),
    ssr: false,
  }
);

export const LazyMarkdownRenderer = dynamic(
  () => import('@/components/common/MarkdownRenderer').then((mod) => mod.MarkdownRenderer),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

export const LazyImageGallery = dynamic(
  () => import('@/components/common/ImageGallery').then((mod) => mod.ImageGallery),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

// Lazy loaded modals (no SSR, load on demand)
export const LazyShareModal = dynamic(
  () => import('@/components/modals/ShareModal').then((mod) => mod.ShareModal),
  {
    loading: () => null,
    ssr: false,
  }
);

export const LazySettingsModal = dynamic(
  () => import('@/components/modals/SettingsModal').then((mod) => mod.SettingsModal),
  {
    loading: () => null,
    ssr: false,
  }
);

export const LazyProfileEditor = dynamic(
  () => import('@/components/profile/ProfileEditor').then((mod) => mod.ProfileEditor),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

// Preload function for route transitions
export function preloadComponent(
  importFn: () => Promise<any>
): void {
  // Use requestIdleCallback for non-critical preloading
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      importFn();
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      importFn();
    }, 200);
  }
}

// Preload commonly accessed components after initial page load
export function preloadCommonComponents(): void {
  if (typeof window === 'undefined') return;

  // Preload after initial page load
  window.addEventListener('load', () => {
    // Delay to not interfere with initial load
    setTimeout(() => {
      preloadComponent(() => import('@/components/workout/WorkoutPlayer'));
      preloadComponent(() => import('@/components/achievements/AchievementModal'));
    }, 3000);
  }, { once: true });
}

// Route-based preloading
export const routePreloads: Record<string, () => void> = {
  '/workouts': () => {
    preloadComponent(() => import('@/components/workout/WorkoutPlayer'));
  },
  '/dashboard': () => {
    preloadComponent(() => import('@/components/charts/Chart'));
    preloadComponent(() => import('@/components/social/ActivityFeed'));
  },
  '/profile': () => {
    preloadComponent(() => import('@/components/profile/ProfileEditor'));
    preloadComponent(() => import('@/components/analytics/ProgressCharts'));
  },
  '/social': () => {
    preloadComponent(() => import('@/components/social/Leaderboard'));
    preloadComponent(() => import('@/components/social/ActivityFeed'));
  },
};
