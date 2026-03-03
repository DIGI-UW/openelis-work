import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/openelis-work/',
  resolve: {
    alias: {
      '@designs': path.resolve(__dirname, '../designs'),
    },
  },
});
