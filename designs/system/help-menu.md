# FRS: OpenELIS Global In-App Help System

**Version:** 1.0
**Date:** 2026-05-12
**Author:** Casey Iiams-Hauser
**Status:** Draft for review
**Target release:** OpenELIS Global v3.3 (first release with in-app help)

---

## 1. Overview

OpenELIS Global currently surfaces user-facing help by opening an external URL — typically a hosted PDF of the user manual — in a new browser tab. This breaks the user's context, depends on external network availability, and provides no in-app navigation, search, or deep linking. Lab staff in low-connectivity environments often cannot reach the PDF at all.

This feature replaces the external link with a rich, in-app help viewer. Help content is authored in Confluence (unchanged authoring workflow), exported by a build-time pipeline into static assets shipped with the OpenELIS distribution, and rendered inside the React frontend through a Carbon-based viewer with a left side nav, full-text search, and deep-linkable URLs.

The system has two cooperating components:

- **Help Refresh Pipeline** — a Node.js script run on a maintainer's machine before a release cut. It fetches pages from the OpenELIS Confluence space via the REST API, converts ADF JSON to sanitized HTML chunks, downloads referenced images locally with content-hashed filenames, builds a TOC manifest and a client-side search index, and writes the output into `frontend/public/help-content/<locale>/`. The output is committed to the repo and ships with the release.
- **Help Viewer** — a React component (`HelpViewer.jsx`) mounted at `/help/:slug?`. Loads the manifest at mount, renders the active page's pre-built HTML through DOMPurify, and provides side-nav navigation, search, and deep-link routing.

All architectural decisions for this feature were settled prior to writing this FRS and are non-negotiable without revisiting with the product lead: Confluence is the source of truth, the pipeline is build-time only (no runtime calls), content is version-pinned to each release, and English is the only locale at launch with the data model designed for additional locales later.

---

## 2. User Stories

1. **As a lab technician**, I want the user manual to open in a separate browser tab/window so that I can keep my OpenELIS workflow visible alongside the help page and reference both at the same time.
2. **As a lab manager working in a low-connectivity facility**, I want help content to be available even when the internet is down, so that staff can rely on it during normal operations.
3. **As a lab technician**, I want to search across all help topics by keyword, so that I can find the right page without browsing the full table of contents.
4. **As a support engineer**, I want to send a colleague a direct URL to a specific section of a help page, so that they can land on the right answer without a long set of click instructions.
5. **As a documentation maintainer**, I want to keep authoring help in Confluence and trigger a refresh that produces a committable bundle of static assets, so that I can keep the existing workflow and ship updated content with each release.

---

## 3. Functional Requirements

### 3.1 Pipeline (build-time)

