import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
  unlockedTheories: string[];
  completedLessons: string[];
  completedGames: string[];
  quizScores: Record<string, number>;
  totalScore: number;
  prototype: Record<string, string>;
  unlockTheory: (id: string) => void;
  completeLesson: (id: string, score?: number) => void;
  completeGame: (id: string, score?: number) => void;
  saveQuizScore: (quizId: string, score: number) => void;
  updatePrototypeField: (field: string, value: string) => void;
  resetProgress: () => void;
}

export const useStore = create<ProgressState>()(
  persist(
    (set) => ({
      unlockedTheories: ['intro'], // Start with one unlocked
      completedLessons: [],
      completedGames: [],
      quizScores: {},
      totalScore: 0,
      prototype: {},
      
      unlockTheory: (id) => set((state) => ({
        unlockedTheories: state.unlockedTheories.includes(id) 
          ? state.unlockedTheories 
          : [...state.unlockedTheories, id]
      })),

      completeLesson: (id, score = 25) => set((state) => {
        const isNew = !state.completedLessons.includes(id);
        return {
          completedLessons: isNew ? [...state.completedLessons, id] : state.completedLessons,
          unlockedTheories: state.unlockedTheories.includes(id)
            ? state.unlockedTheories
            : [...state.unlockedTheories, id],
          totalScore: isNew ? state.totalScore + score : state.totalScore,
        };
      }),

      completeGame: (id, score = 0) => set((state) => {
        const isNew = !state.completedGames.includes(id);
        return {
          completedGames: isNew ? [...state.completedGames, id] : state.completedGames,
          totalScore: isNew ? state.totalScore + score : state.totalScore
        };
      }),

      saveQuizScore: (quizId, score) => set((state) => ({
        quizScores: { ...state.quizScores, [quizId]: score },
        totalScore: state.quizScores[quizId] ? state.totalScore : state.totalScore + score
      })),

      updatePrototypeField: (field, value) => set((state) => ({
        prototype: { ...state.prototype, [field]: value }
      })),

      resetProgress: () => set({
        unlockedTheories: ['intro'],
        completedLessons: [],
        completedGames: [],
        quizScores: {},
        totalScore: 0,
        prototype: {}
      })
    }),
    {
      name: 'games-are-no-joke-storage',
    }
  )
);
