import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  publicDir: path.resolve(__dirname, 'frontend', 'public'),
  plugins: [
    react(),
    // Midnight's crypto/ledger packages ship WebAssembly modules using the
    // ESM integration proposal syntax, which Vite doesn't support out of the
    // box — these two plugins add that support (wasm() handles the .wasm
    // imports, topLevelAwait() handles the `await` those modules use at
    // module scope).
    wasm(),
    topLevelAwait(),
    // Same packages also assume a Node.js runtime environment (Buffer,
    // process, global) that a browser doesn't provide — this polyfills them.
    nodePolyfills({
      globals: { Buffer: true, process: true, global: true },
    }),
  ],
  server: {
    port: 5173,
    sourcemapIgnoreList: (sourcePath) => sourcePath.includes('contracts/managed'),
    fs: {
      // Allow importing the compiled contract + witnesses that live outside
      // frontend/ (in the project's contracts/ directory) as plain TS/JS
      // source. The ZK artifacts themselves (keys/zkir) are NOT imported
      // this way — they're served as static files from frontend/public/zk
      // (see scripts/copy-zk-assets.mjs) and fetched by FetchZkConfigProvider.
      allow: [path.resolve(__dirname)],
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-frontend'),
    emptyOutDir: true,
    // Top-level await (used by the wasm modules) requires a modern target.
    target: 'esnext',
  },
  esbuild: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
});

