/// <reference types="vitest" />

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('../src/services/firebase', () => ({
  auth: {},
  signOut: vi.fn(),
  getPushSubscription: vi.fn(),
  signInWithCredential: vi.fn(),
  GoogleAuthProvider: { credential: vi.fn() },
}));

afterEach(() => {
  cleanup();
});