| ID | Requirement |
|---|---|
| FR-P-01 | The pipeline MUST accept either a saved ADF JSON file (`--in <file>`) or a live Confluence page id + cloud id (`--page <id> --cloud <cloudId>`). |
| FR-P-02 | In live mode the pipeline MUST authenticate using environment variables `CONFLUENCE_HOST`, `CONFLUENCE_EMAIL`, `CONFLUENCE_TOKEN`, and call `GET /wiki/api/v2/pages/<id>?body-format=atlas_doc_format`. |
| FR-P-03 | The pipeline MUST walk every page in the configured root tree, preserving parent/child hierarchy in the manifest. The v1 root is the **User Manual subtree** under Confluence folder `261455874` — NOT the Admin Manual subtree, and NOT the broader OpenELIS Global space (which contains FRS docs, dev docs, draft pages, etc.). The User Manual subtree root page id MUST be set in a config file (e.g. `frontend/scripts/help-refresh.config.json`) so the dev can update it without code changes. Because two sibling series both use "PART N" titles, hierarchy MUST be derived from page parent ids, not from titles. |
| FR-P-04 | For each page the pipeline MUST emit a sanitized HTML chunk to `<out>/<locale>/pages/<slug>.html`. The slug MUST be derived deterministically from the page title; collisions MUST be resolved by appending a numeric suffix. |
| FR-P-05 | The pipeline MUST handle all ADF block types present in the corpus survey: `doc`, `paragraph`, `heading` (levels 1–6), `bulletList`, `orderedList` (preserving the `start` attribute), `listItem`, `blockquote`, `codeBlock`, `taskList`, `taskItem`, `rule`, `table` / `tableRow` / `tableHeader` / `tableCell`, `mediaSingle` / `media` / `caption`, and the `extension` macro (drop `toc`, emit a visible placeholder for any other macro key). |
| FR-P-06 | The pipeline MUST handle all marks present in the corpus survey: `strong`, `em`, `code`, `link`, `underline`, and the Confluence-specific `border` mark on media (mapped to a CSS class). |
| FR-P-07 | The pipeline MUST detect blockquotes that begin with `Note:`, `Warning:`, `Caution:`, `Verify:`, `Tip:`, `Info:`, or any of the matching emoji prefixes (`⚠️`, `💡`, `ℹ️`) and emit them as Carbon-style callout asides (`oe-help-callout--note`, `oe-help-callout--warning`, `oe-help-callout--info`). Other blockquotes MUST render as plain styled quotes. |
| FR-P-08 | The pipeline MUST download every external image referenced from the ADF tree, store it under `<out>/<locale>/assets/<sha256-prefix>.<ext>` (content-hashed for dedupe and idempotency), and rewrite the `<img src>` to the local path. |
| FR-P-09 | Failed image downloads MUST NOT abort the build. The pipeline MUST emit the image element with `data-download-failed="true"` and class `oe-help-img--unresolved`, fall back to the original remote URL as the `src`, and record the failure count in the manifest as `imagesFailed`. |
| FR-P-10 | The pipeline MUST run in two passes for cross-page link resolution: pass 1 fetches and slugs every page; pass 2 renders HTML using the resulting `pageId → slug` map. Internal Confluence URLs (`/wiki/spaces/.../pages/<id>/...`) MUST be rewritten to `/help/<slug>`. Unresolvable internal links MUST be rendered with a `data-broken-link="true"` attribute and a visible `[broken link]` suffix. |
| FR-P-11 | The pipeline MUST emit a `manifest.json` per locale containing: `locale`, `generatedAt` ISO timestamp, `sourceConfluenceSpaceId`, and `pages` (an ordered tree where each node has `slug`, `title`, `pageId`, `parentSlug`, `headings` (each with `level`, `text`, `slug`), `children`, `images`, `imagesFailed`). |
| FR-P-12 | The pipeline MUST build a FlexSearch document index at `<out>/<locale>/search-index.json`, weighting fields as: title (highest), headings (medium), body text (low). Stop-word lists for English are mandatory at launch; per-locale stop-word lists MUST be configurable. |
| FR-P-13 | The pipeline MUST be idempotent: running it twice in succession with no Confluence changes MUST produce byte-identical output. |
| FR-P-14 | The pipeline MUST log a summary at the end of each run: total pages, total images downloaded, total image failures, total broken internal links, total unknown macros, and the manifest path. |

### 3.2 Viewer (runtime)

