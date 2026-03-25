import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/** Copy designs/*.md (and .html) files into dist so they're fetchable at runtime */
function copyDesignsPlugin() {
  return {
    name: 'copy-designs',
    writeBundle(options) {
      const srcDir = path.resolve(__dirname, '../designs');
      const destDir = path.resolve(options.dir, 'designs');
      function copyRecursive(src, dest) {
        if (!fs.existsSync(src)) return;
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
          } else if (entry.name.endsWith('.md') || entry.name.endsWith('.html')) {
            fs.mkdirSync(dest, { recursive: true });
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      copyRecursive(srcDir, destDir);
    },
  };
}

export default defineConfig({
  plugins: [react(), copyDesignsPlugin()],
  base: '/openelis-work/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
  resolve: {
    alias: {
      '@designs': path.resolve(__dirname, '../designs'),
      // Ensure external imports from designs/ resolve to mockup-viewer's node_modules
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
      'recharts': path.resolve(__dirname, 'node_modules/recharts'),
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
