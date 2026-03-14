import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['index.js'],
      reporter: ['text', 'lcov', 'html'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
      all: true,
    },
  },
});
