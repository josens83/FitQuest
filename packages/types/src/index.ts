// FitQuest - Shared Type Definitions
// Gamification-based Home Fitness Platform

// ============================================
// User & Authentication
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  subscription: SubscriptionTier;
  subscriptionExpiresAt?: Date;
  profile?: UserProfile;
  level: number;
  totalXP: number;
  currentXP: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutAt?: Date;
  fitnessClass: FitnessClass;
  classLevel: number;
  stats: UserStats;
  settings: UserSettings;
  connectedDevices: ConnectedDevice[];
  lastActiveAt: Date;
  createdAt: Date;
}

export interface UserProfile {
  displayName: string;
  bio?: string;
  birthDate?: Date;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  location?: string;
}

export interface UserStats {
  strength: number;
  endurance: number;
  flexibility: number;
  balance: number;
  mindfulness: number;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  workout: WorkoutSettings;
}

export interface NotificationSettings {
  workoutReminder: boolean;
  reminderTime?: string;
  socialActivity: boolean;
  challenges: boolean;
  marketing: boolean;
}

export interface PrivacySettings {
  showActivity: boolean;
  showStats: boolean;
  allowFriendRequests: boolean;
}

export interface WorkoutSettings {
  countdownDuration: number;
  restDuration: number;
  voiceGuidance: boolean;
  backgroundMusic: boolean;
  autoPlayNext: boolean;
}

export interface ConnectedDevice {
  type: DeviceType;
  connectedAt: Date;
  lastSyncAt?: Date;
}

export type DeviceType = 'apple_health' | 'google_fit' | 'samsung_health' | 'fitbit' | 'garmin';

export type SubscriptionTier = 'free' | 'premium' | 'premium_plus';

export type FitnessClass = 'warrior' | 'runner' | 'yogi' | 'dancer' | 'athlete' | 'beginner';

// ============================================
// Workout System
// ============================================

export interface Workout {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
  category: WorkoutCategory;
  bodyParts: BodyPart[];
  equipment: Equipment[];
  difficulty: Difficulty;
  duration: number;
  calories: number;
  exercises: Exercise[];
  trainerId: string;
  trainer?: Trainer;
  accessType: AccessType;
  completionCount: number;
  rating: number;
  ratingCount: number;
  xpReward: number;
  badges?: string[];
  tags?: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkoutCategory =
  | 'strength'
  | 'cardio'
  | 'hiit'
  | 'yoga'
  | 'pilates'
  | 'stretching'
  | 'dance'
  | 'boxing'
  | 'meditation'
  | 'posture'
  | 'running';

export type BodyPart =
  | 'full_body'
  | 'upper_body'
  | 'lower_body'
  | 'core'
  | 'arms'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'legs'
  | 'glutes';

export type Equipment =
  | 'none'
  | 'mat'
  | 'dumbbell'
  | 'kettlebell'
  | 'resistance_band'
  | 'pull_up_bar'
  | 'foam_roller'
  | 'jump_rope'
  | 'yoga_block'
  | 'barbell'
  | 'bench';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type AccessType = 'free' | 'premium';

export interface Exercise {
  id: string;
  workoutId?: string;
  sortOrder: number;
  name: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  animationUrl?: string;
  type: ExerciseType;
  duration?: number;
  reps?: number;
  sets: number;
  restBetweenSets?: number;
  primaryMuscle: BodyPart;
  secondaryMuscles?: BodyPart[];
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  modifications?: ExerciseModifications;
  caloriesPerMinute: number;
}

export type ExerciseType = 'timed' | 'reps' | 'rest';

export interface ExerciseModifications {
  easier: string;
  harder: string;
}

export interface Trainer {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  specialties: WorkoutCategory[];
  certifications: string[];
  totalWorkouts: number;
  followerCount: number;
  avgRating: number;
  socialLinks?: SocialLinks;
  createdAt: Date;
}

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  twitter?: string;
}

// ============================================
// Workout Session
// ============================================

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutId: string;
  workout?: Workout;
  status: SessionStatus;
  startedAt: Date;
  pausedAt?: Date;
  completedAt?: Date;
  currentExerciseIndex: number;
  currentSetIndex: number;
  actualDuration: number;
  caloriesBurned: number;
  exercisesCompleted: number;
  totalExercises: number;
  heartRateData?: HeartRateData;
  xpEarned: number;
  badgesEarned: string[];
  personalRecords: string[];
  rating?: number;
  feedback?: string;
  difficultyFeedback?: DifficultyFeedback;
  createdAt: Date;
}

