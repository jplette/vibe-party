import { apiClient } from './client';
import type { Todo, TodoFormValues } from '../types';

export const todosApi = {
  list: (eventId: string): Promise<Todo[]> =>
    apiClient.get(`events/${eventId}/todos`).json<Todo[]>(),

  create: (eventId: string, data: TodoFormValues): Promise<Todo> =>
    apiClient.post(`events/${eventId}/todos`, { json: data }).json<Todo>(),

  update: (eventId: string, todoId: string, data: Partial<TodoFormValues>): Promise<Todo> =>
    apiClient.put(`events/${eventId}/todos/${todoId}`, { json: data }).json<Todo>(),

  complete: (eventId: string, todoId: string): Promise<Todo> =>
    apiClient.post(`events/${eventId}/todos/${todoId}/complete`).json<Todo>(),

  uncomplete: (eventId: string, todoId: string): Promise<Todo> =>
    apiClient.post(`events/${eventId}/todos/${todoId}/uncomplete`).json<Todo>(),

  delete: (eventId: string, todoId: string): Promise<void> =>
    apiClient.delete(`events/${eventId}/todos/${todoId}`).json<void>(),
};
