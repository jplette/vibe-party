import { apiClient } from './client';
import type { BringItem, BringItemFormValues } from '../types';

export const itemsApi = {
  list: (eventId: string): Promise<BringItem[]> =>
    apiClient.get(`events/${eventId}/items`).json<BringItem[]>(),
  create: (eventId: string, data: BringItemFormValues): Promise<BringItem> =>
    apiClient.post(`events/${eventId}/items`, { json: data }).json<BringItem>(),
  update: (eventId: string, itemId: string, data: Partial<BringItemFormValues>): Promise<BringItem> =>
    apiClient.put(`events/${eventId}/items/${itemId}`, { json: data }).json<BringItem>(),
  fulfill: (eventId: string, itemId: string): Promise<BringItem> =>
    apiClient.post(`events/${eventId}/items/${itemId}/fulfill`).json<BringItem>(),
  unfulfill: (eventId: string, itemId: string): Promise<BringItem> =>
    apiClient.post(`events/${eventId}/items/${itemId}/unfulfill`).json<BringItem>(),
  delete: (eventId: string, itemId: string): Promise<void> =>
    apiClient.delete(`events/${eventId}/items/${itemId}`).json<void>(),
  assign: (
    eventId: string,
    itemId: string,
    body: { assignedTo?: string | null; assignedInvitationId?: string | null }
  ): Promise<BringItem> =>
    apiClient.patch(`events/${eventId}/items/${itemId}/assign`, { json: body }).json<BringItem>(),
};