export type SessionStatus = 'in_progress' | 'paused' | 'completed' | 'abandoned';

export type DifficultyFeedback = 'too_easy' | 'just_right' | 'too_hard';

export interface HeartRateData {
  avg: number;
  max: number;
  min: number;
  zones: HeartRateZone[];
  readings: HeartRateReading[];
}

export interface HeartRateZone {
  zone: string;
  minBpm: number;
  maxBpm: number;
  duration: number;
  percentage: number;
}

export interface HeartRateReading {
  bpm: number;
  timestamp: Date;
}

// ============================================
// Gamification System
// ============================================

export interface GameProfile {
  userId: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string;
  titlesUnlocked: string[];
  fitnessClass: FitnessClass;
  classLevel: number;
  stats: UserStats;
  achievements: Achievement[];
  achievementPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutAt?: Date;
  medals: Medal[];
  seasonRank?: number;
  seasonPoints: number;
}

export interface Achievement {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: AchievementRequirement;
  xpReward: number;
  titleReward?: string;
  unlockedAt?: Date;
  progress: number;
  target: number;
}

export type AchievementCategory = 'workout' | 'streak' | 'social' | 'milestone' | 'special';

export interface AchievementRequirement {
  type: string;
  target: number;
  current: number;
}

export interface Medal {
  id: string;
  userId: string;
  eventId: string;
  eventName: string;
  name: string;
  description: string;
  imageUrl: string;
  tier: MedalTier;
  requirement: MedalRequirement;
  earnedAt: Date;
  shareableImageUrl: string;
}

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface MedalRequirement {
  type: 'distance' | 'time' | 'workouts' | 'calories';
  target: number;
}

export interface VirtualEvent {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string;
  startDate: Date;
  endDate: Date;
  type: EventType;
  goal: EventGoal;
  participantCount: number;
  registrationFee?: number;
  rewards: EventReward[];
  sponsors?: EventSponsor[];
  isActive: boolean;
  createdAt: Date;
}

export type EventType = 'running' | 'workout' | 'challenge';

export interface EventGoal {
  type: 'distance' | 'time' | 'workouts' | 'calories';
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

export interface EventReward {
  tier: MedalTier;
  medal: Partial<Medal>;
  xp: number;
  prizes?: string[];
}

export interface EventSponsor {
  name: string;
  logoUrl: string;
  url?: string;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  user?: User;
  joinedAt: Date;
  progress: number;
  rank?: number;
  completedAt?: Date;
  medalEarned?: MedalTier;
}

export interface Leaderboard {
  type: LeaderboardType;
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
  myRank?: number;
  myValue?: number;
  updatedAt: Date;
}

export type LeaderboardType = 'daily' | 'weekly' | 'monthly' | 'season' | 'all_time';

export type LeaderboardCategory = 'xp' | 'workouts' | 'calories' | 'streak' | 'minutes';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  value: number;
  level: number;
  change: number;
}

// ============================================
// AI Coach
// ============================================

export interface AICoachProfile {
  userId: string;
  profile: CoachUserProfile;
  currentPlanId?: string;
  currentPlan?: WorkoutPlan;
  insights: CoachInsight[];
  chatHistory: ChatMessage[];
  updatedAt: Date;
}

export interface CoachUserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  fitnessLevel: Difficulty;
  goals: FitnessGoal[];
  injuries?: string[];
  preferences: CoachPreferences;
}

export interface CoachPreferences {
  workoutDays: number[];
  preferredTime: 'morning' | 'afternoon' | 'evening';
  sessionDuration: number;
  favoriteCategories: WorkoutCategory[];
  dislikedExercises?: string[];
}

export type FitnessGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'improve_endurance'
  | 'increase_flexibility'
  | 'reduce_stress'
  | 'improve_posture'
  | 'general_fitness'
  | 'train_for_event';

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  duration: number;
  weeklySchedule: WeeklySchedule[];
  currentWeek: number;
  completedWorkouts: number;
  totalWorkouts: number;
  lastAdjustedAt?: Date;
  adjustmentReason?: string;
  createdAt: Date;
}

