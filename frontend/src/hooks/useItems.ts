import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { itemsApi } from '../api/items';
import type { BringItem, BringItemFormValues } from '../types';

export const itemKeys = {
  all: ['items'] as const,
  byEvent: (eventId: string) => [...itemKeys.all, 'event', eventId] as const,
};

export function useItems(eventId: string): UseQueryResult<BringItem[]> {
  return useQuery({
    queryKey: itemKeys.byEvent(eventId),
    queryFn: () => itemsApi.list(eventId),
    enabled: !!eventId,
    staleTime: 15_000,
  });
}

export function useCreateItem(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BringItemFormValues) => itemsApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.byEvent(eventId) });
    },
  });
}

export function useToggleItem(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, fulfilled }: { itemId: string; fulfilled: boolean }) =>
      fulfilled
        ? itemsApi.unfulfill(eventId, itemId)
        : itemsApi.fulfill(eventId, itemId),
    onMutate: async ({ itemId, fulfilled }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: itemKeys.byEvent(eventId) });
      const previous = queryClient.getQueryData<BringItem[]>(itemKeys.byEvent(eventId));

      queryClient.setQueryData<BringItem[]>(itemKeys.byEvent(eventId), (old) =>
        (old ?? []).map((item) =>
          item.id === itemId
            ? {
                ...item,
                fulfilledAt: fulfilled ? undefined : new Date().toISOString(),
              }
            : item
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(itemKeys.byEvent(eventId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.byEvent(eventId) });
    },
  });
}

export function useDeleteItem(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => itemsApi.delete(eventId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.byEvent(eventId) });
    },
  });
}

export function useAssignItem(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      assignedTo,
      assignedInvitationId,
    }: {
      itemId: string;
      assignedTo?: string | null;
      assignedInvitationId?: string | null;
    }) => itemsApi.assign(eventId, itemId, { assignedTo, assignedInvitationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.byEvent(eventId) });
    },
  });
}
