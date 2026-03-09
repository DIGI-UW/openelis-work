import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/openelis-work/',
  resolve: {
    alias: {
      '@designs': path.resolve(__dirname, '../designs'),
      // Ensure external imports from designs/ resolve to mockup-viewer's node_modules
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
      '@carbon/react': path.resolve(__dirname, 'node_modules/@carbon/react'),
      '@carbon/icons-react': path.resolve(__dirname, 'node_modules/@carbon/icons-react'),
    },
  },
  server: {
    fs: {
      // Allow serving files from the repo root (for designs/ folder)
      allow: [path.resolve(__dirname, '..')],
    },
  },
});
