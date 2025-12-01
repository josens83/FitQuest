-- Performance Optimization Indexes for FitQuest
-- Run with: psql -f 001_performance_indexes.sql

-- =====================================================
-- User-related indexes
-- =====================================================

-- Fast user lookup by email (login)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
  ON users(email) WHERE deleted_at IS NULL;

-- Username search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_search
  ON users(username varchar_pattern_ops) WHERE deleted_at IS NULL;

-- Leaderboard queries (sorted by XP)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_leaderboard
  ON users(total_xp DESC, level DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- Workout-related indexes
-- =====================================================

-- Workout listing with filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workouts_category_difficulty
  ON workouts(category, difficulty) WHERE is_published = true;

-- Workout search by trainer
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workouts_trainer
  ON workouts(trainer_id) WHERE is_published = true;

-- Recently added workouts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workouts_created
  ON workouts(created_at DESC) WHERE is_published = true;

-- Premium content filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workouts_premium
  ON workouts(is_premium, category) WHERE is_published = true;

-- =====================================================
-- Session-related indexes
-- =====================================================

-- User's workout sessions (history)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_status
  ON workout_sessions(user_id, status, started_at DESC);

-- Active sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active
  ON workout_sessions(user_id, status) WHERE status = 'in_progress';

-- Session completion for stats
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_completed
  ON workout_sessions(user_id, completed_at DESC) WHERE status = 'completed';

-- Daily workout count (for streak calculation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_daily
  ON workout_sessions(user_id, DATE(completed_at)) WHERE status = 'completed';

-- =====================================================
-- Achievement-related indexes
-- =====================================================

-- User's unlocked achievements
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_user_unlocked
  ON user_achievements(user_id, unlocked_at DESC) WHERE unlocked_at IS NOT NULL;

-- Pending achievements (for checking unlock conditions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_pending
  ON user_achievements(user_id) WHERE unlocked_at IS NULL;

-- Achievement lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_code
  ON achievements(code) WHERE is_active = true;

-- =====================================================
-- Challenge-related indexes
-- =====================================================

-- Active challenges
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_active
  ON challenges(start_date, end_date) WHERE is_active = true;

-- Challenge participants
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_participants_user
  ON challenge_participants(user_id, challenge_id);

-- Challenge leaderboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_participants_progress
  ON challenge_participants(challenge_id, progress DESC);

-- =====================================================
-- Social-related indexes
-- =====================================================

-- Friendship lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendships_lookup
  ON friendships(user_id, friend_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendships_reverse
  ON friendships(friend_id, user_id, status);

-- Activity feed (user's own + friends')
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_feed_user
  ON activity_feed(user_id, created_at DESC) WHERE is_private = false;

-- Feed for timeline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_feed_timeline
  ON activity_feed(created_at DESC) WHERE is_private = false;

-- =====================================================
-- Subscription-related indexes
-- =====================================================

-- Active subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_active
  ON subscriptions(user_id, status) WHERE status IN ('active', 'trialing');

-- Subscription renewal check
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_renewal
  ON subscriptions(end_date, status) WHERE auto_renew = true AND status = 'active';

-- Payment history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user
  ON payments(user_id, created_at DESC);

-- =====================================================
-- Nutrition-related indexes
-- =====================================================

-- Daily nutrition logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nutrition_daily
  ON nutrition_logs(user_id, date DESC);

-- Body metrics history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_body_metrics_user
  ON body_metrics(user_id, date DESC);

-- =====================================================
-- Full-text search indexes (PostgreSQL specific)
-- =====================================================

-- Workout title search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workouts_title_fts
  ON workouts USING gin(to_tsvector('korean', title || ' ' || COALESCE(description, '')));

-- User search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search_fts
  ON users USING gin(to_tsvector('simple', username));

-- =====================================================
-- Partial indexes for common queries
-- =====================================================

-- Users with streaks (for streak-based features)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_with_streak
  ON users(current_streak DESC) WHERE current_streak > 0;

-- Premium users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_premium
  ON users(subscription_tier, created_at) WHERE subscription_tier != 'free';

-- =====================================================
-- Composite indexes for complex queries
-- =====================================================

-- Workout recommendations (by category, difficulty, XP)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workouts_recommendations
  ON workouts(category, difficulty, xp_reward DESC)
  WHERE is_published = true;

-- Session analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_analytics
  ON workout_sessions(workout_id, status, completed_at)
  WHERE status = 'completed';

-- =====================================================
-- Analyze tables to update statistics
-- =====================================================

ANALYZE users;
ANALYZE workouts;
ANALYZE workout_sessions;
ANALYZE user_achievements;
ANALYZE challenges;
ANALYZE challenge_participants;
ANALYZE friendships;
ANALYZE activity_feed;
ANALYZE subscriptions;
ANALYZE payments;
ANALYZE nutrition_logs;
ANALYZE body_metrics;
