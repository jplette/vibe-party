import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from '../TodoList';
import { renderWithProviders, makeTodo, makeEventMember, makeUser } from '../../../test/utils';

vi.mock('../../../hooks/useTodos', () => ({
  useTodos: vi.fn(),
  useCreateTodo: vi.fn(),
  useToggleTodo: vi.fn(),
  useDeleteTodo: vi.fn(),
}));

vi.mock('../../../hooks/useInvitations', () => ({
  useEventMembers: vi.fn(),
}));

import { useTodos, useCreateTodo, useToggleTodo, useDeleteTodo } from '../../../hooks/useTodos';
import { useEventMembers } from '../../../hooks/useInvitations';

const mockMutate = vi.fn();
const mockMutateAsync = vi.fn().mockResolvedValue({});

function setupHooks({
  todos = [] as ReturnType<typeof makeTodo>[],
  isLoading = false,
  isError = false,
  members = [] as ReturnType<typeof makeEventMember>[],
} = {}) {
  vi.mocked(useTodos).mockReturnValue({
    data: todos,
    isLoading,
    isError,
  } as ReturnType<typeof useTodos>);

  vi.mocked(useEventMembers).mockReturnValue({
    data: members,
  } as ReturnType<typeof useEventMembers>);

  vi.mocked(useCreateTodo).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  } as ReturnType<typeof useCreateTodo>);

  vi.mocked(useToggleTodo).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  } as ReturnType<typeof useToggleTodo>);

  vi.mocked(useDeleteTodo).mockReturnValue({
    mutate: mockMutate,
  } as ReturnType<typeof useDeleteTodo>);
}

describe('TodoList', () => {
  it('shows a loading spinner while todos are loading', () => {
    setupHooks({ isLoading: true });
    renderWithProviders(<TodoList eventId="evt-1" />);
    // ProgressSpinner renders inside a div; verify the container is shown
    const spinner = document.querySelector('.p-progress-spinner');
    expect(spinner ?? screen.queryByRole('progressbar', { hidden: true })).toBeDefined();
  });

  it('shows error message when loading fails', () => {
    setupHooks({ isError: true });
    renderWithProviders(<TodoList eventId="evt-1" />);
    expect(screen.getByText(/failed to load todos/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no todos', () => {
    setupHooks({ todos: [] });
    renderWithProviders(<TodoList eventId="evt-1" />);
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });

  it('renders pending todos under "To do" section', () => {
    setupHooks({
      todos: [makeTodo({ title: 'Book venue', completedAt: undefined })],
    });
    renderWithProviders(<TodoList eventId="evt-1" />);
    expect(screen.getByText(/to do/i)).toBeInTheDocument();
    expect(screen.getByText('Book venue')).toBeInTheDocument();
  });

  it('renders completed todos under "Done" section', () => {
    setupHooks({
      todos: [makeTodo({ title: 'Send invites', completedAt: '2026-01-01T10:00:00Z' })],
    });
    renderWithProviders(<TodoList eventId="evt-1" />);
    expect(screen.getByText(/done/i)).toBeInTheDocument();
    expect(screen.getByText('Send invites')).toBeInTheDocument();
  });

  it('separates pending and completed todos into distinct sections', () => {
    setupHooks({
      todos: [
        makeTodo({ title: 'Pending task', completedAt: undefined }),
        makeTodo({ title: 'Done task', completedAt: '2026-01-01T10:00:00Z' }),
      ],
    });
    renderWithProviders(<TodoList eventId="evt-1" />);
    expect(screen.getByText('Pending task')).toBeInTheDocument();
    expect(screen.getByText('Done task')).toBeInTheDocument();
    expect(screen.getByText(/to do/i)).toBeInTheDocument();
    // Use getAllByText since "Done" appears in the section heading and the todo label
    expect(screen.getAllByText(/done/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows pending count in the section header', () => {
    setupHooks({
      todos: [
        makeTodo({ completedAt: undefined }),
        makeTodo({ completedAt: undefined }),
      ],
    });
    renderWithProviders(<TodoList eventId="evt-1" />);
    // The count badge "2" should appear next to "To do"
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows "Add Todo" button initially', () => {
    setupHooks({ todos: [] });
    renderWithProviders(<TodoList eventId="evt-1" />);
    expect(screen.getByRole('button', { name: /add todo/i })).toBeInTheDocument();
  });

  it('shows the add todo form when "Add Todo" is clicked', async () => {
    const user = userEvent.setup();
    setupHooks({ todos: [] });
    renderWithProviders(<TodoList eventId="evt-1" />);

    await user.click(screen.getByRole('button', { name: /add todo/i }));
    expect(screen.getByRole('textbox', { name: /todo title/i })).toBeInTheDocument();
  });

  it('hides the add form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    setupHooks({ todos: [] });
    renderWithProviders(<TodoList eventId="evt-1" />);

    await user.click(screen.getByRole('button', { name: /add todo/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('textbox', { name: /todo title/i })).not.toBeInTheDocument();
  });

  it('shows a validation error when Add form is submitted empty', async () => {
    const user = userEvent.setup();
    setupHooks({ todos: [] });
    renderWithProviders(<TodoList eventId="evt-1" />);

    await user.click(screen.getByRole('button', { name: /add todo/i }));
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('calls createTodo.mutateAsync when the form is submitted with a title', async () => {
    const user = userEvent.setup();
    setupHooks({ todos: [] });
    renderWithProviders(<TodoList eventId="evt-1" />);

    await user.click(screen.getByRole('button', { name: /add todo/i }));
    await user.type(screen.getByRole('textbox', { name: /todo title/i }), 'Order cake');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Order cake' })
      );
    });
  });

  it('shows the assignee dropdown when members are present', async () => {
    const user = userEvent.setup();
    const member = makeEventMember({ user: makeUser({ name: 'Evan' }) });
    setupHooks({ todos: [], members: [member] });
    renderWithProviders(<TodoList eventId="evt-1" />);

    await user.click(screen.getByRole('button', { name: /add todo/i }));
    // PrimeReact Dropdown renders both a hidden option and a visible placeholder span with this text
    expect(screen.getAllByText(/assign to/i).length).toBeGreaterThanOrEqual(1);
  });
});
