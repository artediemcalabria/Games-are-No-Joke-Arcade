import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CoachSession {
  id: string;
  mode: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface CoachNote {
  id: string;
  text: string;
  createdAt: string;
}

interface ProgressState {
  unlockedTheories: string[];
  completedLessons: string[];
  completedGames: string[];
  gameTakeaways: Record<string, string>;
  gameNotes: Record<string, string>;
  coachHistory: CoachSession[];
  coachNotes: CoachNote[];
  quizScores: Record<string, number>;
  totalScore: number;
  prototype: Record<string, string>;
  audioEnabled: boolean;
  unlockTheory: (id: string) => void;
  completeLesson: (id: string, score?: number) => void;
  completeGame: (id: string, score?: number, takeaway?: string, note?: string) => void;
  saveGameTakeaway: (id: string, takeaway: string, note?: string) => void;
  saveGameNote: (id: string, note: string) => void;
  saveCoachSession: (session: CoachSession) => void;
  saveCoachNote: (note: CoachNote) => void;
  clearCoachHistory: () => void;
  saveQuizScore: (quizId: string, score: number) => void;
  updatePrototypeField: (field: string, value: string) => void;
  setAudioEnabled: (enabled: boolean) => void;
  resetProgress: () => void;
}

export const useStore = create<ProgressState>()(
  persist(
    (set) => ({
      unlockedTheories: ['intro'], // Start with one unlocked
      completedLessons: [],
      completedGames: [],
      gameTakeaways: {},
      gameNotes: {},
      coachHistory: [],
      coachNotes: [],
      quizScores: {},
      totalScore: 0,
      prototype: {},
      audioEnabled: true,
      
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

      completeGame: (id, score = 0, takeaway = '', note = '') => set((state) => {
        const isNew = !state.completedGames.includes(id);
        return {
          completedGames: isNew ? [...state.completedGames, id] : state.completedGames,
          gameTakeaways: takeaway ? { ...state.gameTakeaways, [id]: takeaway } : state.gameTakeaways,
          gameNotes: note ? { ...state.gameNotes, [id]: note } : state.gameNotes,
          totalScore: isNew ? state.totalScore + score : state.totalScore
        };
      }),

      saveGameTakeaway: (id, takeaway, note = '') => set((state) => ({
        gameTakeaways: { ...state.gameTakeaways, [id]: takeaway },
        gameNotes: note ? { ...state.gameNotes, [id]: note } : state.gameNotes,
      })),

      saveGameNote: (id, note) => set((state) => ({
        gameNotes: { ...state.gameNotes, [id]: note },
      })),

      saveCoachSession: (session) => set((state) => ({
        coachHistory: [session, ...state.coachHistory].slice(0, 12),
      })),

      saveCoachNote: (note) => set((state) => ({
        coachNotes: [note, ...state.coachNotes].slice(0, 12),
      })),

      clearCoachHistory: () => set({
        coachHistory: [],
      }),

      saveQuizScore: (quizId, score) => set((state) => ({
        quizScores: { ...state.quizScores, [quizId]: score },
        totalScore: state.quizScores[quizId] ? state.totalScore : state.totalScore + score
      })),

      updatePrototypeField: (field, value) => set((state) => ({
        prototype: { ...state.prototype, [field]: value }
      })),

      setAudioEnabled: (enabled) => set({
        audioEnabled: enabled,
      }),

      resetProgress: () => set({
        unlockedTheories: ['intro'],
        completedLessons: [],
        completedGames: [],
        gameTakeaways: {},
        gameNotes: {},
        coachHistory: [],
        coachNotes: [],
        quizScores: {},
        totalScore: 0,
        prototype: {}
      })
    }),
    {
      name: 'games-are-no-joke-storage',
      version: 2,
      migrate: (persistedState) => ({
        ...(persistedState as ProgressState),
        audioEnabled: (persistedState as Partial<ProgressState>).audioEnabled ?? true,
      }) as ProgressState,
    }
  )
);
