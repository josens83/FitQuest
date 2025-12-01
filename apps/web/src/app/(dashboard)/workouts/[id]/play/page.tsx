'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Pause,
  Play,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
} from 'lucide-react';
import {
  Button,
  WorkoutProgressRing,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@fitquest/ui';
import { formatDuration } from '@fitquest/utils';

// Mock workout data
const workout = {
  id: 'workout-hiit-1',
  title: '전신 HIIT 20분',
  exercises: [
    {
      id: '1',
      name: '점핑잭',
      duration: 45,
      type: 'timed',
      instructions: ['발을 모으고 팔은 옆에 둡니다', '점프하면서 다리를 벌리고 팔을 머리 위로 올립니다'],
      tips: ['착지할 때 무릎을 살짝 구부립니다'],
      videoUrl: '/exercises/jumping-jack.mp4',
    },
    {
      id: '2',
      name: '휴식',
      duration: 15,
      type: 'rest',
      instructions: ['호흡을 가다듬습니다'],
      tips: [],
      videoUrl: '/exercises/rest.mp4',
    },
    {
      id: '3',
      name: '스쿼트',
      duration: 45,
      type: 'timed',
      instructions: ['발을 어깨 너비로 벌립니다', '엉덩이를 뒤로 빼며 앉습니다'],
      tips: ['무릎이 발끝을 넘지 않도록 합니다'],
      videoUrl: '/exercises/squat.mp4',
    },
    {
      id: '4',
      name: '휴식',
      duration: 15,
      type: 'rest',
      instructions: ['호흡을 가다듬습니다'],
      tips: [],
      videoUrl: '/exercises/rest.mp4',
    },
    {
      id: '5',
      name: '푸시업',
      duration: 45,
      type: 'timed',
      instructions: ['플랭크 자세에서 시작합니다', '팔꿈치를 구부리며 가슴을 바닥으로 내립니다'],
      tips: ['몸을 일직선으로 유지합니다'],
      videoUrl: '/exercises/pushup.mp4',
    },
    {
      id: '6',
      name: '휴식',
      duration: 15,
      type: 'rest',
      instructions: ['호흡을 가다듬습니다'],
      tips: [],
      videoUrl: '/exercises/rest.mp4',
    },
    {
      id: '7',
      name: '버피',
      duration: 45,
      type: 'timed',
      instructions: ['서있는 자세에서 시작합니다', '스쿼트 후 점프하며 플랭크'],
      tips: ['동작을 연결하여 부드럽게'],
      videoUrl: '/exercises/burpee.mp4',
    },
    {
      id: '8',
      name: '휴식',
      duration: 15,
      type: 'rest',
      instructions: ['호흡을 가다듬습니다'],
      tips: [],
      videoUrl: '/exercises/rest.mp4',
    },
    {
      id: '9',
      name: '마운틴 클라이머',
      duration: 45,
      type: 'timed',
      instructions: ['플랭크 자세에서 시작', '무릎을 가슴 쪽으로 번갈아 당깁니다'],
      tips: ['엉덩이를 낮게 유지'],
      videoUrl: '/exercises/mountain-climber.mp4',
    },
    {
      id: '10',
      name: '쿨다운 스트레칭',
      duration: 60,
      type: 'timed',
      instructions: ['천천히 호흡하며 근육 이완'],
      tips: ['통증이 느껴지면 멈춥니다'],
      videoUrl: '/exercises/cooldown.mp4',
    },
  ],
};

export default function WorkoutPlayPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCountdown, setIsCountdown] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const currentExercise = workout.exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === workout.exercises.length - 1;
  const totalExercises = workout.exercises.length;
  const progress = ((currentExerciseIndex + 1) / totalExercises) * 100;

  // Initialize exercise timer
  useEffect(() => {
    if (!isCountdown) {
      setTimeRemaining(currentExercise.duration);
    }
  }, [currentExerciseIndex, isCountdown, currentExercise.duration]);

  // Countdown timer
  useEffect(() => {
    if (!isCountdown) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsCountdown(false);
          setIsPlaying(true);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountdown]);

  // Exercise timer
  useEffect(() => {
    if (!isPlaying || isCountdown) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next exercise
          if (!isLastExercise) {
            setCurrentExerciseIndex((i) => i + 1);
            return workout.exercises[currentExerciseIndex + 1].duration;
          } else {
            // Workout complete
            setIsPlaying(false);
            router.push(`/workouts/${params.id}/complete`);
            return 0;
          }
        }
        return prev - 1;
      });
      setTotalElapsed((prev) => prev + 1);

      // Simulate calorie burn (roughly 10 cal/min for HIIT)
      if (currentExercise.type !== 'rest') {
        setTotalCalories((prev) => prev + 0.17);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isCountdown, currentExerciseIndex, isLastExercise, params.id, router, currentExercise.type]);

  // Simulate heart rate
  useEffect(() => {
    if (!isPlaying) return;

    const updateHeartRate = () => {
      const baseRate = currentExercise.type === 'rest' ? 90 : 140;
      const variation = Math.floor(Math.random() * 20) - 10;
      setHeartRate(baseRate + variation);
    };

    updateHeartRate();
    const interval = setInterval(updateHeartRate, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, currentExercise.type]);

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((i) => i - 1);
      setIsPlaying(true);
    }
  };

  const handleNextExercise = () => {
    if (!isLastExercise) {
      setCurrentExerciseIndex((i) => i + 1);
      setIsPlaying(true);
    }
  };

  const handleExit = () => {
    setShowExitDialog(true);
    setIsPlaying(false);
  };

  const confirmExit = () => {
    router.push(`/workouts/${params.id}`);
  };

  // Countdown screen
  if (isCountdown) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-2xl font-medium mb-4">준비하세요</div>
          <div className="text-9xl font-bold mb-8">{countdown}</div>
          <div className="text-xl">다음: {currentExercise.name}</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 safe-top">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={handleExit}
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <div className="text-sm text-white/60">
            {currentExerciseIndex + 1} / {totalExercises}
          </div>
          <div className="text-sm font-medium">{workout.title}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Video Area (placeholder) */}
        <div className="relative w-full max-w-2xl aspect-video rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 mb-8 flex items-center justify-center">
          <div className="text-6xl">
            {currentExercise.type === 'rest' ? '🧘' : '💪'}
          </div>
        </div>

        {/* Exercise Info */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{currentExercise.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setShowInfoDialog(true)}
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>
          {currentExercise.type === 'rest' && (
            <div className="text-emerald-400">휴식 시간</div>
          )}
        </div>

        {/* Timer */}
        <WorkoutProgressRing
          progress={(1 - timeRemaining / currentExercise.duration) * 100}
          size={200}
          strokeWidth={12}
          className="mb-8"
        >
          <div className="text-5xl font-bold tabular-nums">
            {formatDuration(timeRemaining)}
          </div>
        </WorkoutProgressRing>

        {/* Tips */}
        {currentExercise.tips.length > 0 && (
          <div className="max-w-md rounded-xl bg-white/10 px-4 py-3 text-center text-sm text-white/80 mb-8">
            💡 {currentExercise.tips[0]}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-8 text-sm">
          <div className="text-center">
            <div className="text-white/60">심박수</div>
            <div className="flex items-center gap-1 text-lg font-bold">
              <Heart className="h-4 w-4 text-red-500" />
              {heartRate || '--'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-white/60">칼로리</div>
            <div className="text-lg font-bold">{Math.round(totalCalories)} kcal</div>
          </div>
          <div className="text-center">
            <div className="text-white/60">시간</div>
            <div className="text-lg font-bold">{formatDuration(totalElapsed)}</div>
          </div>
        </div>
      </main>

      {/* Controls */}
      <footer className="p-4 safe-bottom">
        {/* Progress bar */}
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handlePrevExercise}
              disabled={currentExerciseIndex === 0}
            >
              <SkipBack className="h-6 w-6" />
            </Button>
            <div className="text-sm text-white/60">
              {currentExerciseIndex > 0 && workout.exercises[currentExerciseIndex - 1].name}
            </div>
          </div>

          <Button
            size="xl"
            className="h-16 w-16 rounded-full bg-white text-gray-900 hover:bg-white/90"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" fill="currentColor" />
            ) : (
              <Play className="h-8 w-8" fill="currentColor" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <div className="text-right text-sm text-white/60">
              {!isLastExercise && workout.exercises[currentExerciseIndex + 1].name}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handleNextExercise}
              disabled={isLastExercise}
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </footer>

      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>운동을 종료하시겠습니까?</DialogTitle>
            <DialogDescription>
              현재 진행 상황이 저장되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              계속하기
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              종료하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentExercise.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">수행 방법</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {currentExercise.instructions.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ul>
            </div>
            {currentExercise.tips.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">팁</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {currentExercise.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
