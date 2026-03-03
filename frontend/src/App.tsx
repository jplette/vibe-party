import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { AuthProvider } from './auth/AuthProvider';
import { AuthGuard } from './auth/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';

// ─── Lazy-loaded pages ──────────────────────────────────────────────────────
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const EventListPage = lazy(() =>
  import('./pages/EventListPage').then((m) => ({ default: m.EventListPage }))
);
const EventCreatePage = lazy(() =>
  import('./pages/EventCreatePage').then((m) => ({ default: m.EventCreatePage }))
);
const EventDetailPage = lazy(() =>
  import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage }))
);
const EventEditPage = lazy(() =>
  import('./pages/EventEditPage').then((m) => ({ default: m.EventEditPage }))
);
const EventSettingsPage = lazy(() =>
  import('./pages/EventSettingsPage').then((m) => ({ default: m.EventSettingsPage }))
);
const CallbackPage = lazy(() =>
  import('./pages/auth/CallbackPage').then((m) => ({ default: m.CallbackPage }))
);
const SilentRenewPage = lazy(() =>
  import('./pages/auth/SilentRenewPage').then((m) => ({ default: m.SilentRenewPage }))
);
const InvitationAcceptPage = lazy(() =>
  import('./pages/InvitationAcceptPage').then((m) => ({ default: m.InvitationAcceptPage }))
);
const InvitationDeclinePage = lazy(() =>
  import('./pages/InvitationDeclinePage').then((m) => ({ default: m.InvitationDeclinePage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

// ─── Protected page wrapper ──────────────────────────────────────────────────
function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}

// ─── Loading fallback ────────────────────────────────────────────────────────
function PageFallback() {
  return (
    <div className="page-loading">
      <ProgressSpinner style={{ width: '48px', height: '48px' }} strokeWidth="4" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* ─── Public: auth callback & silent renew ─────────────── */}
            <Route path="/auth/callback" element={<CallbackPage />} />
            <Route path="/auth/silent-renew" element={<SilentRenewPage />} />

            {/* ─── Public: invitation accept / decline ──────────────── */}
            <Route path="/invitations/accept" element={<InvitationAcceptPage />} />
            <Route path="/invitations/decline" element={<InvitationDeclinePage />} />

            {/* ─── Protected routes (require auth + app layout) ─────── */}
            <Route
              path="/"
              element={
                <ProtectedPage>
                  <DashboardPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedPage>
                  <EventListPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/events/new"
              element={
                <ProtectedPage>
                  <EventCreatePage />
                </ProtectedPage>
              }
            />
            <Route
              path="/events/:id"
              element={
                <ProtectedPage>
                  <EventDetailPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/events/:id/edit"
              element={
                <ProtectedPage>
                  <EventEditPage />
                </ProtectedPage>
              }
            />
            <Route
              path="/events/:id/settings"
              element={
                <ProtectedPage>
                  <EventSettingsPage />
                </ProtectedPage>
              }
            />

            {/* ─── 404 ──────────────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
