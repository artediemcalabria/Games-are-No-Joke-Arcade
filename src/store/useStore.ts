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

export interface GddImport {
  id: string;
  title: string;
  createdAt: string;
}

export type AppTheme = 'arcade' | 'notebook';
export type PrototypeImageSource = 'generated' | 'uploaded' | 'none';

export interface PlaygroundGameField {
  id: string;
  label: string;
  value: string;
}

export interface PlaygroundGameSection {
  title: string;
  fields: PlaygroundGameField[];
}

export interface PlaygroundGame {
  id: string;
  slug: string;
  title: string;
  summary: string;
  imageDataUrl: string;
  imageSource: PrototypeImageSource;
  sections: PlaygroundGameSection[];
  fields: Record<string, string>;
  disabledFieldIds: string[];
  sourceFileName: string;
  importedAt: string;
  exportedAt?: string;
}

interface ProgressState {
  unlockedTheories: string[];
  completedLessons: string[];
  completedGames: string[];
  gameTakeaways: Record<string, string>;
  gameNotes: Record<string, string>;
  coachHistory: CoachSession[];
  coachNotes: CoachNote[];
  readReports: string[];
  gddImports: GddImport[];
  quizScores: Record<string, number>;
  totalScore: number;
  prototype: Record<string, string>;
  prototypeImageDataUrl: string;
  prototypeImageSource: PrototypeImageSource;
  disabledPrototypeFields: string[];
  playgroundGames: PlaygroundGame[];
  audioEnabled: boolean;
  appTheme: AppTheme;
  unlockTheory: (id: string) => void;
  completeLesson: (id: string, score?: number) => void;
  completeGame: (id: string, score?: number, takeaway?: string, note?: string) => void;
  saveGameTakeaway: (id: string, takeaway: string, note?: string) => void;
  saveGameNote: (id: string, note: string) => void;
  saveCoachSession: (session: CoachSession) => void;
  saveCoachNote: (note: CoachNote) => void;
  clearCoachHistory: () => void;
  markReportRead: (id: string) => void;
  saveGddImport: (importItem: GddImport) => void;
  saveQuizScore: (quizId: string, score: number) => void;
  updatePrototypeField: (field: string, value: string) => void;
  updatePrototypeImage: (imageDataUrl: string, source?: PrototypeImageSource) => void;
  togglePrototypeFieldDisabled: (field: string) => void;
  savePlaygroundGames: (games: PlaygroundGame[]) => void;
  removePlaygroundGame: (id: string) => void;
  clearPlaygroundGames: () => void;
  setAudioEnabled: (enabled: boolean) => void;
  setAppTheme: (theme: AppTheme) => void;
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
      readReports: [],
      gddImports: [],
      quizScores: {},
      totalScore: 0,
      prototype: {},
      prototypeImageDataUrl: '',
      prototypeImageSource: 'none',
      disabledPrototypeFields: [],
      playgroundGames: [],
      audioEnabled: true,
      appTheme: 'notebook',
      
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

      markReportRead: (id) => set((state) => ({
        readReports: state.readReports.includes(id) ? state.readReports : [...state.readReports, id],
      })),

      saveGddImport: (importItem) => set((state) => ({
        gddImports: [importItem, ...state.gddImports].slice(0, 8),
      })),

      saveQuizScore: (quizId, score) => set((state) => ({
        quizScores: { ...state.quizScores, [quizId]: score },
        totalScore: state.quizScores[quizId] ? state.totalScore : state.totalScore + score
      })),

      updatePrototypeField: (field, value) => set((state) => ({
        prototype: { ...state.prototype, [field]: value }
      })),

      updatePrototypeImage: (imageDataUrl, source = imageDataUrl ? 'generated' : 'none') => set({
        prototypeImageDataUrl: imageDataUrl,
        prototypeImageSource: source,
      }),

      togglePrototypeFieldDisabled: (field) => set((state) => ({
        disabledPrototypeFields: state.disabledPrototypeFields.includes(field)
          ? state.disabledPrototypeFields.filter((item) => item !== field)
          : [...state.disabledPrototypeFields, field],
      })),

      savePlaygroundGames: (games) => set((state) => {
        const bySlug = new Map(state.playgroundGames.map((game) => [game.slug || game.id, game]));
        games.forEach((game) => bySlug.set(game.slug || game.id, game));
        return { playgroundGames: Array.from(bySlug.values()).sort((a, b) => b.importedAt.localeCompare(a.importedAt)) };
      }),

      removePlaygroundGame: (id) => set((state) => ({
        playgroundGames: state.playgroundGames.filter((game) => game.id !== id),
      })),

      clearPlaygroundGames: () => set({
        playgroundGames: [],
      }),

      setAudioEnabled: (enabled) => set({
        audioEnabled: enabled,
      }),

      setAppTheme: (theme) => set({
        appTheme: theme,
      }),

      resetProgress: () => set({
        unlockedTheories: ['intro'],
        completedLessons: [],
        completedGames: [],
        gameTakeaways: {},
        gameNotes: {},
        coachHistory: [],
        coachNotes: [],
        readReports: [],
        gddImports: [],
        quizScores: {},
        totalScore: 0,
        prototype: {},
        prototypeImageDataUrl: '',
        prototypeImageSource: 'none',
        disabledPrototypeFields: [],
        playgroundGames: []
      })
    }),
    {
      name: 'games-are-no-joke-storage',
      version: 8,
      migrate: (persistedState) => ({
        ...(persistedState as ProgressState),
        prototypeImageDataUrl: (persistedState as Partial<ProgressState>).prototypeImageDataUrl ?? '',
        prototypeImageSource: (persistedState as Partial<ProgressState>).prototypeImageSource ?? ((persistedState as Partial<ProgressState>).prototypeImageDataUrl ? 'generated' : 'none'),
        disabledPrototypeFields: (persistedState as Partial<ProgressState>).disabledPrototypeFields ?? [],
        playgroundGames: (persistedState as Partial<ProgressState>).playgroundGames ?? [],
        audioEnabled: (persistedState as Partial<ProgressState>).audioEnabled ?? true,
        appTheme: 'notebook',
        readReports: (persistedState as Partial<ProgressState>).readReports ?? [],
        gddImports: (persistedState as Partial<ProgressState>).gddImports ?? [],
      }) as ProgressState,
    }
  )
);
