import { apiClient } from './client';
import type { Invitation, InvitationFormValues, EventMember } from '../types';

export const invitationsApi = {
  listForEvent: (eventId: string): Promise<Invitation[]> =>
    apiClient.get(`events/${eventId}/invitations`).json<Invitation[]>(),
  send: (eventId: string, data: InvitationFormValues): Promise<Invitation> =>
    apiClient.post(`events/${eventId}/invitations`, { json: data }).json<Invitation>(),
  cancel: (eventId: string, invitationId: string): Promise<void> =>
    apiClient.delete(`events/${eventId}/invitations/${invitationId}`).json<void>(),
  accept: (token: string): Promise<{ status: string; eventId: string }> =>
    apiClient.post('invitations/accept', { json: { token } }).json<{ status: string; eventId: string }>(),
  decline: (token: string): Promise<{ message: string }> =>
    apiClient.post('invitations/decline', { json: { token } }).json<{ message: string }>(),
  listMembers: (eventId: string): Promise<EventMember[]> =>
    apiClient.get(`events/${eventId}/members`).json<EventMember[]>(),
  removeMember: (eventId: string, userId: string): Promise<void> =>
    apiClient.delete(`events/${eventId}/members/${userId}`).json<void>(),
  updateMemberRole: (
    eventId: string,
    userId: string,
    role: 'admin' | 'member'
  ): Promise<EventMember> =>
    apiClient.put(`events/${eventId}/members/${userId}`, { json: { role } }).json<EventMember>(),
};
