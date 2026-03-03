import { useEffect } from 'react';
import { UserManager } from 'oidc-client-ts';
import { oidcConfig } from '../../auth/oidc-config';

/**
 * Silent token renewal page.
 * Loaded in a hidden iframe by oidc-client-ts.
 * Must be extremely lightweight — no layout, no auth guard.
 */
export function SilentRenewPage() {
  useEffect(() => {
    const userManager = new UserManager(oidcConfig);
    userManager.signinSilentCallback().catch((err) => {
      console.error('Silent renew error:', err);
    });
  }, []);

  return null;
}
