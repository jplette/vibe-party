# frontend-radix CLAUDE.md

## Stack
- React 19, React Router v7, Radix UI Themes v3, Radix Icons
- Zustand v5, TanStack Query v5, ky, oidc-client-ts v3
- React Hook Form v7 + Zod, TypeScript 5, Vite 6

## Design Rules
- **Component library**: `@radix-ui/themes` only — `Box`, `Flex`, `Grid`, `Container`, `Section`, `Card`, `Button`, `TextField`, `Text`, `Heading`, `Badge`, `Tabs`, `Dialog`, `Select`, `Checkbox`, `Switch`, `Avatar`, `Spinner`, `Callout`, `Separator`, `IconButton`, `DropdownMenu`, `Table`
- **Icons**: `@radix-ui/react-icons` only
- **No CSS Modules** — all layout via Radix primitives; inline `style` only for brand colors outside Radix's palette
- **Dark mode**: Zustand `themeStore` with `localStorage` persistence; `<Theme appearance={mode}>` at root

## Colors (brand)
- Atomic Tangerine: `#ff6b35` (primary accent, overrides `--accent-9`)
- Steel Azure: `#004e89` (sidebar background — inline style only)
- Beige: `#efefd0` (hero/surface sections — inline style only)
- Peach Glow: `#f7c59f` (decorative)

## Theme Root
```tsx
<Theme appearance={mode} accentColor="orange" grayColor="slate" radius="medium">
```

## Fonts
- Lato (local, woff2) — loaded via `src/styles/fonts.css`
- Reference: `/public/fonts/lato/` (reuse from `../frontend/public/fonts/`)
- **Never** use Google Fonts CDN

## Port
Dev server runs on **5174** (not 5173 which is the PrimeReact frontend)

## File structure
```
src/
  auth/          oidc-config, AuthProvider, AuthGuard, useAuth
  api/           client, events, invitations, items, todos, users
  stores/        authStore, themeStore
  hooks/         useCurrentUser, useEvents, useInvitations, useItems, useTodos
  components/
    layout/      AppLayout, LandingNav, PageHeader
    ui/          LoadingSpinner, EmptyState, ErrorMessage, StatusBadge, ConfirmModal, ToastProvider
    events/      EventCard, EventForm
    todos/       TodoItem, TodoList
    items/       BringItemForm, BringItemList
    invitations/ InviteForm
  pages/
    auth/        CallbackPage, SilentRenewPage
    ...
  styles/        fonts.css, global.css, theme.css
  types/         index.ts
  utils/         formatDate.ts
  test/          setup.ts, utils.tsx
```
