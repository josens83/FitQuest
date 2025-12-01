'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Play,
  Clock,
  Flame,
  Star,
  Filter,
  Search,
  Crown,
  Dumbbell,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fitquest/ui';
import {
  getCategoryDisplayName,
  getDifficultyDisplayName,
  formatMinutes,
} from '@fitquest/utils';

// Mock workout data
const workouts = [
  {
    id: 'workout-strength-1',
    title: '전신 근력 운동 30분',
    subtitle: '덤벨로 완성하는 탄탄한 바디',
    category: 'strength',
    difficulty: 'intermediate',
    duration: 30,
    calories: 280,
    rating: 4.8,
    ratingCount: 1234,
    accessType: 'free',
    thumbnailUrl: '/workouts/strength-1.jpg',
    trainer: { name: '김민준' },
  },
  {
    id: 'workout-hiit-1',
    title: '전신 HIIT 20분',
    subtitle: '최대 칼로리 소모',
    category: 'hiit',
    difficulty: 'advanced',
    duration: 20,
    calories: 300,
    rating: 4.9,
    ratingCount: 2345,
    accessType: 'free',
    thumbnailUrl: '/workouts/hiit-1.jpg',
    trainer: { name: '김민준' },
  },
  {
    id: 'workout-yoga-1',
    title: '모닝 요가 20분',
    subtitle: '상쾌한 하루의 시작',
    category: 'yoga',
    difficulty: 'beginner',
    duration: 20,
    calories: 80,
    rating: 4.9,
    ratingCount: 1876,
    accessType: 'free',
    thumbnailUrl: '/workouts/yoga-1.jpg',
    trainer: { name: '이서연' },
  },
  {
    id: 'workout-dance-1',
    title: 'K-POP 댄스 워크아웃',
    subtitle: '신나는 K-POP과 함께',
    category: 'dance',
    difficulty: 'beginner',
    duration: 30,
    calories: 250,
    rating: 4.9,
    ratingCount: 3456,
    accessType: 'free',
    thumbnailUrl: '/workouts/dance-1.jpg',
    trainer: { name: '박지훈' },
  },
  {
    id: 'workout-pilates-1',
    title: '코어 필라테스 25분',
    subtitle: '탄탄한 복부 만들기',
    category: 'pilates',
    difficulty: 'intermediate',
    duration: 25,
    calories: 150,
    rating: 4.8,
    ratingCount: 987,
    accessType: 'free',
    thumbnailUrl: '/workouts/pilates-1.jpg',
    trainer: { name: '이서연' },
  },
  {
    id: 'workout-strength-2',
    title: '상체 집중 근력 운동',
    subtitle: '탄탄한 팔과 어깨 만들기',
    category: 'strength',
    difficulty: 'intermediate',
    duration: 25,
    calories: 220,
    rating: 4.7,
    ratingCount: 876,
    accessType: 'premium',
    thumbnailUrl: '/workouts/strength-2.jpg',
    trainer: { name: '김민준' },
  },
  {
    id: 'workout-yoga-2',
    title: '빈야사 플로우 요가',
    subtitle: '호흡과 함께하는 움직임',
    category: 'yoga',
    difficulty: 'intermediate',
    duration: 45,
    calories: 200,
    rating: 4.9,
    ratingCount: 1543,
    accessType: 'premium',
    thumbnailUrl: '/workouts/yoga-2.jpg',
    trainer: { name: '이서연' },
  },
  {
    id: 'workout-cardio-1',
    title: '유산소 킥복싱',
    subtitle: '펀치와 킥으로 스트레스 해소',
    category: 'cardio',
    difficulty: 'intermediate',
    duration: 30,
    calories: 320,
    rating: 4.8,
    ratingCount: 1234,
    accessType: 'premium',
    thumbnailUrl: '/workouts/cardio-1.jpg',
    trainer: { name: '김민준' },
  },
];

const categories = [
  { value: 'all', label: '전체' },
  { value: 'strength', label: '근력' },
  { value: 'cardio', label: '유산소' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: '요가' },
  { value: 'pilates', label: '필라테스' },
  { value: 'dance', label: '댄스' },
  { value: 'stretching', label: '스트레칭' },
];

const difficulties = [
  { value: 'all', label: '전체 난이도' },
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
];

export default function WorkoutsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesSearch =
      workout.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || workout.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === 'all' || workout.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl">운동</h1>
        <p className="text-muted-foreground">목표에 맞는 운동을 찾아보세요.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="운동 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="난이도" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((diff) => (
                <SelectItem key={diff.value} value={diff.value}>
                  {diff.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Workout Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredWorkouts.map((workout, index) => (
          <motion.div
            key={workout.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link href={`/workouts/${workout.id}`}>
              <Card className="group overflow-hidden transition-all hover:shadow-lg">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-emerald-400 to-teal-500">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Dumbbell className="h-12 w-12 text-white/50" />
                  </div>
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-6 w-6 text-emerald-600" fill="currentColor" />
                    </div>
                  </div>
                  {/* Premium badge */}
                  {workout.accessType === 'premium' && (
                    <div className="absolute right-2 top-2">
                      <Badge variant="premium" className="gap-1">
                        <Crown className="h-3 w-3" />
                        프리미엄
                      </Badge>
                    </div>
                  )}
                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
                    <Clock className="h-3 w-3" />
                    {workout.duration}분
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Category & Difficulty */}
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={workout.category as any}>
                      {getCategoryDisplayName(workout.category)}
                    </Badge>
                    <Badge variant={workout.difficulty as any}>
                      {getDifficultyDisplayName(workout.difficulty)}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold line-clamp-1">{workout.title}</h3>
                  {workout.subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {workout.subtitle}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {workout.calories}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500" />
                        {workout.rating}
                      </span>
                    </div>
                    <span>{workout.trainer.name}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkouts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">운동을 찾을 수 없습니다</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            다른 검색어나 필터를 시도해보세요.
          </p>
        </div>
      )}
    </div>
  );
}
