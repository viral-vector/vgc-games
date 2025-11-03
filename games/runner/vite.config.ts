import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    open: true
  },
  build: {
    manifest: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: ({ name }) => {
          const parts = name?.split('.') ?? [];
          const ext = parts.length > 1 ? parts.pop() : 'asset';
          return `assets/[name].[hash].${ext}`;
        }
      }
    }
  }
});
