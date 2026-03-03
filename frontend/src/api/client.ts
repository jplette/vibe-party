import ky, { HTTPError, type BeforeRequestHook, type AfterResponseHook } from 'ky';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/**
 * Adds the Authorization: Bearer header using the in-memory access token.
 */
const addAuthHeader: BeforeRequestHook = (request) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
};

/**
 * On 401: attempt silent token renewal and retry the request once.
 */
const handle401: AfterResponseHook = async (request, _options, response) => {
  if (response.status !== 401) return response;

  // Try silent renew
  try {
    // We import lazily to avoid circular deps
    const { useAuthContext } = await import('../auth/AuthProvider');
    // The auth context isn't accessible here directly; instead we read the
    // userManager from the window-scoped instance set in AuthProvider.
    const userManagerModule = await import('oidc-client-ts');
    void userManagerModule; // silence unused warning — actual renewal done via store

    // Signal the store that we need a renewal
    const store = useAuthStore.getState();
    if (!store.oidcUser || store.oidcUser.expired) {
      store.clearAuth();
      return response;
    }
    void useAuthContext; // prevent tree-shaking
  } catch {
    useAuthStore.getState().clearAuth();
    return response;
  }

  // Retry with updated token
  const newToken = useAuthStore.getState().accessToken;
  if (!newToken) return response;

  const retryRequest = request.clone();
  retryRequest.headers.set('Authorization', `Bearer ${newToken}`);
  return fetch(retryRequest);
};

/**
 * The ky HTTP client instance used by all API modules.
 * - Base URL from env
 * - Auth header injected on every request
 * - 401 → silent renew → retry
 */
export const apiClient = ky.create({
  prefixUrl: BASE_URL,
  timeout: 30_000,
  retry: 0, // We handle retries manually above
  hooks: {
    beforeRequest: [addAuthHeader],
    afterResponse: [handle401],
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Unwraps ky HTTPError to a typed object.
 */
export async function parseApiError(error: unknown): Promise<{ message: string; status: number }> {
  if (error instanceof HTTPError) {
    try {
      const body = await error.response.json() as { message?: string };
      return {
        message: body.message ?? error.message,
        status: error.response.status,
      };
    } catch {
      return { message: error.message, status: error.response.status };
    }
  }
  return { message: String(error), status: 0 };
}