export interface WeeklySchedule {
  dayOfWeek: number;
  workoutId?: string;
  workout?: Workout;
  restDay: boolean;
  focus?: string;
}

export interface CoachInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  dataPoints?: InsightDataPoint[];
  action?: InsightAction;
  createdAt: Date;
  readAt?: Date;
}

export type InsightType = 'progress' | 'suggestion' | 'warning' | 'achievement' | 'motivation';

export interface InsightDataPoint {
  metric: string;
  current: number;
  previous: number;
  change: number;
}

export interface InsightAction {
  type: 'workout' | 'rest' | 'adjust' | 'view';
  workoutId?: string;
  message: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  message: string;
  timestamp: Date;
}

// ============================================
// Nutrition & Body Tracking
// ============================================

export interface NutritionLog {
  id: string;
  userId: string;
  date: Date;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  calorieGoal: number;
  calorieBalance: number;
  waterIntake: number;
  waterGoal: number;
  createdAt: Date;
}

export interface Meal {
  id: string;
  type: MealType;
  time: Date;
  foods: FoodItem[];
  totalCalories: number;
  photoUrl?: string;
  aiAnalysis?: AIFoodAnalysis;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  barcode?: string;
}

export interface AIFoodAnalysis {
  identifiedFoods: string[];
  estimatedCalories: number;
  estimatedProtein?: number;
  estimatedCarbs?: number;
  estimatedFat?: number;
  confidence: number;
}

export interface BodyMetrics {
  id: string;
  userId: string;
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  measurements?: BodyMeasurements;
  photoFront?: string;
  photoSide?: string;
  photoBack?: string;
  source: MetricSource;
  deviceId?: string;
  createdAt: Date;
}

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  thigh?: number;
  arm?: number;
  neck?: number;
}

export type MetricSource = 'manual' | 'smart_scale' | 'wearable';

export interface ProgressAnalysis {
  userId: string;
  period: AnalysisPeriod;
  weightChange: WeightChangeAnalysis;
  workoutStats: WorkoutStatsAnalysis;
  statChanges: Partial<UserStats>;
  insights: string[];
  recommendations: string[];
}

export type AnalysisPeriod = 'week' | 'month' | '3months' | 'year';

export interface WeightChangeAnalysis {
  start: number;
  current: number;
  change: number;
  trend: 'losing' | 'maintaining' | 'gaining';
}

export interface WorkoutStatsAnalysis {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  avgPerWeek: number;
  mostFrequentCategory: WorkoutCategory;
  completionRate: number;
}

// ============================================
// Social & Challenges
// ============================================

export interface Challenge {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string;
  type: ChallengeType;
  category?: WorkoutCategory;
  startDate: Date;
  endDate: Date;
  duration: number;
  goal: ChallengeGoal;
  maxParticipants?: number;
  currentParticipants: number;
  isPublic: boolean;
  rewards: ChallengeRewards;
  entryFee?: number;
  prizePool?: number;
  createdBy: string;
  creator?: User;
  createdAt: Date;
}

export type ChallengeType = 'solo' | 'group' | 'versus';

export interface ChallengeGoal {
  type: 'workouts' | 'minutes' | 'calories' | 'streak' | 'distance';
  target: number;
}

