
import { Message } from 'primereact/message';
import { useAuth } from './useAuth';

interface RoleGuardProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps admin-only sections.
 * If the user doesn't have the required role, shows fallback or nothing.
 */
export function RoleGuard({ role, children, fallback }: RoleGuardProps) {
  const { roles } = useAuth();

  if (!roles.includes(role)) {
    if (fallback) return <>{fallback}</>;
    return (
      <Message
        severity="warn"
        text="You don't have permission to view this section."
        className="w-full"
      />
    );
  }

  return <>{children}</>;
}