| ID | Requirement |
|---|---|
| FR-V-01 | The viewer MUST be a React component (`HelpViewer.jsx`) mounted at the route `/help/:slug?` inside the existing `<Switch>` in `App.jsx`, using `react-router-dom` v5 idioms (`Route` with `component` and `useParams()` / `useHistory()`). The route is intended to be opened in a separate browser tab/window from the main OpenELIS session (see FR-I-02), allowing the user to view help and OpenELIS side-by-side. |
| FR-V-01a | When the `/help` route is rendered, the page MUST use a minimal standalone header — the OpenELIS brand mark + the title "Help" + the search input — and MUST NOT render the full OpenELIS UIShell side menu, dashboard tiles, or module navigation. Help tabs are dedicated to help content; they do not double as full OpenELIS sessions. |
| FR-V-01b | If `window.opener` is present and from the same origin, the standalone header MUST include a "Return to OpenELIS" link that calls `window.close()`. If no opener is present (e.g., the URL was opened from a bookmark or copy-paste), the link MUST instead point to `/home` (which opens a fresh OpenELIS session in the same tab). |
| FR-V-01c | The standalone header MUST consume the existing OpenELIS Site Branding REST endpoint (`GET /rest/site-branding/`) at mount and apply the deployment's branding: render the `headerLogoUrl` as the brand mark (falling back to `/images/openelis_logo.png` when null), set the Carbon CSS custom properties `--cds-interactive-01` to `primaryColor`, `--cds-interactive-02` to `secondaryColor`, `--cds-support-01` to `accentColor` (each falling back to OpenELIS defaults `#1d4ed8 / #64748b / #0891b2`), and set the document `<link rel="icon">` to `faviconUrl` when present. The viewer MUST also apply the site name from the existing configuration-properties endpoint used by the main OpenELIS header — the help tab brand text MUST read "[Site name] Help" (e.g., "Madagascar OpenELIS Help"), not the literal "OpenELIS Help". |
| FR-V-01d | If the Site Branding endpoint is unavailable or returns a non-2xx response, the header MUST render with the default brand (logo, colors, name) without blocking the rest of the viewer. Branding is enhancement, not a load-bearing dependency. |
| FR-V-02 | On mount the viewer MUST `fetch('/help-content/<active-locale>/manifest.json')`. If the active locale's manifest does not exist, the viewer MUST fall back to English (`/help-content/en/manifest.json`) and display a Carbon `Tag` reading "Available in English only" next to the page title. |
| FR-V-03 | The viewer MUST render a left side navigation using Carbon `UIShell SideNav` containing the full TOC tree from the manifest. Parent entries MUST be collapsible. The currently active page entry MUST be visually highlighted. |
| FR-V-04 | Selecting a TOC entry MUST update the route to `/help/<slug>`. Navigating to `/help/<slug>` directly (e.g. from a bookmark) MUST load the corresponding page and highlight the entry in the side nav. |
| FR-V-05 | Page content MUST be loaded by fetching `/help-content/<locale>/pages/<slug>.html` and rendering it through `DOMPurify` before assigning to `dangerouslySetInnerHTML`. |
| FR-V-06 | The viewer MUST support URL hashes (`/help/<slug>#<heading-id>`) for deep linking to subsections. On load, the viewer MUST scroll the heading into view smoothly. |
| FR-V-07 | A Carbon `Search` input MUST sit above the side nav and search the locale's `search-index.json` (lazy-loaded on first use). Matching pages MUST appear as a filtered subset of the side nav, with matched terms highlighted in result snippets. |
| FR-V-08 | When the user clicks an internal cross-page link inside rendered content (a link whose href starts with `/help/`), the viewer MUST handle it via `history.push` rather than a full page reload. |
| FR-V-09 | The viewer MUST render a Carbon `Breadcrumb` at the top of the content pane showing the path from the root through the current page's ancestors. |
| FR-V-10 | Loading states (initial manifest fetch, page fetch, search index lazy-load) MUST use Carbon `SkeletonText` / `Loading`. |
| FR-V-11 | The viewer MUST handle three error states with Carbon `InlineNotification`: (a) manifest fetch failure, (b) page fetch failure (with a "Back to home" action), (c) unknown slug (with a "Back to home" action). |

### 3.3 Integration

| ID | Requirement |
|---|---|
| FR-I-01 | The viewer MUST be mounted as a `SecureRoute` at `/help/:slug?` exact match, alongside other top-level routes in `App.jsx`. |
| FR-I-02 | `HelpMenu.jsx` MUST be modified: the `case "manual"` branch of the `openHelp` handler MUST call `window.open("/help", "_blank", "noopener=no,noreferrer")` and then `handlePanelToggle("")`. (Note: `noopener=no` is deliberate — we want `window.opener` available so the help tab can offer a "Return to OpenELIS" link via `window.close()`. Origin is same, so the security risk is acceptable.) |
| FR-I-03 | The `"Video Tutorials"` and `"Release Notes"` buttons in `HelpMenu.jsx` MUST remain unchanged in v1 (they continue to open external URLs from the existing backend properties). |
| FR-I-04 | A deployment-level override MUST exist via the new boolean property `org.openelisglobal.help.manual.useInApp`. The default for v1 is `true` (in-app viewer is on for all deployments out of the box). When set to `false` AND `org.openelisglobal.help.manual.url` is non-empty, `HelpMenu.jsx` MUST fall back to the legacy `window.open(url, "_blank")` behavior. This gives cautious deployments a kill-switch without complicating the default user experience. |
| FR-I-05 | The bundled help content directory MUST live at `frontend/public/help-content/<locale>/` so it is served unchanged by Vite (dev) and nginx (prod) as `/help-content/...`. |

