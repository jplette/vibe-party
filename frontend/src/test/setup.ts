import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, afterAll, beforeAll, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock @radix-ui/themes CSS — won't load in jsdom
vi.mock('@radix-ui/themes/styles.css', () => ({}));

// Silence console.error for act() warnings in tests
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
