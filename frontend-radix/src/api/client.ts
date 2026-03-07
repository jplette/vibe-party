import ky, { HTTPError, type BeforeRequestHook, type AfterResponseHook } from 'ky';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const addAuthHeader: BeforeRequestHook = (request) => {
  const token = useAuthStore.getState().accessToken;
  if (token) request.headers.set('Authorization', `Bearer ${token}`);
};

const handle401: AfterResponseHook = async (request, _options, response) => {
  if (response.status !== 401) return response;
  try {
    const { useAuthContext } = await import('../auth/AuthProvider');
    const store = useAuthStore.getState();
    if (!store.oidcUser || store.oidcUser.expired) {
      store.clearAuth();
      return response;
    }
    void useAuthContext;
  } catch {
    useAuthStore.getState().clearAuth();
    return response;
  }
  const newToken = useAuthStore.getState().accessToken;
  if (!newToken) return response;
  const retryRequest = request.clone();
  retryRequest.headers.set('Authorization', `Bearer ${newToken}`);
  return fetch(retryRequest);
};

export const apiClient = ky.create({
  prefixUrl: BASE_URL,
  timeout: 30_000,
  retry: 0,
  hooks: { beforeRequest: [addAuthHeader], afterResponse: [handle401] },
  headers: { 'Content-Type': 'application/json' },
});

export async function parseApiError(error: unknown): Promise<{ message: string; status: number }> {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.json()) as { message?: string };
      return { message: body.message ?? error.message, status: error.response.status };
    } catch {
      return { message: error.message, status: error.response.status };
    }
  }
  return { message: String(error), status: 0 };
}