---

## 4. Data Model

### 4.1 `manifest.json`

```json
{
  "locale": "en",
  "generatedAt": "2026-05-12T20:00:00Z",
  "sourceConfluenceSpaceId": "52559895",
  "rootSlugs": ["user-manual", "admin-manual"],
  "pages": [
    {
      "slug": "user-manual",
      "title": "User Manual",
      "pageId": "261455874-um",
      "parentSlug": null,
      "headings": [],
      "children": [
        {
          "slug": "part-1-navigating",
          "title": "PART 1: NAVIGATING OpenELIS GLOBAL",
          "pageId": "260931593",
          "parentSlug": "user-manual",
          "headings": [
            { "level": 1, "text": "Introduction", "slug": "introduction" },
            { "level": 2, "text": "How to login to OpenELIS", "slug": "how-to-login-to-openelis" }
          ],
          "children": [],
          "images": 8,
          "imagesFailed": 0
        }
      ]
    }
  ]
}
```

### 4.2 Per-page HTML chunk

A self-contained HTML fragment (no `<html>` or `<body>` wrapper). Image sources point to relative `assets/<hash>.<ext>` paths. Internal cross-page links use `/help/<slug>` URLs. Headings carry stable `id` attributes for deep linking. Sanitized through `DOMPurify` before rendering.

### 4.3 `search-index.json`

FlexSearch-compatible serialized document index. Documents are keyed by `<slug>` and include `title`, `headings` (concatenated), and `body` (extracted text content, stop-words removed). Field weights: title 4, headings 2, body 1.

### 4.4 CSS class contract (pipeline → viewer)

The pipeline emits these stable class names; the viewer's stylesheet must style them:

| Class | Purpose |
|---|---|
| `oe-help-figure` | Wraps every image + caption |
| `oe-help-figure--wide` / `--center` / `--left` / `--right` | Layout variants |
| `oe-help-img` | The image itself |
| `oe-help-img--bordered` | Has the Confluence border mark |
| `oe-help-img--unresolved` | Download failed; remote src used as fallback |
| `oe-help-table-wrap` | Horizontal-scroll wrapper for tables |
| `oe-help-table` | Semantic table |
| `oe-help-callout` | Base callout class |
| `oe-help-callout--note` / `--info` / `--warning` | Severity variants |
| `oe-help-tasklist` | Render `taskList` as a styled checklist |
| `oe-help-unsupported` | Visible red placeholder for unknown Confluence macros |

---

## 5. UX & Interaction

### 5.1 Layout

The viewer opens in a separate browser tab and uses its own minimal header — it does NOT inherit the main OpenELIS UIShell. The user is expected to size and position the help tab themselves (split-screen alongside OpenELIS, separate monitor, or full-screen depending on preference).

Layout inside the help tab:

- **Standalone header (48px, sticky, dark Carbon theme):** OpenELIS brand mark on the left, "Help" page title beside it, Carbon `Search` input in the center (always visible, not collapsed inside the side nav), "Return to OpenELIS" link on the right.
- **Left rail (280px fixed):** Carbon UIShell SideNav. Hierarchical TOC. Active page highlighted with Carbon's standard active-item style.
- **Main pane (flex, max-width 920px, padded):** Carbon `Breadcrumb` (path-from-root). Below: rendered page HTML. Locale-fallback Tag rendered to the right of the page title when applicable.

The layout MUST remain usable down to a viewport width of 480px — at narrower widths the side rail collapses behind a hamburger toggle so a help tab docked as a narrow vertical strip beside OpenELIS still works.

