import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['contracts/src/**/*.test.ts'],
    reporters: ['default'],
    sequence: { concurrent: false },
  },
});
