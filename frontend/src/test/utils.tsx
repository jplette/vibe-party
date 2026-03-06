/**
 * Shared test utilities for vibe-party frontend.
 *
 * Provides:
 *  - renderWithProviders: wraps components in QueryClient + MemoryRouter + AuthProvider mock
 *  - mockAuthStore: preset auth store state helper
 *  - factory helpers: makeEvent, makeTodo, makeBringItem, makeEventMember
 */
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { vi } from 'vitest';
import type { Event, Todo, BringItem, EventMember, User } from '../types';

// ─── Auth mock ────────────────────────────────────────────────────────────────

export interface MockAuthValues {
  isAuthenticated?: boolean;
  isLoading?: boolean;
  name?: string | null;
  email?: string | null;
  userId?: string | null;
  roles?: string[];
  login?: () => Promise<void>;
  logout?: () => Promise<void>;
  silentRenew?: () => Promise<void>;
  register?: () => Promise<void>;
  accessToken?: string | null;
}

export function mockUseAuth(overrides: MockAuthValues = {}) {
  const defaults: Required<MockAuthValues> = {
    isAuthenticated: true,
    isLoading: false,
    name: 'Alice Smith',
    email: 'alice@example.com',
    userId: 'user-alice',
    roles: ['user'],
    login: vi.fn(),
    logout: vi.fn(),
    silentRenew: vi.fn(),
    register: vi.fn(),
    accessToken: 'mock-access-token',
  };
  return { ...defaults, ...overrides };
}

// ─── Provider wrapper ─────────────────────────────────────────────────────────

interface WrapperOptions {
  routerProps?: MemoryRouterProps;
  queryClient?: QueryClient;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper({ routerProps, queryClient }: WrapperOptions = {}) {
  const client = queryClient ?? makeQueryClient();

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter {...routerProps}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions & WrapperOptions = {}
) {
  const { routerProps, queryClient, ...renderOptions } = options;
  const wrapper = createWrapper({ routerProps, queryClient });
  return render(ui, { wrapper, ...renderOptions });
}

// ─── Data factories ───────────────────────────────────────────────────────────

let _idCounter = 1;
function nextId(prefix = 'id') {
  return `${prefix}-${_idCounter++}`;
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId('user'),
    keycloakId: nextId('kc'),
    email: 'user@example.com',
    name: 'Test User',
    globalRole: 'user',
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: nextId('evt'),
    name: 'Test Event',
    description: 'A test event description',
    date: '2027-06-15T18:00:00Z',
    locationName: 'Test Venue',
    createdBy: 'user-alice',
    createdAt: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

export function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: nextId('todo'),
    eventId: 'evt-1',
    title: 'Buy supplies',
    description: undefined,
    assignedTo: undefined,
    completedAt: undefined,
    createdAt: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

export function makeBringItem(overrides: Partial<BringItem> = {}): BringItem {
  return {
    id: nextId('item'),
    eventId: 'evt-1',
    name: 'Drinks',
    quantity: '6 bottles',
    assignedTo: undefined,
    fulfilledAt: undefined,
    ...overrides,
  };
}

export function makeEventMember(overrides: Partial<EventMember> = {}): EventMember {
  const user = makeUser();
  return {
    userId: user.id,
    eventId: 'evt-1',
    role: 'member',
    user,
    ...overrides,
  };
}
