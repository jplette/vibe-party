import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthGuard } from './auth/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// ─── Lazy page imports ────────────────────────────────────────────────────────

// Public pages
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const CallbackPage = lazy(() =>
  import('./pages/auth/CallbackPage').then((m) => ({ default: m.CallbackPage })),
);
const SilentRenewPage = lazy(() =>
  import('./pages/auth/SilentRenewPage').then((m) => ({ default: m.SilentRenewPage })),
);
const InvitationAcceptPage = lazy(() =>
  import('./pages/InvitationAcceptPage').then((m) => ({ default: m.InvitationAcceptPage })),
);
const InvitationDeclinePage = lazy(() =>
  import('./pages/InvitationDeclinePage').then((m) => ({ default: m.InvitationDeclinePage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

// Protected pages
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const EventListPage = lazy(() =>
  import('./pages/EventListPage').then((m) => ({ default: m.EventListPage })),
);
const EventCreatePage = lazy(() =>
  import('./pages/EventCreatePage').then((m) => ({ default: m.EventCreatePage })),
);
const EventDetailPage = lazy(() =>
  import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })),
);
const EventEditPage = lazy(() =>
  import('./pages/EventEditPage').then((m) => ({ default: m.EventEditPage })),
);

// ─── Suspense wrapper ─────────────────────────────────────────────────────────

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}

// ─── Protected layout: AuthGuard + AppLayout + nested Outlet ─────────────────

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthGuard>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: (
      <SuspenseWrap>
        <LandingPage />
      </SuspenseWrap>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <SuspenseWrap>
        <CallbackPage />
      </SuspenseWrap>
    ),
  },
  {
    path: '/auth/silent-renew',
    element: (
      <SuspenseWrap>
        <SilentRenewPage />
      </SuspenseWrap>
    ),
  },
  {
    path: '/invitations/accept',
    element: (
      <SuspenseWrap>
        <InvitationAcceptPage />
      </SuspenseWrap>
    ),
  },
  {
    path: '/invitations/decline',
    element: (
      <SuspenseWrap>
        <InvitationDeclinePage />
      </SuspenseWrap>
    ),
  },

  // Protected routes — wrapped in AuthGuard + AppLayout via ProtectedLayout
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: '/dashboard',
        element: (
          <SuspenseWrap>
            <DashboardPage />
          </SuspenseWrap>
        ),
      },
      {
        path: '/events',
        element: (
          <SuspenseWrap>
            <EventListPage />
          </SuspenseWrap>
        ),
      },
      {
        path: '/events/new',
        element: (
          <SuspenseWrap>
            <EventCreatePage />
          </SuspenseWrap>
        ),
      },
      {
        path: '/events/:id',
        element: (
          <SuspenseWrap>
            <EventDetailPage />
          </SuspenseWrap>
        ),
      },
      {
        path: '/events/:id/edit',
        element: (
          <SuspenseWrap>
            <EventEditPage />
          </SuspenseWrap>
        ),
      },
    ],
  },

  // 404 catch-all
  {
    path: '*',
    element: (
      <SuspenseWrap>
        <NotFoundPage />
      </SuspenseWrap>
    ),
  },
]);

// ─── App root ─────────────────────────────────────────────────────────────────

export function App() {
  return <RouterProvider router={router} />;
}
