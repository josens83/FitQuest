'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Clock,
  Flame,
  Heart,
  Trophy,
  Share2,
  Home,
  Star,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@fitquest/ui';
import { formatDuration, formatCalories } from '@fitquest/utils';

// Mock completion data
const completionData = {
  workout: {
    title: '전신 HIIT 20분',
    id: 'workout-hiit-1',
  },
  stats: {
    duration: 1355, // seconds
    calories: 245,
    avgHeartRate: 138,
    maxHeartRate: 168,
  },
  rewards: {
    xp: 150,
    streakBonus: true,
    newStreak: 13,
    statGains: {
      strength: 5,
      endurance: 8,
    },
  },
  achievements: [
    {
      id: '1',
      name: '10회 운동 완료',
      icon: '🏆',
      xp: 100,
      isNew: true,
    },
  ],
  personalRecords: [
    {
      name: '최고 심박수',
      value: '168 bpm',
      previous: '165 bpm',
    },
  ],
};

export default function WorkoutCompletePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4 lg:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Celebration Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-5xl shadow-lg mb-4">
            🎉
          </div>
          <h1 className="text-3xl font-bold">운동 완료!</h1>
          <p className="mt-2 text-muted-foreground">
            {completionData.workout.title}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">시간</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatDuration(completionData.stats.duration)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">칼로리</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {completionData.stats.calories}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">평균 심박</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {completionData.stats.avgHeartRate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="mb-6 border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-violet-500" />
                획득한 보상
              </h2>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2">
                  <Zap className="h-5 w-5 text-violet-600" />
                  <span className="font-bold text-violet-700">
                    +{completionData.rewards.xp} XP
                  </span>
                </div>
                {completionData.rewards.streakBonus && (
                  <div className="flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2">
                    <span className="text-lg">🔥</span>
                    <span className="font-bold text-orange-700">
                      {completionData.rewards.newStreak}일 연속!
                    </span>
                  </div>
                )}
                {Object.entries(completionData.rewards.statGains).map(([stat, gain]) => (
                  <div
                    key={stat}
                    className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2"
                  >
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-emerald-700">
                      {stat === 'strength' ? '근력' : '지구력'} +{gain}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Achievements */}
        {completionData.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  🏅 새로운 업적 달성!
                </h2>
                {completionData.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-3xl shadow-sm">
                      {achievement.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{achievement.name}</div>
                      <div className="text-sm text-violet-600">
                        +{achievement.xp} XP
                      </div>
                    </div>
                    <Badge variant="success" className="ml-auto">
                      NEW
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Personal Records */}
        {completionData.personalRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  🏆 개인 기록 갱신!
                </h2>
                {completionData.personalRecords.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-emerald-50 p-3"
                  >
                    <span className="font-medium">{record.name}</span>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">
                        {record.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        이전: {record.previous}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Rating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-center">
                이 운동이 어땠나요?
              </h2>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-3xl transition-transform hover:scale-110"
                  >
                    {star <= rating ? (
                      <Star className="h-8 w-8 text-amber-400" fill="currentColor" />
                    ) : (
                      <Star className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>

              {/* Difficulty Feedback */}
              <div className="flex justify-center gap-3">
                {[
                  { value: 'too_easy', emoji: '😴', label: '너무 쉬움' },
                  { value: 'just_right', emoji: '😊', label: '적당함' },
                  { value: 'too_hard', emoji: '😫', label: '너무 힘듦' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDifficulty(option.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 transition-all ${
                      difficulty === option.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col gap-3"
        >
          <Button
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Share2 className="mr-2 h-5 w-5" />
            공유하기
          </Button>
          <Link href="/dashboard" className="w-full">
            <Button variant="gradient" size="lg" className="w-full">
              <Home className="mr-2 h-5 w-5" />
              홈으로
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
