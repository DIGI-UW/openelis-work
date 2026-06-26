/**
 * Capture card thumbnails for the OpenELIS design gallery.
 *
 * Reuses the Playwright install from Casey's existing screenshot harness
 * (~/Documents/OpenELIS QA) instead of adding Playwright to this repo. It loads
 * each deployed HTML prototype and saves a small JPEG to public/thumbnails/<slug>.jpg.
 * Cards fall back to a type icon when no thumbnail exists, so partial runs are fine.
 *
 * Run on Casey's Mac (the sandbox can't launch Chromium):
 *   cd ~/Documents/openelis-work/mockup-viewer
 *   node scripts/capture-thumbnails.mjs
 *
 * Regenerate the target list after adding HTML mockups:
 *   (the list is produced from src/App.jsx — see README in scripts/)
 *
 * Env:
 *   OE_HARNESS  path to the harness that has Playwright installed
 *               (default: ~/Documents/OpenELIS QA)
 *   ONLY        comma-separated slug substrings to limit the run (debug)
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';

const HARNESS = process.env.OE_HARNESS || path.join(os.homedir(), 'Documents', 'OpenELIS QA');
const require = createRequire(path.join(HARNESS, 'package.json'));
const { chromium } = require('playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targets = JSON.parse(fs.readFileSync(path.join(__dirname, 'thumbnail-targets.json'), 'utf8'));
const outDir = path.resolve(__dirname, '..', 'public', 'thumbnails');
fs.mkdirSync(outDir, { recursive: true });

const only = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
const list = only.length ? targets.filter((t) => only.some((o) => t.slug.includes(o))) : targets;

const W = 1000, H = 650; // capture viewport; cards render it small, browser downscales
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

let ok = 0, fail = 0;
for (const t of list) {
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(t.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(700); // let fonts/charts settle
    const buf = await page.screenshot({ type: 'jpeg', quality: 62, clip: { x: 0, y: 0, width: W, height: H } });
    fs.writeFileSync(path.join(outDir, t.slug + '.jpg'), buf);
    ok++;
    console.log('OK  ', t.slug, resp ? resp.status() : '?');
  } catch (e) {
    fail++;
    console.log('FAIL', t.slug, String(e.message).split('\n')[0]);
  }
  await page.close();
}
await browser.close();
console.log(`\ndone ok=${ok} fail=${fail} -> ${outDir}`);