export interface ChallengeRewards {
  xp: number;
  badge?: string;
  title?: string;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  user?: User;
  joinedAt: Date;
  progress: number;
  target: number;
  completionRate: number;
  rank?: number;
  completedAt?: Date;
  rewardsEarned?: string[];
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  friend?: User;
  status: FriendshipStatus;
  createdAt: Date;
  acceptedAt?: Date;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface ActivityFeed {
  id: string;
  userId: string;
  user?: User;
  type: ActivityType;
  title: string;
  description?: string;
  imageUrl?: string;
  referenceId?: string;
  referenceType?: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isPublic: boolean;
  createdAt: Date;
}

export type ActivityType =
  | 'workout'
  | 'achievement'
  | 'challenge'
  | 'streak'
  | 'level_up'
  | 'medal'
  | 'personal_record';

export interface FeedComment {
  id: string;
  feedId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: Date;
}

export interface FeedLike {
  id: string;
  feedId: string;
  userId: string;
  createdAt: Date;
}

// ============================================
// Subscription & Payments
// ============================================

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
  price: number;
  currency: string;
  cancelledAt?: Date;
  createdAt: Date;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export type PaymentMethod = 'card' | 'apple_iap' | 'google_play' | 'toss';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  features: string[];
  price: number;
  currency: string;
  interval: 'month' | 'year';
  trialDays?: number;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ============================================
// Subscription Features
// ============================================

export interface SubscriptionFeatures {
  workoutsPerMonth: number | 'unlimited';
  aiCoachChats: number | 'unlimited';
  customPlans: boolean;
  adFree: boolean;
  offlineDownload: boolean;
  advancedStats: boolean;
  liveClasses: boolean;
  prioritySupport: boolean;
  personalCoaching?: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    workoutsPerMonth: 8,
    aiCoachChats: 3,
    customPlans: false,
    adFree: false,
    offlineDownload: false,
    advancedStats: false,
    liveClasses: false,
    prioritySupport: false,
  },
  premium: {
    workoutsPerMonth: 'unlimited',
    aiCoachChats: 20,
    customPlans: true,
    adFree: true,
    offlineDownload: true,
    advancedStats: true,
    liveClasses: false,
    prioritySupport: false,
  },
  premium_plus: {
    workoutsPerMonth: 'unlimited',
    aiCoachChats: 'unlimited',
    customPlans: true,
    adFree: true,
    offlineDownload: true,
    advancedStats: true,
    liveClasses: true,
    prioritySupport: true,
    personalCoaching: true,
  },
};

// ============================================
// Level & XP System
// ============================================

export interface LevelRequirement {
  level: number;
  xp: number;
  title: string;
}

export const LEVEL_REQUIREMENTS: LevelRequirement[] = [
  { level: 1, xp: 0, title: '운동 입문' },
  { level: 2, xp: 100, title: '운동 새싹' },
  { level: 3, xp: 250, title: '운동 견습생' },
  { level: 4, xp: 450, title: '운동 도전자' },
  { level: 5, xp: 700, title: '운동 습관' },
  { level: 6, xp: 1000, title: '운동 애호가' },
  { level: 7, xp: 1350, title: '피트니스 입문' },
  { level: 8, xp: 1750, title: '피트니스 견습' },
  { level: 9, xp: 2200, title: '피트니스 도전' },
  { level: 10, xp: 2700, title: '피트니스 러버' },
  { level: 15, xp: 5500, title: '피트니스 워리어' },
  { level: 20, xp: 10000, title: '피트니스 마스터' },
  { level: 25, xp: 16000, title: '피트니스 엘리트' },
  { level: 30, xp: 24000, title: '피트니스 챔피언' },
  { level: 35, xp: 34000, title: '피트니스 히어로' },
  { level: 40, xp: 46000, title: '피트니스 레전드' },
  { level: 45, xp: 60000, title: '피트니스 신화' },
  { level: 50, xp: 80000, title: '피트니스 전설' },
];

export interface XPReward {
  activity: string;
  baseXP: number;
  bonusConditions?: { condition: string; bonus: number }[];
}

export const XP_REWARDS: Record<string, XPReward> = {
  workout_beginner: { activity: '초급 운동 완료', baseXP: 50 },
  workout_intermediate: { activity: '중급 운동 완료', baseXP: 75 },
  workout_advanced: { activity: '고급 운동 완료', baseXP: 100 },
  daily_goal: { activity: '일일 목표 달성', baseXP: 30 },
  streak_bonus_7: { activity: '7일 연속 보너스', baseXP: 100 },
  streak_bonus_30: { activity: '30일 연속 보너스', baseXP: 500 },
  challenge_complete: { activity: '챌린지 완료', baseXP: 200 },
  friend_workout: { activity: '친구와 운동', baseXP: 20 },
  first_workout_day: { activity: '오늘 첫 운동', baseXP: 10 },
};

