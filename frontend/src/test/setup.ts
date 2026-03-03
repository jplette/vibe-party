import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Clean up after each test to avoid memory leaks and stale DOM state
afterEach(() => {
  cleanup();
});

// Mock CSS modules — return an empty proxy so className lookups don't throw
vi.mock('*.module.css', () => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => (typeof prop === 'string' ? prop : undefined),
    }
  );
});

// Mock primeicons — icon font won't load in jsdom
vi.mock('primeicons/primeicons.css', () => ({}));

// Silence console.error for PrimeReact act() warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (
      msg.includes('Warning: An update to') ||
      msg.includes('Warning: ReactDOM.render') ||
      msg.includes('not wrapped in act')
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