### 5.2 Navigation flows

- **Open from header help icon:** User clicks the `?` icon in the OpenELIS header → HeaderPanel opens → user clicks "User Manual" → panel closes, a new browser tab opens at `/help`, the help viewer loads with the root user-manual page selected. The original OpenELIS tab is unchanged.
- **Click a TOC entry:** Route inside the help tab changes to `/help/<slug>`; main pane scrolls to top; side nav highlights the new entry. (Normal SPA navigation within the help tab.)
- **Click an internal cross-page link in content:** Same as TOC click; uses `history.push` within the help tab.
- **Bookmark/share:** Copy URL from the help tab's address bar; pasting it elsewhere opens that page directly (in whatever tab/window the user puts it).
- **Search:** User types ≥2 characters in Search; results appear as a filtered TOC subset within ~150ms (debounced). Selecting a result navigates to that page.
- **Return to OpenELIS:** User clicks "Return to OpenELIS" in the help tab's standalone header. If `window.opener` is set, the help tab calls `window.close()` and focus returns to the OpenELIS tab. Otherwise (e.g., the help URL was opened from a bookmark), the link points to `/home` so the user lands in a fresh OpenELIS session.

### 5.3 Empty / loading / error states

| State | Treatment |
|---|---|
| Initial manifest load (~300ms expected) | Side nav shows three `SkeletonText` rows; main pane shows three skeleton paragraphs |
| Page chunk loading | Main pane shows skeleton; side nav stays interactive |
| Search index lazy-loading on first keystroke | Search shows inline `Loading` indicator until ready (~150ms) |
| Manifest fetch fails | Full-screen Carbon `InlineNotification kind="error"`: "Help content could not be loaded. Please contact your administrator." |
| Page fetch fails for a known slug | InlineNotification with "Try again" button + "Back to home" link |
| Unknown slug (`/help/does-not-exist`) | InlineNotification with "Page not found" and link back to root |
| Search returns no results | Side nav shows "No results for '<query>'" inline text |

### 5.4 Keyboard accessibility

- Search input focusable with `/` shortcut (matches Carbon convention).
- TOC entries are reachable via Tab; Enter activates.
- Side nav supports arrow-key navigation within the TOC tree (Carbon SideNav default).
- All callouts have `role="note"` for screen readers.

---

## 6. Localization

All UI strings produced by the viewer MUST use `t(key, fallback)`. Keys follow the `[category].[feature].[identifier]` convention.

| Key | English fallback |
|---|---|
| `help.viewer.title` | Help |
| `help.viewer.return-to-app` | Return to OpenELIS |
| `help.viewer.search.placeholder` | Search help… |
| `help.viewer.search.no-results` | No results for "{query}" |
| `help.viewer.search.loading` | Loading search… |
| `help.viewer.breadcrumb.home` | Help |
| `help.viewer.fallback.tag` | Available in English only |
| `help.viewer.error.manifest` | Help content could not be loaded. Please contact your administrator. |
| `help.viewer.error.page.title` | Page could not be loaded |
| `help.viewer.error.page.retry` | Try again |
| `help.viewer.error.page.home` | Back to home |
| `help.viewer.error.not-found.title` | Page not found |
| `help.viewer.error.not-found.body` | The help page you requested does not exist. |
| `help.viewer.loading.page` | Loading… |

Existing keys consumed unchanged: `banner.menu.help.usermanual`, `banner.menu.help.about`, `banner.menu.help.contact` (already present in all 26 locale JSONs under `frontend/src/languages/`).

Content strings inside the rendered HTML chunks are NOT translated by the viewer — they are pre-translated at pipeline time when separate Confluence spaces per locale are provided. The fallback strategy is: if `/help-content/<locale>/manifest.json` is missing, load `/help-content/en/manifest.json` and badge each page header with `help.viewer.fallback.tag`.

---

## 7. Permissions & Security

