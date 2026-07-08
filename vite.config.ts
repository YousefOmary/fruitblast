import { defineConfig } from 'vite';
// base './' so the build runs from a GitHub Pages project subpath and inside Capacitor.
export default defineConfig({ base: './', build: { target: 'es2020' } });
