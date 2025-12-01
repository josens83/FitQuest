import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add logging or modify requests here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh the token
      try {
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data;

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const workoutApi = {
  getAll: (params?: any) => api.get('/workouts', { params }),
  getById: (id: string) => api.get(`/workouts/${id}`),
  getRecommended: () => api.get('/workouts/recommended'),
};

export const sessionApi = {
  start: (workoutId: string) => api.post(`/sessions/start/${workoutId}`),
  update: (id: string, data: any) => api.patch(`/sessions/${id}`, data),
  complete: (id: string, data: any) => api.post(`/sessions/${id}/complete`, data),
  abandon: (id: string) => api.post(`/sessions/${id}/abandon`),
  getAll: (params?: any) => api.get('/sessions', { params }),
  getById: (id: string) => api.get(`/sessions/${id}`),
};

export const gamificationApi = {
  getLeaderboard: (type: string, category: string, limit?: number) =>
    api.get('/gamification/leaderboard', { params: { type, category, limit } }),
  getAchievements: () => api.get('/gamification/achievements'),
};

export const challengeApi = {
  getAll: (params?: any) => api.get('/challenges', { params }),
  getById: (id: string) => api.get(`/challenges/${id}`),
  getMy: () => api.get('/challenges/my'),
  join: (id: string) => api.post(`/challenges/${id}/join`),
  leave: (id: string) => api.delete(`/challenges/${id}/leave`),
};

export const coachApi = {
  getProfile: () => api.get('/coach/profile'),
  updateProfile: (data: any) => api.patch('/coach/profile', data),
  chat: (message: string, context?: any) =>
    api.post('/coach/chat', { message, context }),
  getPlan: () => api.get('/coach/plan'),
  generatePlan: (preferences: any) =>
    api.post('/coach/plan/generate', preferences),
};

export const socialApi = {
  getFriends: () => api.get('/social/friends'),
  getPendingRequests: () => api.get('/social/friends/requests'),
  sendFriendRequest: (userId: string) =>
    api.post(`/social/friends/request/${userId}`),
  acceptRequest: (requestId: string) =>
    api.post(`/social/friends/accept/${requestId}`),
  declineRequest: (requestId: string) =>
    api.post(`/social/friends/decline/${requestId}`),
  removeFriend: (friendId: string) =>
    api.delete(`/social/friends/${friendId}`),
  getFeed: (params?: any) => api.get('/social/feed', { params }),
  searchUsers: (query: string) =>
    api.get('/social/search', { params: { q: query } }),
  likeActivity: (activityId: string) =>
    api.post(`/social/feed/${activityId}/like`),
  commentActivity: (activityId: string, content: string) =>
    api.post(`/social/feed/${activityId}/comment`, { content }),
};

export const nutritionApi = {
  logFood: (data: any) => api.post('/nutrition/food', data),
  getDailyLog: (date: string) =>
    api.get('/nutrition/daily', { params: { date } }),
  getWeeklyStats: (startDate: string) =>
    api.get('/nutrition/weekly', { params: { startDate } }),
  deleteLog: (id: string) => api.delete(`/nutrition/food/${id}`),
  logBodyMetrics: (data: any) => api.post('/nutrition/body-metrics', data),
  getBodyMetrics: (limit?: number) =>
    api.get('/nutrition/body-metrics', { params: { limit } }),
};

export const subscriptionApi = {
  getPlans: () => api.get('/subscription/plans'),
  getCurrent: () => api.get('/subscription'),
  subscribe: (plan: string, paymentMethod: string, paymentData?: any) =>
    api.post('/subscription/subscribe', { plan, paymentMethod, paymentData }),
  cancel: () => api.delete('/subscription/cancel'),
  changePlan: (plan: string) => api.patch('/subscription/change-plan', { plan }),
  getPaymentHistory: (limit?: number) =>
    api.get('/subscription/payments', { params: { limit } }),
  checkAccess: (feature: string) =>
    api.get('/subscription/check-access', { params: { feature } }),
};
