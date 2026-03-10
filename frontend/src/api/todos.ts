import { apiClient } from './client';
import type { Todo, TodoFormValues } from '../types';

export const todosApi = {
  list: (eventId: string): Promise<Todo[]> =>
    apiClient.get(`events/${eventId}/todos`).json<Todo[]>(),
  create: (eventId: string, data: TodoFormValues): Promise<Todo> =>
    apiClient.post(`events/${eventId}/todos`, { json: data }).json<Todo>(),
  update: (eventId: string, todoId: string, data: Partial<TodoFormValues>): Promise<Todo> =>
    apiClient.put(`events/${eventId}/todos/${todoId}`, { json: data }).json<Todo>(),
  toggleComplete: (eventId: string, todoId: string): Promise<Todo> =>
    apiClient.patch(`events/${eventId}/todos/${todoId}/complete`).json<Todo>(),
  delete: (eventId: string, todoId: string): Promise<void> =>
    apiClient.delete(`events/${eventId}/todos/${todoId}`).json<void>(),
  assign: (
    eventId: string,
    todoId: string,
    body: { assignedTo?: string | null; assignedInvitationId?: string | null }
  ): Promise<Todo> =>
    apiClient.patch(`events/${eventId}/todos/${todoId}/assign`, { json: body }).json<Todo>(),
  setDueDate: (eventId: string, todoId: string, dueDate: string | null): Promise<Todo> =>
    apiClient
      .patch(`events/${eventId}/todos/${todoId}/due-date`, { json: { dueDate } })
      .json<Todo>(),
};
