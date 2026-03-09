import { apiClient } from './client';
import type { User } from '../types';

export const usersApi = {
  me: (): Promise<User> => apiClient.get('users/me').json<User>(),
  get: (id: string): Promise<User> => apiClient.get(`users/${id}`).json<User>(),
  list: (): Promise<User[]> => apiClient.get('users').json<User[]>(),
};
