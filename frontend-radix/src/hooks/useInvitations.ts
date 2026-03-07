import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { invitationsApi } from '../api/invitations';
import type { Invitation, InvitationFormValues, EventMember } from '../types';

export const invitationKeys = {
  all: ['invitations'] as const,
  byEvent: (eventId: string) => [...invitationKeys.all, 'event', eventId] as const,
  members: (eventId: string) => ['members', 'event', eventId] as const,
};

export function useInvitations(eventId: string): UseQueryResult<Invitation[]> {
  return useQuery({
    queryKey: invitationKeys.byEvent(eventId),
    queryFn: () => invitationsApi.listForEvent(eventId),
    enabled: !!eventId,
    staleTime: 15_000,
  });
}

export function useEventMembers(eventId: string): UseQueryResult<EventMember[]> {
  return useQuery({
    queryKey: invitationKeys.members(eventId),
    queryFn: () => invitationsApi.listMembers(eventId),
    enabled: !!eventId,
    staleTime: 0,
  });
}

export function useSendInvitation(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InvitationFormValues) => invitationsApi.send(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.byEvent(eventId) });
    },
  });
}

export function useCancelInvitation(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => invitationsApi.cancel(eventId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.byEvent(eventId) });
    },
  });
}

export function useRemoveMember(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => invitationsApi.removeMember(eventId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.members(eventId) });
    },
  });
}
