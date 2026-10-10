import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const demoAppRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  server: {
    fs: { allow: [demoAppRoot] },
  },
});