| ID | Requirement |
|---|---|
| FR-S-01 | The `/help` route MUST be a `SecureRoute` — authenticated users only. No new permission key is introduced; any logged-in user may read help. |
| FR-S-02 | Help content MUST be sanitized through `DOMPurify` before being assigned to `dangerouslySetInnerHTML`. The DOMPurify config MUST be configured as an explicit allowlist with the following parameters:<br/><br/>**Allowed tags:** `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `p`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `figure`, `figcaption`, `img`, `blockquote`, `aside`, `code`, `pre`, `hr`, `br`, `strong`, `em`, `u`, `a`, `div`, `span`.<br/><br/>**Allowed attributes:** `class`, `id`, `href`, `src`, `alt`, `width`, `height`, `role`, `scope`, `start` (for `<ol>`), `data-broken-link`, `data-download-failed`.<br/><br/>**Class allowlist (enforced as a post-sanitize pass):** every emitted class MUST start with `oe-help-` (Section 4.4). Other class values MUST be stripped.<br/><br/>**href restrictions:** internal links MUST match `^/help/` exactly; external links MUST use `http://` or `https://` schemes and MUST be rewritten to add `rel="noopener noreferrer"` and `target="_blank"`. `javascript:`, `data:`, `vbscript:`, and `file:` schemes MUST be rejected.<br/><br/>**Forbidden everywhere:** `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<link>`, `<meta>`, inline event handlers (`on*` attributes), `style` attributes. |
| FR-S-03 | The pipeline MUST refuse any image URL that uses a non-`https` scheme, and MUST refuse remote SVG content (SVG can contain scripts). Failed SVGs MUST be reported as `imagesFailed` and rendered as a placeholder. |
| FR-S-04 | The pipeline's Confluence API token MUST be read from env vars only. It MUST NOT be committed to the repo or to manifest output. The build script MUST exit with a clear error message if any of the three required env vars is missing in live mode. |

---

## 8. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | The viewer MUST be usable offline once OpenELIS is loaded. No runtime calls to Atlassian, Google CDN, or any external service. |
| NFR-02 | Initial paint of the help viewer (manifest loaded + first page rendered) MUST complete in ≤500ms on a 4G connection from a cold cache. |
| NFR-03 | Search query response time, measured end-to-end from keystroke to results visible in the side nav (debounce + index query + render), MUST be ≤150ms at the 95th percentile for a corpus of up to 200 pages with up to 50,000 indexed words. The 50ms debounce window is included in this budget. |
| NFR-04 | The bundled `help-content` directory SHOULD be ≤25 MB for the v1 corpus (~30 pages). If image-heavy growth exceeds this, Git LFS adoption MUST be considered. |
| NFR-05 | The pipeline MUST complete a full refresh of the v1 corpus (~30 pages, ~150 images) in ≤90 seconds on a typical developer laptop with a reasonable internet connection. |
| NFR-06 | All viewer output MUST meet WCAG 2.1 AA: semantic landmarks (`<nav>`, `<main>`, `<aside>` for callouts), color-contrast on text and Carbon Tag variants, focus indicators, keyboard reachability of every interactive element. |

---

## 9. Edge Cases & Failure Handling

| Case | Behavior |
|---|---|
| Confluence page deleted between two pipeline runs | The page is omitted from the new manifest. Any internal links pointing to the deleted `pageId` are rewritten with `data-broken-link="true"`. Build logs the broken link count. |
| Confluence macro the pipeline does not recognize | Visible red placeholder in the rendered HTML: `[Unsupported Confluence macro: <macro-key>]`. Build logs the unknown macro count. The dev decides whether to add a handler or ask the author to use a known pattern. |
| Image download fails (HTTP error, timeout, DNS) | Image element retained with `oe-help-img--unresolved` class and `data-download-failed="true"`. `src` falls back to the original remote URL. Manifest records `imagesFailed`. Build logs each failure with reason. |
| Two pages have the same title slug | Pipeline appends `-2`, `-3`, etc. to the colliding slugs and logs the collision. |
| User navigates to `/help/<slug>` where `<slug>` doesn't exist | Page not found state (Section 5.3). |
| Locale switch mid-session | Viewer re-fetches `/help-content/<new-locale>/manifest.json` and falls back to English if missing. |
| Help content updated between two browser sessions | No special handling — content is shipped with the OpenELIS distribution and rotated only on release. Cache is HTTP-cache-busted naturally because the asset URLs are stable (content is replaced in-place; viewer should send `Cache-Control: no-cache` on manifest.json fetches to avoid stale TOC after an in-place update). |
| Confluence ADF schema adds new node types in the future | Pipeline emits HTML comments (`<!-- unhandled ADF node: X -->`) and logs the unhandled type. Build does not fail. Dev adds a handler in the next release. |

