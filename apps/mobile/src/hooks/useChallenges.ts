import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengeApi } from '../lib/api';

export function useChallenges(params?: {
  status?: 'upcoming' | 'active' | 'completed';
  type?: 'individual' | 'group' | 'global';
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['challenges', params],
    queryFn: () => challengeApi.getAll(params).then((res) => res.data),
  });
}

export function useChallenge(id: string) {
  return useQuery({
    queryKey: ['challenge', id],
    queryFn: () => challengeApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useMyChallenges() {
  return useQuery({
    queryKey: ['challenges', 'my'],
    queryFn: () => challengeApi.getMy().then((res) => res.data),
  });
}

export function useJoinChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: string) =>
      challengeApi.join(challengeId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useLeaveChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: string) =>
      challengeApi.leave(challengeId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}
