import { useEffect } from 'react';
import { useAuthContext } from '../../auth/AuthProvider';

/**
 * Loaded in a hidden iframe by oidc-client-ts to silently renew the access
 * token without a visible redirect. Renders nothing — just processes the
 * silent callback and returns.
 */
export function SilentRenewPage() {
  const { userManager } = useAuthContext();

  useEffect(() => {
    userManager.signinSilentCallback().catch(console.error);
  }, [userManager]);

  return null;
}