---

## 10. Acceptance Criteria

Each criterion is testable and traces to a functional requirement.

1. **Pipeline against a saved sample produces deterministic output.** Running `node help-refresh.mjs --in sample-part-1.json --out build --slug part-1-navigating` twice MUST produce byte-identical `pages/part-1-navigating.html`, `manifest.json`, and `assets/` content. (FR-P-13)
2. **Pipeline against live Confluence converts the full user-manual tree.** A live refresh starting from folder `261455874` MUST produce ≥16 pages, ≥1 root parent in the manifest, no fatal errors, and a non-zero `images` count. (FR-P-02, FR-P-03)
3. **Internal links resolve.** After a full corpus refresh, no rendered HTML chunk MUST contain a `/wiki/spaces/...` URL. Every internal link MUST either be `/help/<slug>` or marked `data-broken-link="true"`. (FR-P-10)
4. **Images bundled locally.** After a full corpus refresh, no rendered `<img>` element MUST have an external `https://` `src` UNLESS it carries `data-download-failed="true"`. (FR-P-08, FR-P-09)
5. **Viewer mounts at `/help`.** Navigating to `/help` in a logged-in OpenELIS session MUST render the standalone help viewer (its own minimal header, side nav populated from manifest) and MUST NOT render the OpenELIS UIShell side menu or dashboard tiles. (FR-V-01, FR-V-01a, FR-V-02, FR-V-03)
5a. **Help tab respects deployment branding.** When `/rest/site-branding/` returns a custom logo, primary color, and site name (e.g., a Madagascar deployment with `primaryColor=#0f5e3b` and `headerLogoUrl=/rest/site-branding/logo/header`), the help tab's standalone header MUST render that same logo, apply that color to Carbon CSS variables visible in the help tab (active TOC entry, breadcrumb link, search focus ring), and read "[Site name] Help" in the brand area. Default branding MUST be shown when the endpoint is unavailable. (FR-V-01c, FR-V-01d)
6. **Deep linking works.** Navigating to `/help/part-1-navigating#how-to-login-to-openelis` MUST render that page and scroll the heading into view. Copying the URL and pasting in a new tab MUST reproduce the same view. (FR-V-04, FR-V-06)
7. **Search returns results.** Typing "login" in the search input MUST surface at least one result within 150ms (after the index has loaded). Clicking the result MUST navigate to the matching page. (FR-V-07)
8. **HelpMenu integration opens new tab.** Clicking the header `?` icon → "User Manual" MUST open `/help` in a new browser tab via `window.open`. The OpenELIS tab the user clicked from MUST remain unchanged on its current screen. (FR-I-02)
8a. **Return to OpenELIS works.** Clicking the "Return to OpenELIS" link in the help tab's header MUST close the help tab and return focus to the original OpenELIS tab (when opened from the menu). When the help URL was opened directly from a bookmark (no `window.opener`), the link MUST navigate to `/home` instead. (FR-V-01b)
9. **Legacy fallback honored.** With `org.openelisglobal.help.manual.useInApp=false` and the legacy URL property set, the "User Manual" button MUST resume `window.open` behavior. (FR-I-04)
10. **Offline behavior.** With Confluence Cloud blocked at the network level, opening the viewer MUST work normally — no network calls to Atlassian; only requests to same-origin `/help-content/...` paths. (NFR-01)
11. **a11y baseline.** Axe DevTools scan of `/help/part-1-navigating` MUST report zero critical or serious violations. (NFR-06)
12. **Locale fallback badge.** With `frontend/public/help-content/fr/` deleted and the active locale set to French, the viewer MUST load English content and render the `help.viewer.fallback.tag` Tag next to each page title. (FR-V-02)
13. **Narrow viewport (docked help tab).** At a 480px-wide viewport, the side rail MUST collapse behind a hamburger toggle in the standalone header, the main content MUST remain readable without horizontal scrolling, and the search input MUST remain reachable. Tested at 480px and 360px. (§5.1)

