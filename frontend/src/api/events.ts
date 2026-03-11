import { apiClient } from './client';
import type { Event, EventWithRole, EventFormValues } from '../types';

export const eventsApi = {
  list: (): Promise<EventWithRole[]> => apiClient.get('events').json<EventWithRole[]>(),
  get: (id: string): Promise<Event> => apiClient.get(`events/${id}`).json<Event>(),
  create: (data: EventFormValues): Promise<Event> =>
    apiClient.post('events', { json: data }).json<Event>(),
  update: (id: string, data: Partial<EventFormValues>): Promise<Event> =>
    apiClient.put(`events/${id}`, { json: data }).json<Event>(),
  delete: (id: string): Promise<void> => apiClient.delete(`events/${id}`).json<void>(),
};
