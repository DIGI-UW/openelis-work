import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const BASE_URL = '/openelis-work/';
const SITE_URL = 'https://digi-uw.github.io/openelis-work/';

/** Copy designs/*.md, .html, and .jsx files into dist so they're fetchable at runtime */
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
          } else if (entry.name.endsWith('.md') || entry.name.endsWith('.html') || entry.name.endsWith('.jsx')) {
            fs.mkdirSync(dest, { recursive: true });
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      copyRecursive(srcDir, destDir);
    },
  };
}

/**
 * Generate static catalog files at build time:
 * - catalog.json  — structured machine-readable index
 * - catalog.html  — plain HTML listing (no JS required)
 * - llms.txt      — LLM-optimized site index
 * - llms-full.txt — all spec content concatenated
 * - sitemap.xml   — standard sitemap for crawlers
 */
function generateCatalogPlugin() {
  return {
    name: 'generate-catalog',
    writeBundle(options) {
      const appPath = path.resolve(__dirname, 'src/App.jsx');
      const designsDir = path.resolve(__dirname, '../designs');
      const distDir = options.dir;
      const src = fs.readFileSync(appPath, 'utf-8');

      // --- Extract MOCKUP_REGISTRY entries from App.jsx ---
      const registryMatch = src.match(/export\s+const\s+MOCKUP_REGISTRY\s*=\s*\[([\s\S]*?)\n\];/);
      if (!registryMatch) {
        console.warn('[generate-catalog] Could not find MOCKUP_REGISTRY in App.jsx');
        return;
      }
      const registryText = registryMatch[1];

      // Extract category labels
      const categoryLabelsMatch = src.match(/export\s+const\s+categoryLabels\s*=\s*\{([\s\S]*?)\n\};/);
      let categoryLabels = {};
      if (categoryLabelsMatch) {
        try {
          categoryLabels = new Function('return {' + categoryLabelsMatch[1] + '}')();
        } catch (e) { /* fall back to category keys */ }
      }

      // Parse entries: split on `{` at object boundaries, extract fields via regex
      const entries = [];
      const entryBlocks = registryText.split(/\n\s*\{/).slice(1); // skip text before first {
      for (const block of entryBlocks) {
        const raw = '{' + block.split(/\n\s*\},?\s*$/m)[0] + '}';
        const get = (key) => {
          const m = raw.match(new RegExp(`${key}:\\s*'([^']*)'`)) || raw.match(new RegExp(`${key}:\\s*"([^"]*)"`));
          return m ? m[1] : null;
        };
        const getNum = (key) => {
          const m = raw.match(new RegExp(`${key}:\\s*(\\d+)`));
          return m ? parseInt(m[1]) : null;
        };
        const getArr = (key) => {
          const m = raw.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`));
          if (!m) return [];
          return m[1].match(/'([^']*)'/g)?.map(s => s.replace(/'/g, '')) || [];
        };

        const name = get('name');
        if (!name) continue;

        const category = get('category');
        const hasComponent = /component:\s*React\.lazy/.test(raw);
        const htmlUrl = get('htmlUrl');

        let type = 'spec-only';
        if (hasComponent) type = 'jsx';
        else if (htmlUrl) type = 'html';
        else if (/figmaUrl/.test(raw)) type = 'figma';

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const entry = {
          name,
          slug,
          category,
          description: get('description') || '',
          type,
          added: get('added') || '2026-03-03',
          status: get('status') || 'draft',
          tags: getArr('tags'),
          jira: getArr('jira'),
          githubIssue: getNum('githubIssue'),
          specPath: get('specPath'),
        };

        // Build URLs
        entry.urls = {
          gallery: `${SITE_URL}#/${category}/${slug}`,
          preview: `${SITE_URL}#/preview/${category}/${slug}`,
        };
        if (entry.specPath) {
          entry.urls.spec = `${SITE_URL}#/spec/${category}/${slug}`;
          entry.urls.specRaw = `${SITE_URL}${entry.specPath}`;
        }
        if (type === 'jsx') {
          const jsxPath = entry.specPath ? entry.specPath.replace('.md', '.jsx') : `designs/${category}/${slug}.jsx`;
          entry.urls.jsxRaw = `${SITE_URL}${jsxPath}`;
        }
        if (htmlUrl) {
          entry.urls.htmlRaw = `${SITE_URL}${htmlUrl}`;
        }

        entries.push(entry);
      }

      const categories = [...new Set(entries.map(e => e.category))].sort();

      // --- catalog.json ---
      const catalog = {
        generated: new Date().toISOString(),
        galleryUrl: SITE_URL,
        totalDesigns: entries.length,
        categories,
        designs: entries,
      };
      fs.writeFileSync(path.join(distDir, 'catalog.json'), JSON.stringify(catalog, null, 2));

      // --- catalog.html ---
      const grouped = {};
      for (const e of entries) {
        if (!grouped[e.category]) grouped[e.category] = [];
        grouped[e.category].push(e);
      }
      let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenELIS Design Gallery — Catalog</title>
  <meta name="description" content="Searchable catalog of ${entries.length} design mockups and specifications for OpenELIS Global">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem 1rem; color: #161616; line-height: 1.5; }
    h1 { border-bottom: 2px solid #0f62fe; padding-bottom: 0.5rem; }
    h2 { color: #0f62fe; margin-top: 2rem; }
    .design { margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e0e0e0; border-radius: 4px; }
    .design h3 { margin: 0 0 0.25rem 0; }
    .design p { margin: 0.25rem 0; color: #525252; }
    .links a { margin-right: 1rem; color: #0f62fe; text-decoration: none; font-size: 0.875rem; }
    .links a:hover { text-decoration: underline; }
    .tags { font-size: 0.8rem; color: #6f6f6f; }
    .tag { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; margin-right: 4px; }
    .meta { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.875rem; color: #6f6f6f; margin-top: 0.5rem; }
    nav { margin: 1rem 0; } nav a { margin-right: 0.75rem; }
  </style>
</head>
<body>
  <h1>OpenELIS Design Gallery — Catalog</h1>
  <p>${entries.length} designs across ${categories.length} categories.
    <a href="./">Interactive Gallery</a> |
    <a href="catalog.json">JSON Catalog</a> |
    <a href="llms.txt">LLM Index</a> |
    <a href="sitemap.xml">Sitemap</a>
  </p>
  <nav>`;
      for (const cat of categories) {
        const label = categoryLabels[cat] || cat;
        html += `<a href="#cat-${cat}">${label} (${grouped[cat].length})</a> `;
      }
      html += '</nav>\n';

      for (const cat of categories) {
        const label = categoryLabels[cat] || cat;
        html += `\n  <h2 id="cat-${cat}">${label} (${grouped[cat].length})</h2>\n`;
        for (const e of grouped[cat]) {
          html += `  <div class="design">
    <h3><a href="${e.urls.gallery}">${e.name}</a></h3>
    <p>${e.description}</p>
    <div class="links">
      <a href="${e.urls.preview}">Preview</a>`;
          if (e.urls.spec) html += `\n      <a href="${e.urls.spec}">Spec</a>`;
          if (e.urls.specRaw) html += `\n      <a href="${e.urls.specRaw}">Raw Spec (MD)</a>`;
          if (e.urls.jsxRaw) html += `\n      <a href="${e.urls.jsxRaw}">Source (JSX)</a>`;
          if (e.urls.htmlRaw) html += `\n      <a href="${e.urls.htmlRaw}">HTML Mockup</a>`;
          if (e.jira.length) {
            for (const j of e.jira) html += `\n      <a href="https://uwdigi.atlassian.net/browse/${j}">${j}</a>`;
          }
          if (e.githubIssue) html += `\n      <a href="https://github.com/DIGI-UW/openelis-work/issues/${e.githubIssue}">#${e.githubIssue}</a>`;
          html += `\n    </div>`;
          if (e.tags.length) {
            html += `\n    <div class="tags">${e.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</div>`;
          }
          html += `\n  </div>\n`;
        }
      }
      html += '</body>\n</html>\n';
      fs.writeFileSync(path.join(distDir, 'catalog.html'), html);

      // --- llms.txt ---
      let llms = `# OpenELIS Design Gallery\n\n`;
      llms += `> Design mockups and functional requirement specs for OpenELIS Global, an open-source laboratory information management system. ${entries.length} designs across ${categories.length} categories.\n\n`;
      llms += `## Catalog\n`;
      llms += `- [JSON Catalog](${SITE_URL}catalog.json): Machine-readable index of all designs\n`;
      llms += `- [HTML Catalog](${SITE_URL}catalog.html): Browsable plain-HTML catalog\n`;
      llms += `- [Full Spec Content](${SITE_URL}llms-full.txt): All spec documents concatenated\n\n`;

      for (const cat of categories) {
        const label = categoryLabels[cat] || cat;
        llms += `## ${label}\n`;
        for (const e of grouped[cat]) {
          const specUrl = e.urls.specRaw || e.urls.gallery;
          llms += `- [${e.name}](${specUrl}): ${e.description}\n`;
        }
        llms += '\n';
      }
      fs.writeFileSync(path.join(distDir, 'llms.txt'), llms);

      // --- llms-full.txt ---
      let fullText = `# OpenELIS Design Gallery — Full Spec Content\n\n`;
      fullText += `Generated: ${new Date().toISOString()}\n`;
      fullText += `Total designs: ${entries.length}\n\n`;
      fullText += `---\n\n`;

      for (const e of entries) {
        if (!e.specPath) continue;
        const specFile = path.resolve(__dirname, '..', e.specPath);
        if (!fs.existsSync(specFile)) continue;
        const content = fs.readFileSync(specFile, 'utf-8');
        fullText += `# ${e.name} (${e.category})\n`;
        fullText += `Gallery: ${e.urls.gallery}\n`;
        if (e.jira.length) fullText += `Jira: ${e.jira.join(', ')}\n`;
        fullText += `\n${content}\n\n---\n\n`;
      }
      fs.writeFileSync(path.join(distDir, 'llms-full.txt'), fullText);

      // --- sitemap.xml ---
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      sitemap += `  <url><loc>${SITE_URL}</loc></url>\n`;
      sitemap += `  <url><loc>${SITE_URL}catalog.html</loc></url>\n`;
      sitemap += `  <url><loc>${SITE_URL}catalog.json</loc></url>\n`;
      sitemap += `  <url><loc>${SITE_URL}llms.txt</loc></url>\n`;
      for (const e of entries) {
        if (e.urls.specRaw) sitemap += `  <url><loc>${e.urls.specRaw}</loc></url>\n`;
        if (e.urls.jsxRaw) sitemap += `  <url><loc>${e.urls.jsxRaw}</loc></url>\n`;
        if (e.urls.htmlRaw) sitemap += `  <url><loc>${e.urls.htmlRaw}</loc></url>\n`;
      }
      sitemap += `</urlset>\n`;
      fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

      console.log(`[generate-catalog] Generated catalog.json (${entries.length} designs), catalog.html, llms.txt, llms-full.txt, sitemap.xml`);
    },
  };
}

export default defineConfig({
  plugins: [react(), copyDesignsPlugin(), generateCatalogPlugin()],
  base: BASE_URL,
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