---

## 11. Out of Scope (deferred to later phases)

- **Contextual "help for this screen" launcher** — adding a `helpKey` prop to every OpenELIS page so the in-context help icon deep-links to the right help page. Designed but not implemented in v1.
- **Print-friendly view** of a single help page.
- **User feedback widget** ("Was this page helpful?") on each page.
- **Reading analytics** — usage tracking for which pages get viewed.
- **In-app editing or annotation.** Authors continue to edit in Confluence.
- **Cross-page full-text reading** — there is no "expand the whole manual into one page" view. Search serves that need.
- **Locales beyond English at launch.** The data model supports them; the second locale build-out (likely French) is a separate piece of work.
- **Plugin / instance-specific help.** Multi-tenant help-content overlays are not in scope.

---

## 12. Decisions log & remaining questions

### Decided

1. **Repository location** — Confirmed: pipeline at `frontend/scripts/help-refresh.mjs`, generated output at `frontend/public/help-content/<locale>/`, viewer component at `frontend/src/components/help/HelpViewer.jsx`. The implementing developer may adjust if the OpenELIS team has a stronger preference.
2. **Corpus root scope** — Decided: **User Manual subtree only** for v1. The Admin Manual subtree (which lives under the same Confluence folder `261455874` but is a sibling tree) is explicitly out of scope. FRS docs, developer docs, and DRAFT pages in the broader space are also excluded. Adding the Admin Manual is a candidate for a follow-on release once v1 is stable.
3. **Rollout strategy** — Decided: **phased via property kill-switch, default on**. v1 ships with `org.openelisglobal.help.manual.useInApp=true` so all deployments get the in-app viewer out of the box. Deployments that prefer to stay on the external PDF can flip the property to `false`. Avoids a hard cut while keeping the default user experience modern.

### Still open

4. **Authoring conventions.** Doc authors should commit to consistent prefixes for blockquote callouts (`Note:`, `Warning:`, `Verify:`, `Tip:`) and to attaching new screenshots through Confluence's native uploader (not pasting from Google Docs). Worth documenting in the authoring guide as a follow-up — owner: documentation team.

### Jira

No existing OpenELIS "Help Menu" epic exists. When ready to implement, a new story (and possibly a small parent epic) will be created in project **OGC** (OpenELIS Global Community). Suggested attributes:

- **Title:** "In-app Help Viewer — User Manual"
- **Issue type:** Story (or break into Epic + 3 child stories: Pipeline, Viewer, Integration)
- **Labels:** `help-menu`, `documentation`, `ui`, `global`, `frontend`
- **Closest existing umbrella:** OGC-305 ("OpenELIS UI and Navigation Improvements") — viable parent if a dedicated Help epic isn't created
- **Acceptance criteria:** copy section 10 of this FRS verbatim

---

## Appendix A — Glossary

| Term | Definition |
|---|---|
| **ADF** | Atlassian Document Format. The JSON representation Confluence Cloud uses for page bodies, returned by the REST v2 API with `body-format=atlas_doc_format`. |
| **Corpus** | The set of Confluence pages that the pipeline converts. For v1 this is the OpenELIS Global space's User Guide folder. |
| **Manifest** | The TOC + metadata JSON file emitted per locale by the pipeline. |
| **Slug** | A URL-safe identifier derived from a page title. Used as the routing parameter and the HTML filename. |
| **HelpKey** | A stable identifier (e.g. `orders.add-order`) applied as a Confluence label, used to match the same page across translated spaces. (Future, not in v1.) |
| **Locale fallback** | Behavior where if the active OpenELIS locale has no manifest, the viewer renders English content with a "Available in English only" badge. |
