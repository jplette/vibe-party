import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import type { Event, EventWithRole, EventFormValues } from '../types';

// Query key factory for cache management
export const eventKeys = {
  all: ['events'] as const,
  list: () => [...eventKeys.all, 'list'] as const,
  detail: (id: string) => [...eventKeys.all, 'detail', id] as const,
};

/** Fetch all events the current user can see */
export function useEvents(): UseQueryResult<EventWithRole[]> {
  return useQuery({
    queryKey: eventKeys.list(),
    queryFn: () => eventsApi.list(),
    staleTime: 30_000,
  });
}

/** Fetch a single event by ID */
export function useEvent(id: string): UseQueryResult<Event> {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** Create a new event */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EventFormValues) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.list() });
    },
  });
}

/** Update an existing event */
export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EventFormValues>) => eventsApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(eventKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: eventKeys.list() });
    },
  });
}

/** Delete an event */
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: eventKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.list() });
    },
  });
}
