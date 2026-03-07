import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import type { User } from '../types';
import { useAuth } from '../auth/useAuth';

export function useCurrentUser(): UseQueryResult<User> {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.me(),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
