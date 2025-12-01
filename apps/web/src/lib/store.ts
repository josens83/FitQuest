import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, WorkoutSession, WorkoutSettings } from '@fitquest/types';

// User Store
interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  logout: () => set({ user: null, isLoading: false }),
}));

// Workout Session Store
interface WorkoutSessionState {
  currentSession: WorkoutSession | null;
  isPlaying: boolean;
  currentExerciseIndex: number;
  currentSetIndex: number;
  elapsedTime: number;
  exerciseElapsedTime: number;
  startSession: (session: WorkoutSession) => void;
  updateSession: (updates: Partial<WorkoutSession>) => void;
  endSession: () => void;
  setPlaying: (playing: boolean) => void;
  nextExercise: () => void;
  prevExercise: () => void;
  nextSet: () => void;
  setElapsedTime: (time: number) => void;
  setExerciseElapsedTime: (time: number) => void;
}

export const useWorkoutSessionStore = create<WorkoutSessionState>((set) => ({
  currentSession: null,
  isPlaying: false,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  elapsedTime: 0,
  exerciseElapsedTime: 0,
  startSession: (session) =>
    set({
      currentSession: session,
      isPlaying: true,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      elapsedTime: 0,
      exerciseElapsedTime: 0,
    }),
  updateSession: (updates) =>
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, ...updates }
        : null,
    })),
  endSession: () =>
    set({
      currentSession: null,
      isPlaying: false,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      elapsedTime: 0,
      exerciseElapsedTime: 0,
    }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  nextExercise: () =>
    set((state) => ({
      currentExerciseIndex: state.currentExerciseIndex + 1,
      currentSetIndex: 0,
      exerciseElapsedTime: 0,
    })),
  prevExercise: () =>
    set((state) => ({
      currentExerciseIndex: Math.max(0, state.currentExerciseIndex - 1),
      currentSetIndex: 0,
      exerciseElapsedTime: 0,
    })),
  nextSet: () =>
    set((state) => ({
      currentSetIndex: state.currentSetIndex + 1,
    })),
  setElapsedTime: (elapsedTime) => set({ elapsedTime }),
  setExerciseElapsedTime: (exerciseElapsedTime) => set({ exerciseElapsedTime }),
}));

// Settings Store
interface SettingsState {
  settings: WorkoutSettings;
  updateSettings: (updates: Partial<WorkoutSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: WorkoutSettings = {
  countdownDuration: 10,
  restDuration: 30,
  voiceGuidance: true,
  backgroundMusic: true,
  autoPlayNext: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'fitquest-settings',
    }
  )
);

// UI Store
interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
}));
