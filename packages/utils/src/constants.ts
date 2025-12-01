// App Constants
export const APP_NAME = 'FitQuest';
export const APP_DESCRIPTION = '게이미피케이션 홈 피트니스 플랫폼';

// Subscription Pricing (KRW)
export const SUBSCRIPTION_PRICES = {
  premium: {
    monthly: 9900,
    yearly: 99000,
  },
  premium_plus: {
    monthly: 19900,
    yearly: 199000,
  },
};

// Free Tier Limits
export const FREE_TIER_LIMITS = {
  workoutsPerMonth: 8,
  aiCoachChats: 3,
};

// Workout Defaults
export const WORKOUT_DEFAULTS = {
  countdownDuration: 10, // seconds
  restDuration: 30, // seconds
};

// Nutrition Defaults
export const NUTRITION_DEFAULTS = {
  calorieGoal: 2000,
  waterGoal: 2000, // ml
};

// Gamification Constants
export const GAMIFICATION = {
  maxLevel: 50,
  baseXPPerWorkout: 50,
  streakBonusThreshold: 7,
  maxStatValue: 100,
};

// Heart Rate Zones
export const HEART_RATE_ZONES = [
  { name: '휴식', minPercent: 50, maxPercent: 60, color: '#94A3B8' },
  { name: '지방 연소', minPercent: 60, maxPercent: 70, color: '#22C55E' },
  { name: '유산소', minPercent: 70, maxPercent: 80, color: '#EAB308' },
  { name: '무산소', minPercent: 80, maxPercent: 90, color: '#F97316' },
  { name: '최대', minPercent: 90, maxPercent: 100, color: '#EF4444' },
];

// Category Colors
export const CATEGORY_COLORS: Record<string, string> = {
  strength: '#EF4444',
  cardio: '#3B82F6',
  hiit: '#F97316',
  yoga: '#8B5CF6',
  pilates: '#EC4899',
  stretching: '#10B981',
  dance: '#F59E0B',
  boxing: '#DC2626',
  meditation: '#6366F1',
  posture: '#14B8A6',
  running: '#0EA5E9',
};

// Difficulty Colors
export const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
};

// Medal Colors
export const MEDAL_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

// Stat Colors
export const STAT_COLORS: Record<string, string> = {
  strength: '#EF4444',
  endurance: '#3B82F6',
  flexibility: '#10B981',
  balance: '#F59E0B',
  mindfulness: '#8B5CF6',
};

// API Endpoints
export const API_ENDPOINTS = {
  auth: '/api/auth',
  users: '/api/users',
  workouts: '/api/workouts',
  sessions: '/api/sessions',
  gamification: '/api/gamification',
  achievements: '/api/achievements',
  leaderboard: '/api/leaderboard',
  events: '/api/events',
  challenges: '/api/challenges',
  coach: '/api/coach',
  nutrition: '/api/nutrition',
  body: '/api/body',
  friends: '/api/friends',
  feed: '/api/feed',
  subscription: '/api/subscription',
};

// Storage Keys
export const STORAGE_KEYS = {
  authToken: 'fitquest_auth_token',
  refreshToken: 'fitquest_refresh_token',
  user: 'fitquest_user',
  settings: 'fitquest_settings',
  workoutProgress: 'fitquest_workout_progress',
  downloadedWorkouts: 'fitquest_downloaded_workouts',
};

// Cache TTL (seconds)
export const CACHE_TTL = {
  leaderboard: 60, // 1 minute
  workoutList: 300, // 5 minutes
  userProfile: 120, // 2 minutes
  achievements: 600, // 10 minutes
};

// Pagination
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
};
