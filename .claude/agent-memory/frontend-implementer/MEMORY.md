# Frontend Implementer Memory

## Project: vibe-party

### Tech Stack (confirmed)
- Vite 6 + React 19 + TypeScript
- Radix UI Themes 3 (`@radix-ui/themes`) — `frontend/` (port 5173)
- React Router v7 (flat route definitions — no nested Outlet pattern needed)
- TanStack Query v5 (all data fetching)
- Zustand v5 (UI/auth state)
- oidc-client-ts v3 (PKCE auth, tokens in memory only)
- ky v1 (HTTP client)
- React Hook Form + Zod (forms)
- No CSS Modules — layout via Radix primitives; inline `style` only for brand colors outside Radix's palette

### Design Tokens (frontend/src/styles/theme.css)
- Primary: `#ff6b35` (Atomic Tangerine)
- Primary Light: `#f7c59f` (Peach Glow)
- Primary Lightest: `#fff3ed` (very soft tint, for icon bg / hover bg)
- Surface: `#ffffff` — white-first; beige is an accent ONLY
- Surface Subtle: `#fafafa`
- Background (page): `#f8f9fa` (Bright Snow)
- Nav: `#004e89` (Steel Azure)
- Accent: `#1a659e` (Baltic Blue)
- Text: `#212529`, Text Muted: `#6c757d`, Text Subtle: `#adb5bd`
- Border: `#e9ecef`, Border Subtle: `#f0f0f0`

### Design Principles (confirmed after design refresh)
- White-first surfaces: sidebar is white, cards are white, NOT beige
- Beige used only as subtle radial gradient blob accent in banners
- Brand colors (tangerine, steel azure) used ONLY as accents (buttons, active state, icon color, hover border)
- Active nav link: `--color-primary-lightest` background + tangerine text (not filled nav bg)
- Empty states: circle icon div wrapper (`border-radius: full`, `background: --color-primary-lightest`)
- Shadows: very soft layered — `--shadow-xs` at rest, `--shadow-md` on hover, `--shadow-primary` on CTA buttons
- Primary button: lifts with `translateY(-1px)` + deeper shadow on hover
- Logo pattern: `Vibe<span className={styles.logoAccent}>Party</span>` — second word in tangerine

### Font
- Lato (local woff2 files in `public/fonts/lato/`)
- Files must be manually downloaded from https://fonts.google.com/specimen/Lato
- Fallback: system-ui stack

### Key Architecture Decisions
- Auth tokens stored in Zustand (memory only, no localStorage)
- `WebStorageStateStore` with `InMemoryWebStorage` for oidc-client-ts
- frontend/ App.tsx: protected routes use a shared `ProtectedLayout` component (AuthGuard + AppLayout + Outlet) as the parent route element, with children nested under it — NOT wrapping each route individually
- Lazy routes with `lazy()` + `Suspense` for all pages; each page gets its own JS chunk
- No CSS Modules in frontend/ — Radix primitives + inline style for brand colors + injected `<style>` tags for media queries
- `AuthProvider` guards against missing `VITE_OIDC_AUTHORITY` / `VITE_OIDC_CLIENT_ID` env vars
  - Shows `MissingEnvBanner` component instead of crashing (UserManager throws without authority URL)
  - Pattern: `isMissingEnvConfig` module-level const → render banner early, delegate to `AuthProviderInner`
- Requires `frontend/.env` file (copy from `.env.example`) — not committed to git

### File Locations (frontend/src/)
- Auth: `src/auth/` (AuthProvider, AuthGuard, useAuth, oidc-config)
- API: `src/api/` (client.ts ky instance, + per-resource modules)
- Hooks: `src/hooks/` (TanStack Query hooks per resource)
- Stores: `src/stores/authStore.ts`, `src/stores/themeStore.ts`
- Styles: `src/styles/fonts.css`, `global.css`, `theme.css`
- Types: `src/types/index.ts`
- Layout: `src/components/layout/AppLayout.tsx`, `PageHeader.tsx`, `LandingNav.tsx`
- UI primitives: `src/components/ui/` (LoadingSpinner, EmptyState, ErrorMessage, StatusBadge, ConfirmModal, ToastProvider)
- Pages: `src/pages/` (+ `src/pages/auth/` for CallbackPage, SilentRenewPage)

