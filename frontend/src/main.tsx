import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './styles/fonts.css';
import './styles/theme.css';
import './styles/global.css';
import { AuthProvider } from './auth/AuthProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { App } from './App';
import { useThemeStore } from './stores/themeStore';

// ─── Themed wrapper reads mode from persisted Zustand store ───────────────────

function ThemedApp() {
  const { mode } = useThemeStore();
  return (
    <Theme appearance={mode} accentColor="orange" grayColor="slate" radius="medium">
      <App />
      {/* Toast overlay — sits inside Theme so it inherits CSS variables */}
      <ToastProvider />
    </Theme>
  );
}

// ─── TanStack Query client ────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    mutations: { retry: 0 },
  },
});

// ─── Mount ────────────────────────────────────────────────────────────────────

const root = document.getElementById('root')!;

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemedApp />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
);
