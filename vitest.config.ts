import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite resolves the `@/*` aliases from tsconfig.json natively, and oxc
  // handles the automatic JSX runtime — no @vitejs/plugin-react, whose babel
  // dependency tree conflicts with the one `shadcn` pulls in. Nothing here
  // needs fast refresh.
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws unless it is resolved under the react-server
      // export condition. Vitest has no such condition, so stub it out — the
      // guard exists to protect the bundler, not the test runner.
      'server-only': new URL('./tests/stubs/server-only.ts', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