### frontend/ — App Shell Layout
- `AppLayout.tsx` injects `<style>` tag with media query for `.vp-desktop-sidebar` / `.vp-hamburger`
  - Default (mobile): sidebar hidden, hamburger visible
  - `@media (min-width: 768px)`: sidebar shown, hamburger hidden
- Mobile overlay sidebar: `position: fixed; inset: 0; zIndex: 200` backdrop + sidebar inside
- Top header: `position: sticky; top: 0; zIndex: 100` so it stays visible when content scrolls
- `Sidebar` extracted as a sub-component with `showCloseButton` prop for mobile variant
- `useAuth()` exposes `name`, `email`, `logout` — all needed by AppLayout

### frontend/ — ToastProvider
- Custom Zustand store (not sonner) — `useToastStore` in `src/components/ui/ToastProvider.tsx`
- `toast.success / error / info` helpers call `useToastStore.getState().addToast(...)` — safe outside React
- Auto-dismiss after 4000ms via `setTimeout` in `addToast`
- Mount `<ToastProvider />` inside `<Theme>` in main.tsx so it inherits Radix CSS variables

### frontend/ — main.tsx import order
- `@radix-ui/themes/styles.css` → `./styles/fonts.css` → `./styles/theme.css` → `./styles/global.css`
- `theme.css` must come before `global.css` so global resets don't accidentally clobber token overrides

### frontend/ — Public Pages (confirmed patterns)
- LandingPage: inject CSS keyframes via `<style>{ANIMATION_CSS}</style>` inside component — no CSS Modules
- Animation classes applied via `className` strings on Radix primitives
- Floating emoji: `position: absolute` inside `aria-hidden` overlay Box with `pointerEvents: 'none'`
- Wave SVG dividers: inline `<svg>` with `preserveAspectRatio="none"`, height set via style, `aria-hidden`
- Feature bento grid: `<Grid columns={{ initial: '1', sm: '2', md: '4' }}>` with `<Card>` children
- Gradient text: `background: linear-gradient(...)` + `WebkitBackgroundClip: 'text'` + `WebkitTextFillColor: 'transparent'` + `backgroundClip: 'text'` (all inline style)
- Always include `@media (prefers-reduced-motion: reduce)` block in injected animation styles
- CallbackPage/SilentRenewPage: `src/pages/auth/` — imports from `../../auth/AuthProvider`
- InvitationAcceptPage/DeclinePage: `useSearchParams` + `useEffect` + 3-state (`loading | success | error`)
- LandingNav: `position: sticky; top: 0; zIndex: 100` on outer Box, emoji in logo circle via `<span role="img" aria-hidden="true">`

### frontend/ — Radix UI Themes (confirmed working build)
- `<Theme accentColor="orange" grayColor="slate" radius="medium">` — top-level theme config
- `<Theme appearance={mode}>` driven by `useThemeStore().mode` ('light' | 'dark'), persisted to localStorage
- Styles import order: `@radix-ui/themes/styles.css` → `theme.css` → `global.css`
- Radix `Select`: use local `useState` for controlled value — no RHF `Controller` needed
- TS strict `noUnusedLocals`/`noUnusedParameters` — remove ALL unused imports before build
- Pre-existing TS bugs (now fixed): BringItemList/TodoList toggle mutation calls passed `id` string instead of required object — fixed to `{ itemId, fulfilled }` / `{ todoId, completed }`; LandingPage `Box as="footer"` replaced with native `<footer>` element
- `WebkitLineClamp` must be typed as `number` (not string) in React `CSSProperties`
- `WebkitBoxOrient` is not in React's `CSSProperties` type — cast the style object `as React.CSSProperties` to suppress TS error
- Radix `Box` does NOT support `as` prop for semantic HTML — use native element (`<footer>`, `<section>`, etc.) directly instead
- Radix `Button` v3 DOES have `loading` prop — use it directly (confirmed in ConfirmModal.tsx)
- For a Switch that controls local `useState` (not RHF field): no `Controller` needed. Remove `control` from `useForm` destructure to avoid `noUnusedLocals` error
- EventForm: `multiDay` controls endDate visibility via local `useState`; NOT part of the Zod schema; clear `endDate` before `onSubmit` when `multiDay` is false
- Event pages: `formatDuration()` returns `string | null` — filter with `.filter(Boolean)` before joining strings for display

