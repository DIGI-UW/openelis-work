# How to Add a New Design to the Gallery

This document tells Cowork (Claude) exactly what to do when new mockup or FRS files appear in `upload/`. Follow every step in order.

---

## Step 0 — Discover what's new

```bash
ls -lt upload/ | head -20
```

Compare against `designs/` to find files not yet registered. Unprocessed files typically follow naming patterns like:
- `*-mockup.jsx` — Carbon React mockup
- `*-preview.html` — standalone HTML preview
- `*-frs-*.md` / `FRS_*.md` — Functional Requirements Spec
- `OGC-*-jira-story.md` — Jira story text (use as spec placeholder until FRS lands)

---

## Step 1 — Copy files into `designs/`

Pick or confirm the **category** (see existing categories below), then copy:

| Upload file type | Destination |
|---|---|
| `*-mockup.jsx` | `designs/{category}/{slug}.jsx` |
| `*-preview.html` | `designs/{category}/{slug}.html` AND `mockup-viewer/public/designs/{category}/{slug}.html` |
| `FRS_*.md` / `*-frs*.md` | `designs/{category}/{slug}.md` |
| `OGC-*-jira-story.md` | `designs/{category}/{slug}.md` (temporary spec placeholder) |

**Existing categories:** `admin-config`, `analyzer-integration`, `blood-bank`, `inventory`, `microbiology`, `nce`, `order-entry`, `patient-management`, `reports`, `system`

If the design belongs in a new category, add it to both `categories` array and `categoryLabels` object in `mockup-viewer/src/App.jsx`.

---

## Step 2 — Compute the permalink slug

```
slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
```

**Examples:**
- `"Pre-Transfusion Testing"` → `pre-transfusion-testing`
- `"Patient Blood Bank Record"` → `patient-blood-bank-record`
- `"FHIR Outbound Push"` → `fhir-outbound-push`

**Permalink formula:**
```
https://digi-uw.github.io/openelis-work/#/{category}/{slug}
```

---

## Step 3 — Create a GitHub issue

Navigate to https://github.com/DIGI-UW/openelis-work/issues/new and file:

- **Title:** `Design: {Feature Name}`
- **Body:** Summary, gallery permalink, Jira ticket, file list, key features

Use Chrome automation if needed (fill `input[placeholder="Title"]` and `textarea[aria-label="Markdown value"]`, click the button with text containing `"Create"` and `"command"`).

Note the issue number — you'll need it for App.jsx and the Jira comment.

---

## Step 4 — Create a Jira story (if one doesn't exist)

Check the FRS or Jira story file for an existing `OGC-` ticket. If present, skip this step.

If there's no ticket yet, use the `createJiraIssue` MCP tool:
- `cloudId`: `57b4e32d-23d4-4a71-8985-82ac0274d145`
- `projectKey`: `OGC`
- `issueTypeName`: `Story`
- `summary`: `{Feature Name description}`

Include the gallery permalink and GitHub issue URL in the description.

---

## Step 5 — Register in `mockup-viewer/src/App.jsx`

Add an entry to the `MOCKUP_REGISTRY` array. Place it near similar entries (grouped by category). Use the section comment `// ─── {Category Label} ───`.

### For a JSX mockup:

```javascript
{
  name: 'Feature Name',
  category: 'category-key',
  component: React.lazy(() => import('@designs/{category}/{slug}.jsx')),
  description: 'One-sentence description of what this mockup shows',
  specPath: 'designs/{category}/{slug}.md',   // null if no FRS yet
  added: 'YYYY-MM-DD',
  status: 'draft',
  githubIssue: 66,
  jira: ['OGC-465'],
},
```

### For an HTML-only preview:

```javascript
{
  name: 'Feature Name',
  category: 'category-key',
  component: null,
  description: 'One-sentence description',
  specPath: 'designs/{category}/{slug}.md',   // null if no FRS yet
  htmlUrl: 'designs/{category}/{slug}.html',
  added: 'YYYY-MM-DD',
  status: 'draft',
  githubIssue: 66,
  jira: ['OGC-465'],
},
```

**Important:** HTML mockups need the file in BOTH `designs/` AND `mockup-viewer/public/designs/` — the gallery serves the `public/` copy in an iframe.

Carbon reference files (`{slug}-carbon.jsx`) are stored in `designs/` but are **NOT** registered in the gallery.

---

## Step 6 — Update `MANIFEST.yaml`

Append to the end of `MANIFEST.yaml`:

```yaml
- id: {slug}
  type: jsx          # or: html, both
  path: designs/{category}/{slug}.jsx
  spec: designs/{category}/{slug}.md   # or null
  category: {category}
  description: One-sentence description
  links:
    github: https://github.com/DIGI-UW/openelis-work/issues/{number}
    jira: https://uwdigi.atlassian.net/browse/OGC-XXX
    gallery: https://digi-uw.github.io/openelis-work/#{category}/{slug}
  added: "YYYY-MM-DD"
```

---

## Step 7 — Update `INDEX.md`

Find the `## {Category}` section and add a row to the table:

```markdown
| Feature Name | [slug.jsx](designs/{category}/{slug}.jsx) | [slug.md](designs/{category}/{slug}.md) |
```

Use `—` for missing spec or mockup columns.

If it's a new category, add a new `## {Category Label}` section with the header row in the right alphabetical position.

---

## Step 8 — Post the permalink as a Jira comment

For each `OGC-` ticket associated with the design, post a comment using the `addCommentToJiraIssue` MCP tool:

- `cloudId`: `57b4e32d-23d4-4a71-8985-82ac0274d145`
- `issueKey`: `OGC-XXX`
- `contentFormat`: `markdown`
- `body`:

```markdown
**Gallery Mockup:** https://digi-uw.github.io/openelis-work/#/{category}/{slug}

**GitHub Issue:** https://github.com/DIGI-UW/openelis-work/issues/{number}

Interactive Carbon React mockup is now available in the OpenELIS Design Gallery.
```

If the MCP tool is unavailable, fall back to Chrome automation:
1. Navigate to `https://uwdigi.atlassian.net/browse/OGC-XXX`
2. Find the comment textarea (a `contenteditable` div)
3. Use `document.execCommand('insertText', false, text)` to insert the comment
4. Click the "Save" button

---

## Step 9 — Commit

```bash
cd /sessions/funny-blissful-gates/mnt/openelis-work
git add designs/{category}/ mockup-viewer/src/App.jsx MANIFEST.yaml INDEX.md
# include mockup-viewer/public/designs/ if HTML was added
git commit -m "feat: add {Feature Name} mockup (#{github-issue}, {OGC-ticket})"
```

Commits accumulate locally. Run `git push origin main` to deploy to GitHub Pages (triggers the Actions workflow automatically).

---

## Quick Reference

| Thing | Value |
|---|---|
| Live gallery | https://digi-uw.github.io/openelis-work/ |
| GitHub repo | https://github.com/DIGI-UW/openelis-work |
| Jira project | https://uwdigi.atlassian.net/browse/OGC |
| Jira cloudId | `57b4e32d-23d4-4a71-8985-82ac0274d145` |
| Figma template | https://www.figma.com/make/15B8LmoBhZ5WgtYDI9MCHm/OpenELIS-Global-Template |
| Source of truth | `mockup-viewer/src/App.jsx` → `MOCKUP_REGISTRY` array |
| Design files | `designs/{category}/` |
| HTML serving | `mockup-viewer/public/designs/{category}/` |
| Upload staging | `upload/` (files placed here by Casey for processing) |
