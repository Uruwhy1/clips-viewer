import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const copyCoversPlugin = () => ({
  name: 'copy-covers',
  closeBundle() {
    const srcCovers = join(__dirname, 'assets', 'covers');
    const destCovers = join(__dirname, 'dist', 'assets', 'covers');
    if (!existsSync(destCovers)) {
      mkdirSync(destCovers, { recursive: true });
    }
    if (existsSync(srcCovers)) {
      const files = require('fs').readdirSync(srcCovers);
      files.forEach((file: string) => {
        copyFileSync(join(srcCovers, file), join(destCovers, file));
      });
    }
  },
});

export default defineConfig({
  plugins: [react(), copyCoversPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});