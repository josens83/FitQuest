import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutApi, sessionApi } from '../lib/api';

export function useWorkouts(params?: {
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['workouts', params],
    queryFn: () => workoutApi.getAll(params).then((res) => res.data),
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => workoutApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useRecommendedWorkouts() {
  return useQuery({
    queryKey: ['workouts', 'recommended'],
    queryFn: () => workoutApi.getRecommended().then((res) => res.data),
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workoutId: string) =>
      sessionApi.start(workoutId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: {
        actualDuration: number;
        caloriesBurned: number;
        exercisesCompleted: number;
        rating?: number;
        feedback?: string;
      };
    }) => sessionApi.complete(sessionId, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}

export function useSessions(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => sessionApi.getAll(params).then((res) => res.data),
  });
}