// ============================================
// Achievement Definitions
// ============================================

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: {
    type: string;
    target: number;
  };
  xpReward: number;
  titleReward?: string;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Workout achievements
  { id: 'first_workout', name: '첫 발걸음', description: '첫 운동 완료', icon: '👟', category: 'workout', requirement: { type: 'workouts', target: 1 }, xpReward: 50 },
  { id: 'workout_10', name: '꾸준한 시작', description: '10회 운동 완료', icon: '💪', category: 'workout', requirement: { type: 'workouts', target: 10 }, xpReward: 100 },
  { id: 'workout_50', name: '운동 마니아', description: '50회 운동 완료', icon: '🔥', category: 'workout', requirement: { type: 'workouts', target: 50 }, xpReward: 300 },
  { id: 'workout_100', name: '백전백승', description: '100회 운동 완료', icon: '🏆', category: 'workout', requirement: { type: 'workouts', target: 100 }, xpReward: 500 },
  { id: 'workout_365', name: '1년의 기적', description: '365회 운동 완료', icon: '⭐', category: 'workout', requirement: { type: 'workouts', target: 365 }, xpReward: 2000, titleReward: '운동 마스터' },

  // Streak achievements
  { id: 'streak_3', name: '3일 챌린지', description: '3일 연속 운동', icon: '🔥', category: 'streak', requirement: { type: 'streak', target: 3 }, xpReward: 30 },
  { id: 'streak_7', name: '일주일 전사', description: '7일 연속 운동', icon: '💫', category: 'streak', requirement: { type: 'streak', target: 7 }, xpReward: 100 },
  { id: 'streak_30', name: '한 달의 기적', description: '30일 연속 운동', icon: '🌟', category: 'streak', requirement: { type: 'streak', target: 30 }, xpReward: 500, titleReward: '꾸준함의 달인' },
  { id: 'streak_100', name: '백일장', description: '100일 연속 운동', icon: '🎖️', category: 'streak', requirement: { type: 'streak', target: 100 }, xpReward: 1000 },
  { id: 'streak_365', name: '레전드', description: '365일 연속 운동', icon: '👑', category: 'streak', requirement: { type: 'streak', target: 365 }, xpReward: 5000, titleReward: '피트니스 레전드' },

  // Calorie achievements
  { id: 'calories_1000', name: '칼로리 버너', description: '1,000 kcal 소모', icon: '🔥', category: 'milestone', requirement: { type: 'calories', target: 1000 }, xpReward: 50 },
  { id: 'calories_10000', name: '불꽃 전사', description: '10,000 kcal 소모', icon: '💥', category: 'milestone', requirement: { type: 'calories', target: 10000 }, xpReward: 200 },
  { id: 'calories_100000', name: '칼로리 정복자', description: '100,000 kcal 소모', icon: '🔱', category: 'milestone', requirement: { type: 'calories', target: 100000 }, xpReward: 1000 },

  // Special achievements
  { id: 'early_bird', name: '얼리버드', description: '오전 6시 전 운동', icon: '🌅', category: 'special', requirement: { type: 'early_workout', target: 1 }, xpReward: 30 },
  { id: 'night_owl', name: '올빼미', description: '밤 11시 후 운동', icon: '🦉', category: 'special', requirement: { type: 'late_workout', target: 1 }, xpReward: 30 },
  { id: 'weekend_warrior', name: '주말 전사', description: '주말 연속 운동 4주', icon: '⚔️', category: 'special', requirement: { type: 'weekend_streak', target: 4 }, xpReward: 200 },
  { id: 'variety_king', name: '다재다능', description: '5개 카테고리 운동', icon: '🎯', category: 'special', requirement: { type: 'categories', target: 5 }, xpReward: 150 },

  // Social achievements
  { id: 'first_friend', name: '첫 친구', description: '첫 친구 추가', icon: '🤝', category: 'social', requirement: { type: 'friends', target: 1 }, xpReward: 30 },
  { id: 'social_butterfly', name: '소셜 나비', description: '10명의 친구', icon: '🦋', category: 'social', requirement: { type: 'friends', target: 10 }, xpReward: 100 },
  { id: 'challenge_winner', name: '챌린지 승자', description: '첫 챌린지 완료', icon: '🏅', category: 'social', requirement: { type: 'challenges', target: 1 }, xpReward: 100 },
];

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================
// Filter & Query Types
// ============================================

export interface WorkoutFilters {
  category?: WorkoutCategory;
  difficulty?: Difficulty;
  duration?: { min?: number; max?: number };
  equipment?: Equipment[];
  bodyParts?: BodyPart[];
  accessType?: AccessType;
  trainerId?: string;
  search?: string;
}

export interface LeaderboardFilters {
  type: LeaderboardType;
  category: LeaderboardCategory;
  limit?: number;
}

export interface ChallengeFilters {
  type?: ChallengeType;
  category?: WorkoutCategory;
  status?: 'upcoming' | 'active' | 'ended';
  isPublic?: boolean;
}
