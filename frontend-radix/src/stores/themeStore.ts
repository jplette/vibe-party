import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
}

const stored = (localStorage.getItem('vibe-theme') as ThemeMode) ?? 'light';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: stored,
  toggleMode: () =>
    set((s) => {
      const next: ThemeMode = s.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('vibe-theme', next);
      return { mode: next };
    }),
}));
