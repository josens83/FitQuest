'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Play,
  Flame,
  Clock,
  Zap,
  TrendingUp,
  ChevronRight,
  Trophy,
  Target,
  Star,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  XPProgress,
  StatProgress,
  WorkoutProgressRing,
} from '@fitquest/ui';
import { formatCalories, formatMinutes } from '@fitquest/utils';

// Mock data
const user = {
  displayName: '도훈',
  level: 15,
  currentXP: 2450,
  xpToNextLevel: 3000,
  title: '피트니스 워리어',
  streak: 12,
  stats: {
    strength: 78,
    endurance: 65,
    flexibility: 52,
    balance: 45,
    mindfulness: 28,
  },
};

const weekStats = {
  workouts: 5,
  workoutsGoal: 7,
  calories: 2340,
  minutes: 180,
  statGain: 15,
};

const recommendedWorkout = {
  id: 'workout-hiit-1',
  title: '전신 HIIT 20분',
  difficulty: 'advanced',
  calories: 300,
  duration: 20,
  rating: 4.9,
  thumbnailUrl: '/workouts/hiit-1.jpg',
};

const activeChallenge = {
  id: 'challenge-1',
  name: '5월 30일 운동 챌린지',
  progress: 15,
  target: 30,
  participants: 1234,
  rank: 127,
};

const recentAchievements = [
  { id: '1', icon: '🔥', name: '7일 연속', xp: 100 },
  { id: '2', icon: '💪', name: '근력 50 달성', xp: 150 },
];

const upcomingWorkouts = [
  { day: '오늘', workout: '하체 & 힙업', time: '19:00' },
  { day: '내일', workout: '모닝 요가', time: '07:00' },
  { day: '모레', workout: '전신 HIIT', time: '18:30' },
];

export default function DashboardPage() {
  const greetingTime = new Date().getHours();
  const greeting =
    greetingTime < 12 ? '좋은 아침' : greetingTime < 18 ? '좋은 오후' : '좋은 저녁';

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">
            {greeting}, {user.displayName}님! 💪
          </h1>
          <p className="text-muted-foreground">오늘도 건강한 하루 보내세요.</p>
        </div>
        <Link href="/workouts">
          <Button variant="gradient" size="lg">
            <Play className="mr-2 h-5 w-5" />
            운동 시작하기
          </Button>
        </Link>
      </div>

      {/* Streak & Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Streak */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-3xl text-white">
                  🔥
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {user.streak}일 연속
                  </div>
                  <div className="text-muted-foreground">
                    최고 기록까지 3일 남았어요!
                  </div>
                </div>
              </div>

              {/* Level & XP */}
              <div className="flex-1 max-w-md">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="xp">Lv.{user.level}</Badge>
                  <span className="font-medium text-violet-600">{user.title}</span>
                </div>
                <XPProgress
                  current={user.currentXP}
                  max={user.xpToNextLevel}
                  level={user.level}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Zap,
            label: '운동',
            value: `${weekStats.workouts}/${weekStats.workoutsGoal}일`,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100',
          },
          {
            icon: Flame,
            label: '칼로리',
            value: formatCalories(weekStats.calories),
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
          },
          {
            icon: Clock,
            label: '시간',
            value: formatMinutes(weekStats.minutes),
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
          },
          {
            icon: TrendingUp,
            label: '스탯',
            value: `+${weekStats.statGain}`,
            color: 'text-violet-600',
            bgColor: 'bg-violet-100',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-xl font-bold">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommended Workout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                오늘의 추천 운동
              </CardTitle>
              <Link href="/workouts" className="text-sm text-muted-foreground hover:text-foreground">
                더보기 <ChevronRight className="inline h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="aspect-video w-full sm:w-48 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                  <Play className="h-12 w-12" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{recommendedWorkout.title}</h3>
                    <Badge variant="advanced">고급</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {recommendedWorkout.duration}분
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-4 w-4" />
                      {recommendedWorkout.calories} kcal
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500" />
                      {recommendedWorkout.rating}
                    </span>
                  </div>
                  <Link href={`/workouts/${recommendedWorkout.id}`}>
                    <Button variant="gradient">
                      <Play className="mr-2 h-4 w-4" />
                      시작하기
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                진행 중인 챌린지
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎖️</span>
                  <h3 className="font-semibold">{activeChallenge.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">진행률</span>
                    <span className="font-medium">
                      {activeChallenge.progress}/{activeChallenge.target}일
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                      style={{
                        width: `${(activeChallenge.progress / activeChallenge.target) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {activeChallenge.participants.toLocaleString()}명 참가
                    </span>
                    <span className="font-medium text-amber-600">
                      🥇 {activeChallenge.rank}위
                    </span>
                  </div>
                </div>
              </div>
              <Link href="/challenges">
                <Button variant="outline" className="w-full">
                  챌린지 보기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>스탯</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: '근력', value: user.stats.strength, color: '#EF4444' },
                { name: '지구력', value: user.stats.endurance, color: '#3B82F6' },
                { name: '유연성', value: user.stats.flexibility, color: '#10B981' },
                { name: '밸런스', value: user.stats.balance, color: '#F59E0B' },
                { name: '마음챙김', value: user.stats.mindfulness, color: '#8B5CF6' },
              ].map((stat) => (
                <StatProgress
                  key={stat.name}
                  name={stat.name}
                  value={stat.value}
                  color={stat.color}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>최근 업적</CardTitle>
              <Link href="/achievements" className="text-sm text-muted-foreground hover:text-foreground">
                전체보기
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xl shadow-sm">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{achievement.name}</div>
                    <div className="text-sm text-violet-600">+{achievement.xp} XP</div>
                  </div>
                </div>
              ))}
              <Link href="/achievements">
                <Button variant="outline" className="w-full mt-2">
                  모든 업적 보기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Workouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                예정된 운동
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingWorkouts.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="text-sm text-muted-foreground">{item.day}</div>
                    <div className="font-medium">{item.workout}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{item.time}</div>
                </div>
              ))}
              <Link href="/coach">
                <Button variant="outline" className="w-full mt-2">
                  운동 계획 관리
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
