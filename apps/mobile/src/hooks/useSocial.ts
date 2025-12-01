import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../lib/api';

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => socialApi.getFriends().then((res) => res.data),
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ['friends', 'requests'],
    queryFn: () => socialApi.getPendingRequests().then((res) => res.data),
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      socialApi.sendFriendRequest(userId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      socialApi.acceptRequest(requestId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useDeclineFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      socialApi.declineRequest(requestId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: string) =>
      socialApi.removeFriend(friendId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useFeed(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['feed', params],
    queryFn: () => socialApi.getFeed(params).then((res) => res.data),
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => socialApi.searchUsers(query).then((res) => res.data),
    enabled: query.length >= 2,
  });
}

export function useLikeActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) =>
      socialApi.likeActivity(activityId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useCommentActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, content }: { activityId: string; content: string }) =>
      socialApi.commentActivity(activityId, content).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
