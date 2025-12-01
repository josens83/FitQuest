'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Settings,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Crown,
  Share2,
  ChevronRight,
  Medal,
  Flame,
  Zap,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  XPProgress,
  StatProgress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@fitquest/ui';
import { formatCalories, formatMinutes } from '@fitquest/utils';

// Mock user data
const user = {
  id: 'user-1',
  username: 'FitWarrior_Kim',
  displayName: '김도훈',
  avatar: null,
  bio: '건강한 라이프스타일을 추구합니다 💪',
  subscription: 'premium',
  level: 15,
  currentXP: 2450,
  xpToNextLevel: 3000,
  totalXP: 15450,
  title: '피트니스 워리어',
  fitnessClass: 'warrior',
  currentStreak: 12,
  longestStreak: 15,
  stats: {
    strength: 78,
    endurance: 65,
    flexibility: 52,
    balance: 45,
    mindfulness: 28,
  },
  totalWorkouts: 156,
  totalMinutes: 3120,
  totalCalories: 28450,
  joinedAt: new Date('2024-01-01'),
};

const achievements = [
  { id: '1', icon: '🏆', name: '100회 운동', unlocked: true },
  { id: '2', icon: '🔥', name: '30일 연속', unlocked: true },
  { id: '3', icon: '💪', name: '근력 50', unlocked: true },
  { id: '4', icon: '🏃', name: '지구력 60', unlocked: true },
  { id: '5', icon: '🎯', name: '5개 카테고리', unlocked: true },
  { id: '6', icon: '🌟', name: '레벨 15', unlocked: true },
  { id: '7', icon: '⭐', name: '365회 운동', unlocked: false },
  { id: '8', icon: '👑', name: '레벨 30', unlocked: false },
];

const medals = [
  { id: '1', name: '5월 챌린지', tier: 'gold', image: '🥇' },
  { id: '2', name: '4월 챌린지', tier: 'silver', image: '🥈' },
  { id: '3', name: '3월 챌린지', tier: 'bronze', image: '🥉' },
];

const recentActivity = [
  {
    id: '1',
    type: 'workout',
    title: '전신 HIIT 20분 완료',
    xp: 100,
    date: new Date('2024-01-20'),
  },
  {
    id: '2',
    type: 'achievement',
    title: '7일 연속 달성',
    xp: 100,
    date: new Date('2024-01-19'),
  },
  {
    id: '3',
    type: 'level_up',
    title: '레벨 15 달성',
    xp: 0,
    date: new Date('2024-01-18'),
  },
];

const statColors: Record<string, string> = {
  strength: '#EF4444',
  endurance: '#3B82F6',
  flexibility: '#10B981',
  balance: '#F59E0B',
  mindfulness: '#8B5CF6',
};

const statNames: Record<string, string> = {
  strength: '근력',
  endurance: '지구력',
  flexibility: '유연성',
  balance: '밸런스',
  mindfulness: '마음챙김',
};

export default function ProfilePage() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold lg:text-3xl">프로필</h1>
        <Link href="/settings">
          <Button variant="outline" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-primary/50">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="text-2xl">
                    {user.displayName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-sm font-bold text-white ring-4 ring-white">
                  {user.level}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold">{user.displayName}</h2>
                  {user.subscription === 'premium' && (
                    <Badge variant="premium" className="gap-1">
                      <Crown className="h-3 w-3" />
                      프리미엄
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">@{user.username}</p>
                <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <span className="text-lg">🔥</span>
                    {user.currentStreak}일 연속
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-violet-500" />
                    {user.totalXP.toLocaleString()} XP
                  </span>
                </div>
                {user.bio && (
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                )}
              </div>

              {/* Share */}
              <Button variant="outline" size="icon" className="shrink-0">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Level Progress */}
            <div className="mt-6">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { icon: Zap, label: '총 운동', value: user.totalWorkouts, unit: '회' },
          {
            icon: Clock,
            label: '총 시간',
            value: Math.floor(user.totalMinutes / 60),
            unit: '시간',
          },
          {
            icon: Flame,
            label: '총 칼로리',
            value: Math.floor(user.totalCalories / 1000),
            unit: 'K',
          },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <stat.icon className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">
                  {stat.unit}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="stats">스탯</TabsTrigger>
          <TabsTrigger value="achievements">업적</TabsTrigger>
          <TabsTrigger value="medals">메달</TabsTrigger>
          <TabsTrigger value="activity">활동</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  능력치
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(user.stats).map(([key, value]) => (
                  <StatProgress
                    key={key}
                    name={statNames[key]}
                    value={value}
                    color={statColors[key]}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="achievements">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  업적
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {achievements.filter((a) => a.unlocked).length}/{achievements.length}
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-2 ${
                        achievement.unlocked
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50'
                          : 'bg-gray-100 opacity-50'
                      }`}
                    >
                      <span className="text-2xl mb-1">{achievement.icon}</span>
                      <span className="text-xs line-clamp-2">{achievement.name}</span>
                    </div>
                  ))}
                </div>
                <Link href="/achievements" className="block mt-4">
                  <Button variant="outline" className="w-full">
                    모든 업적 보기
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="medals">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-amber-500" />
                  메달 컬렉션
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medals.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {medals.map((medal) => (
                      <div
                        key={medal.id}
                        className="flex flex-col items-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4"
                      >
                        <span className="text-4xl mb-2">{medal.image}</span>
                        <span className="text-sm font-medium text-center">
                          {medal.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    아직 획득한 메달이 없습니다.
                  </div>
                )}
                <Link href="/events" className="block mt-4">
                  <Button variant="outline" className="w-full">
                    이벤트 참여하기
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="activity">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  최근 활동
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        {activity.type === 'workout' && '💪'}
                        {activity.type === 'achievement' && '🏆'}
                        {activity.type === 'level_up' && '⬆️'}
                      </div>
                      <div>
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.date.toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                    {activity.xp > 0 && (
                      <Badge variant="xp">+{activity.xp} XP</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
