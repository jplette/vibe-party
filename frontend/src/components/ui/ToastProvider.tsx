import { create } from 'zustand';
import { Flex, Box, Text, IconButton } from '@radix-ui/themes';
import {
  Cross1Icon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    // Auto-dismiss after 4 seconds
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
      4000,
    );
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

// ─── Convenience helpers (call outside React components) ─────────────────────

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, description }),
};

// ─── Icon map ────────────────────────────────────────────────────────────────

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircledIcon style={{ color: 'var(--green-9)' }} />,
  error: <ExclamationTriangleIcon style={{ color: 'var(--red-9)' }} />,
  info: <InfoCircledIcon style={{ color: 'var(--blue-9)' }} />,
};

// ─── ToastItem ────────────────────────────────────────────────────────────────

function ToastItem({ t, onRemove }: { t: Toast; onRemove: () => void }) {
  return (
    <Box
      style={{
        background: 'var(--color-panel-solid)',
        border: '1px solid var(--gray-4)',
        borderRadius: 'var(--radius-3)',
        padding: '12px 16px',
        minWidth: 280,
        maxWidth: 380,
        boxShadow: 'var(--shadow-4)',
      }}
    >
      <Flex align="start" gap="2">
        {iconMap[t.type]}
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="bold">
            {t.title}
          </Text>
          {t.description && (
            <Text size="1" color="gray" mt="1" as="p">
              {t.description}
            </Text>
          )}
        </Box>
        <IconButton variant="ghost" size="1" onClick={onRemove} aria-label="Dismiss">
          <Cross1Icon />
        </IconButton>
      </Flex>
    </Box>
  );
}

// ─── ToastProvider (mount once inside <Theme>) ────────────────────────────────

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();
  if (toasts.length === 0) return null;
  return (
    <Flex
      direction="column"
      gap="2"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} onRemove={() => removeToast(t.id)} />
      ))}
    </Flex>
  );
}
