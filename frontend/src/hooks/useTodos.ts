import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { todosApi } from '../api/todos';
import type { Todo, TodoFormValues } from '../types';

export const todoKeys = {
  all: ['todos'] as const,
  byEvent: (eventId: string) => [...todoKeys.all, 'event', eventId] as const,
};

export function useTodos(eventId: string): UseQueryResult<Todo[]> {
  return useQuery({
    queryKey: todoKeys.byEvent(eventId),
    queryFn: () => todosApi.list(eventId),
    enabled: !!eventId,
    staleTime: 15_000,
  });
}

export function useCreateTodo(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TodoFormValues) => todosApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.byEvent(eventId) });
    },
  });
}

export function useToggleTodo(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId }: { todoId: string; completed: boolean }) =>
      todosApi.toggleComplete(eventId, todoId),
    onMutate: async ({ todoId, completed }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: todoKeys.byEvent(eventId) });
      const previous = queryClient.getQueryData<Todo[]>(todoKeys.byEvent(eventId));

      queryClient.setQueryData<Todo[]>(todoKeys.byEvent(eventId), (old) =>
        (old ?? []).map((t) =>
          t.id === todoId
            ? { ...t, completedAt: completed ? undefined : new Date().toISOString() }
            : t
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.byEvent(eventId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.byEvent(eventId) });
    },
  });
}

export function useDeleteTodo(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (todoId: string) => todosApi.delete(eventId, todoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.byEvent(eventId) });
    },
  });
}

export function useAssignTodo(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      todoId,
      assignedTo,
      assignedInvitationId,
    }: {
      todoId: string;
      assignedTo?: string | null;
      assignedInvitationId?: string | null;
    }) => todosApi.assign(eventId, todoId, { assignedTo, assignedInvitationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.byEvent(eventId) });
    },
  });
}

export function useSetTodoDueDate(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, dueDate }: { todoId: string; dueDate: string | null }) =>
      todosApi.setDueDate(eventId, todoId, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.byEvent(eventId) });
    },
  });
}
