# AGENTS.md — OpenELIS Design Gallery

## Project overview

This repo is the centralized design workspace for [OpenELIS Global](https://github.com/I-TECH-UW/OpenELIS-Global2), an open-source laboratory information management system. It contains JSX mockups, functional requirement specs (FRS), and an auto-deployed gallery at [digi-uw.github.io/openelis-work](https://digi-uw.github.io/openelis-work/).

## Local development

From repo root (no need to `cd mockup-viewer`):

```bash
npm run setup    # one-time: install mockup-viewer deps
npm run dev      # live gallery at localhost:5173
npm test         # run the 175-test suite
npm run build    # production build
```

## Recommended workflow

For anything beyond trivial typo fixes, use a feature branch and PR:

```bash
git checkout main && git pull origin main
git checkout -b design/<slug>
# ... make changes ...
npm test
git add <specific files>
git commit -m "feat(design): add <Feature Name> (#<issue>, OGC-<ticket>)"
git push -u origin design/<slug>
gh pr create --title "feat(design): add <Feature Name>" --body "..."
```

CI runs tests on the PR. Once green, merge and the gallery auto-deploys.

**When direct-to-main is fine:** trivial README typos, MANIFEST link fixes, single-field corrections. For new designs or multi-file changes, always use a branch+PR.

## Commit convention

| Prefix | Use |
|--------|-----|
| `feat(design):` | New mockup or screen |
| `update(design):` | Changes to existing mockup |
| `fix(design):` | Corrections to designs |
| `spec:` | New or updated specification |
| `docs:` | README, index, manifest, or documentation |
| `chore:` | Maintenance, cleanup |

Include the GitHub issue number (`#N`) and Jira key (`OGC-NNN`) when applicable.

## Adding a new design

Follow the steps in [ADD-TO-GALLERY.md](ADD-TO-GALLERY.md).

## File layout

```
designs/           JSX mockups + MD specs, organized by category
mockup-viewer/     Vite + React gallery app (auto-deployed to GitHub Pages)
upload/            Drop files here for processing — staging area
notes/             Transcripts, meeting notes, decision logs
assets/            Vendor manuals, reference data, requirements docs
MANIFEST.yaml      Master manifest of all artifacts with linked objects
INDEX.md           Cross-referenced design index
.templates/        Templates for specs, handoffs, manifests, etc.
```

## Important: avoid accidental file deletions

When staging changes, always use `git add <specific files>` rather than `git add -A` or `git add .`. Past commits have accidentally deleted existing design files by staging unintended removals. After staging, run `git status` and verify no unexpected deletions appear.

## Agent-accessible endpoints

The gallery is a React SPA. For programmatic or non-JS access, use these static endpoints:

| URL | Format | Contents |
|-----|--------|----------|
| `/catalog.json` | JSON | Structured index of all designs with URLs |
| `/catalog.html` | HTML | Browsable plain-HTML catalog (no JS needed) |
| `/llms.txt` | Markdown | LLM-optimized site index (llms.txt convention) |
| `/llms-full.txt` | Markdown | All spec documents concatenated |
| `/sitemap.xml` | XML | Standard sitemap for crawlers |
| `/#/preview/{category}/{slug}` | SPA | Standalone mockup preview with screenshot |
| `/#/spec/{category}/{slug}` | SPA | Standalone rendered spec document |
| `/designs/{category}/{slug}.md` | Markdown | Raw spec file |
| `/designs/{category}/{slug}.jsx` | JSX | Raw mockup source code |
| `/designs/{category}/{slug}.html` | HTML | Standalone HTML mockup |

All `/catalog.*`, `/llms*`, `/sitemap.xml`, and `/designs/**` URLs are static files — no JS execution needed. The `/#/preview/` and `/#/spec/` routes require the SPA but render without gallery chrome.

## Test suite

Tests live in `mockup-viewer/src/App.test.jsx`. The suite includes:
- Registry integrity (names, categories, permalinks, Jira keys)
- Permalink stability (known URLs must not break)
- Render smoke tests for every registered JSX mockup
- App component interaction tests

Always run `npm test` before pushing.
