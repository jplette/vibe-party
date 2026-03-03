import { UserManagerSettings } from 'oidc-client-ts';

export const oidcConfig: UserManagerSettings = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: `${window.location.origin}/auth/callback`,
  silent_redirect_uri: `${window.location.origin}/auth/silent-renew`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  // PKCE is the default for 'code' flow in oidc-client-ts — no client_secret needed
  automaticSilentRenew: true,
  // Store tokens in memory (not sessionStorage/localStorage) for XSS protection
  userStore: undefined, // will be overridden in AuthProvider to use memory store
  loadUserInfo: true,
  monitorSession: false,
};