### CRITICAL: App Shell Layout (AppLayout.module.css + global.css)

**Correct pattern (confirmed working):**
- `#root` in `global.css`: `min-height: 100vh; display: flex; flex-direction: column;` — NO `height: 100%`
- `html` and `body`: NO `height: 100%` — adding it causes a vertical scrollbar gutter (5px) to appear
  whenever content is taller than the viewport, stealing horizontal width from the layout
- `.shell`: `flex: 1; min-height: 100vh;` — `flex: 1` makes it grow to fill `#root`'s column height
- `.main`: `flex: 1; display: flex; flex-direction: column; min-width: 0;`
- `.content`: `flex: 1; padding: ...; width: 100%;` — NO `max-width` (sidebar already constrains width)

**Anti-patterns that break layout:**
- `html { height: 100% }` + `body { height: 100% }`: causes 5px scrollbar gutter on pages with tall content,
  narrowing the layout by the scrollbar width. NEVER add these.
- `max-width: 1200px; margin: 0 auto` on `.content`: causes narrow content at wide viewports (>1440px).
  In a sidebar layout the sidebar already constrains available width — no max-width needed.
- `height: 100%` on `.shell` instead of `flex: 1`: `height: 100%` requires a definite parent height
  which `min-height: 100vh` doesn't provide. `flex: 1` is the correct grow mechanism.

**Scrollbar styling caveat:**
- `::-webkit-scrollbar { width: 5px }` in global scope forces layout scrollbars even on mobile/overlay-scrollbar
  platforms, stealing 5px of horizontal width. Wrap in `@media (hover: hover) and (pointer: fine)` so it only
  applies on desktop pointer devices. Touch devices (`pointer: coarse`) get native overlay scrollbars.

### Keycloakify v11 Theme (keycloak-theme/)
- Root: `keycloak-theme/` — peer to `frontend/` and `backend/`
- Stack: Keycloakify v11 + React 18 + PrimeReact 10 + Vite 6
- `kc.gen.tsx` is auto-generated by the keycloakify vite plugin on first dev/build run — commit the stub; plugin overwrites it
- Keycloakify config goes ONLY in `vite.config.ts` — NOT in `package.json` (plugin rejects it and exits 255)
- `index.html` is required at project root for Vite to find the entry module
- Custom pages accept only `kcContext` as prop (not the `PageProps` template pattern) — fully custom UI
- Page fallback for unimplemented pages: `DefaultFallback.tsx` — shows `kcContext.pageId` for dev
- `KcContext.Login` type: `login.rememberMe` is `string | undefined` (value `"on"`) — NOT boolean
- `selectedCredential` is at `kcContext.auth?.selectedCredential` (NOT `kcContext.selectedCredential`)
- Docker: add `./keycloak-theme/dist_keycloak:/opt/keycloak/providers:ro` volume to keycloak service
- Realm: add `"loginTheme": "vibe-party"` to `keycloak/realm-export.json` top level
- Makefile targets: `sync-theme-assets`, `build-theme`, `theme-storybook`

### Test Patterns (confirmed)
- Vitest globals (`beforeAll`, `afterAll`, `beforeEach`) MUST be explicitly imported from 'vitest' — NOT globally available
- TanStack Query v5 mock casts: `UseMutationResult` and `UseQueryResult` are discriminated unions
  - Partial mock objects must use `as unknown as ReturnType<typeof hookFn>` (NOT just `as ReturnType<...>`)
  - Single `as` cast fails — TypeScript cannot reconcile partial object with union
- Test setup file: `src/test/setup.ts` — imports vitest globals + cleans up after each test
