'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Play,
  Clock,
  Flame,
  Star,
  ChevronLeft,
  Share2,
  Heart,
  Download,
  Users,
  Dumbbell,
  Info,
  Crown,
  Zap,
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@fitquest/ui';
import {
  getCategoryDisplayName,
  getDifficultyDisplayName,
  getBodyPartDisplayName,
  getEquipmentDisplayName,
} from '@fitquest/utils';

// Mock workout detail data
const workout = {
  id: 'workout-hiit-1',
  title: '전신 HIIT 20분',
  subtitle: '최대 칼로리 소모',
  description:
    '20분 동안 전신을 불태우는 고강도 인터벌 트레이닝입니다. 짧은 시간에 최대 효과를 원한다면 이 운동! 운동 경험이 있는 분들께 추천드립니다.',
  category: 'hiit',
  bodyParts: ['full_body'],
  equipment: ['none'],
  difficulty: 'advanced',
  duration: 20,
  calories: 300,
  rating: 4.9,
  ratingCount: 2345,
  completionCount: 15678,
  accessType: 'free',
  xpReward: 100,
  thumbnailUrl: '/workouts/hiit-1.jpg',
  previewVideoUrl: '/workouts/hiit-1-preview.mp4',
  trainer: {
    id: 'trainer-1',
    name: '김민준',
    title: '피트니스 마스터 트레이너',
    avatarUrl: '/trainers/trainer-1.jpg',
    followerCount: 12500,
  },
  exercises: [
    { id: '1', name: '점핑잭', duration: 45, type: 'timed' },
    { id: '2', name: '휴식', duration: 15, type: 'rest' },
    { id: '3', name: '스쿼트', duration: 45, type: 'timed' },
    { id: '4', name: '휴식', duration: 15, type: 'rest' },
    { id: '5', name: '푸시업', duration: 45, type: 'timed' },
    { id: '6', name: '휴식', duration: 15, type: 'rest' },
    { id: '7', name: '버피', duration: 45, type: 'timed' },
    { id: '8', name: '휴식', duration: 15, type: 'rest' },
    { id: '9', name: '마운틴 클라이머', duration: 45, type: 'timed' },
    { id: '10', name: '휴식', duration: 15, type: 'rest' },
    { id: '11', name: '플랭크', duration: 45, type: 'timed' },
    { id: '12', name: '쿨다운 스트레칭', duration: 120, type: 'timed' },
  ],
  reviews: [
    {
      id: '1',
      user: { name: '피트니스러버', avatar: null },
      rating: 5,
      comment: '정말 효과적인 운동이에요! 20분이 금방 지나가요.',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      user: { name: '홈트초보', avatar: null },
      rating: 4,
      comment: '강도가 높아서 힘들었지만 땀이 확실히 나네요.',
      createdAt: new Date('2024-01-10'),
    },
  ],
};

const relatedWorkouts = [
  {
    id: 'workout-hiit-2',
    title: '초보자 HIIT 15분',
    category: 'hiit',
    difficulty: 'beginner',
    duration: 15,
    calories: 180,
  },
  {
    id: 'workout-strength-1',
    title: '전신 근력 운동 30분',
    category: 'strength',
    difficulty: 'intermediate',
    duration: 30,
    calories: 280,
  },
];

export default function WorkoutDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}초`;
    if (secs === 0) return `${mins}분`;
    return `${mins}분 ${secs}초`;
  };

  const totalExercises = workout.exercises.filter((e) => e.type !== 'rest').length;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent">
        <div className="flex h-14 items-center justify-between px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart
                className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <div className="mx-auto max-w-5xl">
          {/* Back button - Desktop */}
          <div className="mb-6 hidden lg:block">
            <Button variant="ghost" onClick={() => router.back()}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              뒤로
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Preview */}
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Dumbbell className="h-20 w-20 text-white/30" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="xl"
                    className="gap-2 rounded-full bg-white text-emerald-600 hover:bg-white/90"
                    onClick={() => router.push(`/workouts/${params.id}/play`)}
                  >
                    <Play className="h-6 w-6" fill="currentColor" />
                    미리보기
                  </Button>
                </div>
                {workout.accessType === 'premium' && (
                  <div className="absolute left-4 top-4">
                    <Badge variant="premium" className="gap-1">
                      <Crown className="h-3 w-3" />
                      프리미엄
                    </Badge>
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant={workout.category as any}>
                    {getCategoryDisplayName(workout.category)}
                  </Badge>
                  <Badge variant={workout.difficulty as any}>
                    {getDifficultyDisplayName(workout.difficulty)}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold lg:text-3xl">{workout.title}</h1>
                {workout.subtitle && (
                  <p className="mt-1 text-lg text-muted-foreground">
                    {workout.subtitle}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{workout.duration}분</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span>{workout.calories} kcal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span>
                    {workout.rating} ({workout.ratingCount.toLocaleString()})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>{workout.completionCount.toLocaleString()}회 완료</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-violet-500" />
                  <span>+{workout.xpReward} XP</span>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">개요</TabsTrigger>
                  <TabsTrigger value="exercises">
                    운동 목록 ({totalExercises})
                  </TabsTrigger>
                  <TabsTrigger value="reviews">
                    리뷰 ({workout.reviews.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle>설명</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{workout.description}</p>
                    </CardContent>
                  </Card>

                  {/* Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>운동 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">
                          운동 부위
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {workout.bodyParts.map((part) => (
                            <Badge key={part} variant="outline">
                              {getBodyPartDisplayName(part)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">
                          필요 장비
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {workout.equipment.map((eq) => (
                            <Badge key={eq} variant="outline">
                              {getEquipmentDisplayName(eq)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="exercises">
                  <Card>
                    <CardContent className="divide-y p-0">
                      {workout.exercises.map((exercise, index) => (
                        <div
                          key={exercise.id}
                          className={`flex items-center gap-4 p-4 ${
                            exercise.type === 'rest' ? 'bg-muted/50' : ''
                          }`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{exercise.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDuration(exercise.duration)}
                            </div>
                          </div>
                          {exercise.type === 'rest' && (
                            <Badge variant="secondary">휴식</Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  {workout.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={review.user.avatar || undefined} />
                            <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{review.user.name}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                                <span>{review.rating}</span>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Start Button */}
              <Card className="sticky top-20">
                <CardContent className="p-6 space-y-4">
                  <Button
                    variant="gradient"
                    size="xl"
                    className="w-full"
                    onClick={() => router.push(`/workouts/${params.id}/play`)}
                  >
                    <Play className="mr-2 h-5 w-5" fill="currentColor" />
                    운동 시작
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      다운로드
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Share2 className="mr-2 h-4 w-4" />
                      공유
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trainer */}
              <Card>
                <CardHeader>
                  <CardTitle>트레이너</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={workout.trainer.avatarUrl} />
                      <AvatarFallback>{workout.trainer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{workout.trainer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {workout.trainer.title}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        팔로워 {workout.trainer.followerCount.toLocaleString()}명
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    프로필 보기
                  </Button>
                </CardContent>
              </Card>

              {/* Related Workouts */}
              <Card>
                <CardHeader>
                  <CardTitle>관련 운동</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedWorkouts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/workouts/${related.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
                        <Dumbbell className="h-6 w-6 text-white/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{related.title}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{related.duration}분</span>
                          <span>•</span>
                          <span>{related.calories} kcal</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
